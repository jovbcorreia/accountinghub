import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

export async function dashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthlyRevenue, monthlyExpenses, overdueInvoices, recentInvoices, chartData] = await Promise.all([
      prisma.invoice.aggregate({
        where: { companyId: req.companyId, status: { in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] }, issueDate: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { companyId: req.companyId, status: { not: 'CANCELLED' }, date: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: { companyId: req.companyId, status: 'OVERDUE' },
      }),
      prisma.invoice.findMany({
        where: { companyId: req.companyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
      // Last 12 months revenue/expenses
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          return Promise.all([
            prisma.invoice.aggregate({
              where: { companyId: req.companyId, status: { in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] }, issueDate: { gte: d, lte: end } },
              _sum: { total: true },
            }),
            prisma.expense.aggregate({
              where: { companyId: req.companyId, status: { not: 'CANCELLED' }, date: { gte: d, lte: end } },
              _sum: { total: true },
            }),
          ]).then(([rev, exp]) => ({
            month: d.toLocaleString('pt-PT', { month: 'short', year: '2-digit' }),
            revenue: Number(rev._sum.total || 0),
            expenses: Number(exp._sum.total || 0),
          }));
        })
      ),
    ]);

    const revenue = Number(monthlyRevenue._sum.total || 0);
    const expenses = Number(monthlyExpenses._sum.total || 0);

    // Accounts receivable: issued + partially_paid
    const ar = await prisma.invoice.aggregate({
      where: { companyId: req.companyId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
      _sum: { total: true, paidAmount: true },
    });
    const accountsReceivable = Number(ar._sum.total || 0) - Number(ar._sum.paidAmount || 0);

    // YTD
    const ytdRevenue = await prisma.invoice.aggregate({
      where: { companyId: req.companyId, status: { in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] }, issueDate: { gte: startOfYear } },
      _sum: { total: true },
    });
    const ytdExpenses = await prisma.expense.aggregate({
      where: { companyId: req.companyId, status: { not: 'CANCELLED' }, date: { gte: startOfYear } },
      _sum: { total: true },
    });

    res.json({
      kpis: {
        monthlyRevenue: revenue,
        monthlyExpenses: expenses,
        monthlyProfit: revenue - expenses,
        accountsReceivable,
        overdueInvoices,
        ytdRevenue: Number(ytdRevenue._sum.total || 0),
        ytdExpenses: Number(ytdExpenses._sum.total || 0),
      },
      recentInvoices,
      chartData,
    });
  } catch (err) { next(err); }
}

export async function trialBalance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId: req.companyId },
      include: {
        journalLines: {
          select: { debit: true, credit: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    const rows = accounts.map(a => {
      const debit = a.journalLines.reduce((s, l) => s + Number(l.debit), 0);
      const credit = a.journalLines.reduce((s, l) => s + Number(l.credit), 0);
      return { code: a.code, name: a.name, type: a.type, debit, credit, balance: debit - credit };
    }).filter(r => r.debit !== 0 || r.credit !== 0);

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    res.json({ rows, totalDebit, totalCredit });
  } catch (err) { next(err); }
}

export async function profitLoss(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { year = String(new Date().getFullYear()) } = req.query as Record<string, string>;
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31);

    const revenue = await prisma.invoice.aggregate({
      where: {
        companyId: req.companyId,
        status: { in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] },
        issueDate: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true, taxAmount: true, total: true },
    });

    const expenses = await prisma.expense.aggregate({
      where: {
        companyId: req.companyId,
        status: { not: 'CANCELLED' },
        date: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true, total: true },
    });

    const totalRevenue = Number(revenue._sum.total || 0);
    const totalExpenses = Number(expenses._sum.total || 0);

    res.json({
      year: parseInt(year),
      revenue: {
        subtotal: Number(revenue._sum.subtotal || 0),
        tax: Number(revenue._sum.taxAmount || 0),
        total: totalRevenue,
      },
      expenses: {
        subtotal: Number(expenses._sum.subtotal || 0),
        total: totalExpenses,
      },
      profit: totalRevenue - totalExpenses,
    });
  } catch (err) { next(err); }
}

export async function vatReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { year = String(new Date().getFullYear()), quarter } = req.query as Record<string, string>;
    const yr = parseInt(year);
    let startDate: Date, endDate: Date;
    if (quarter) {
      const q = parseInt(quarter);
      startDate = new Date(yr, (q - 1) * 3, 1);
      endDate = new Date(yr, q * 3, 0);
    } else {
      startDate = new Date(yr, 0, 1);
      endDate = new Date(yr, 11, 31);
    }

    const invoiceLines = await prisma.invoiceLine.findMany({
      where: {
        invoice: {
          companyId: req.companyId,
          status: { in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] },
          issueDate: { gte: startDate, lte: endDate },
        },
      },
      select: { taxRate: true, subtotal: true, taxAmount: true },
    });

    const expenseLines = await prisma.expenseLine.findMany({
      where: {
        expense: {
          companyId: req.companyId,
          status: { not: 'CANCELLED' },
          date: { gte: startDate, lte: endDate },
        },
      },
      select: { taxRate: true, quantity: true, unitPrice: true },
    });

    const groupByRate = (lines: { taxRate: unknown; subtotal?: unknown; taxAmount?: unknown; quantity?: unknown; unitPrice?: unknown }[]) => {
      const map = new Map<string, { base: number; tax: number }>();
      for (const l of lines) {
        const rate = String(l.taxRate);
        if (!map.has(rate)) map.set(rate, { base: 0, tax: 0 });
        const entry = map.get(rate)!;
        if ('subtotal' in l) {
          entry.base += Number(l.subtotal);
          entry.tax += Number(l.taxAmount);
        } else {
          const base = Number(l.quantity) * Number(l.unitPrice);
          entry.base += base;
          entry.tax += base * (Number(l.taxRate) / 100);
        }
      }
      return Array.from(map.entries()).map(([rate, v]) => ({ rate: Number(rate), ...v }));
    };

    res.json({
      period: { year: yr, quarter: quarter ? parseInt(quarter) : null, startDate, endDate },
      outputVAT: groupByRate(invoiceLines as Parameters<typeof groupByRate>[0]),
      inputVAT: groupByRate(expenseLines as Parameters<typeof groupByRate>[0]),
      totalOutput: invoiceLines.reduce((s, l) => s + Number(l.taxAmount), 0),
      totalInput: expenseLines.reduce((s, l) => {
        const base = Number(l.quantity) * Number(l.unitPrice);
        return s + base * (Number(l.taxRate) / 100);
      }, 0),
    });
  } catch (err) { next(err); }
}
