import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

type LineInput = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate: number;
};

function calcLine(line: LineInput) {
  const qty = Number(line.quantity);
  const price = Number(line.unitPrice);
  const disc = Number(line.discount || 0);
  const taxRate = Number(line.taxRate);
  const subtotal = qty * price * (1 - disc / 100);
  const taxAmount = subtotal * (taxRate / 100);
  return {
    description: line.description,
    productId: line.productId || null,
    quantity: new Decimal(qty),
    unitPrice: new Decimal(price),
    discount: new Decimal(disc),
    taxRate: new Decimal(taxRate),
    subtotal: new Decimal(subtotal.toFixed(2)),
    taxAmount: new Decimal(taxAmount.toFixed(2)),
    total: new Decimal((subtotal + taxAmount).toFixed(2)),
  };
}

async function nextInvoiceNumber(companyId: string, type: string): Promise<string> {
  const series = await prisma.documentSeries.findFirst({
    where: { companyId, type: type as never, year: new Date().getFullYear() },
  });
  if (!series) throw new AppError(`No document series configured for ${type}`);
  const number = `${series.prefix}${new Date().getFullYear()}/${String(series.nextNumber).padStart(4, '0')}`;
  await prisma.documentSeries.update({ where: { id: series.id }, data: { nextNumber: series.nextNumber + 1 } });
  return number;
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search = '', page = '1', pageSize = '20', status, type } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const where: Record<string, unknown> = {
      companyId: req.companyId,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(search ? { OR: [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]} : {}),
    };
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { issueDate: 'desc' },
        include: { customer: { select: { id: true, name: true, email: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { customerId, type = 'INVOICE', issueDate, dueDate, lines, notes } = req.body;
    if (!lines || lines.length === 0) throw new AppError('At least one line is required');

    const calcLines = lines.map(calcLine);
    const subtotal = calcLines.reduce((s: number, l: ReturnType<typeof calcLine>) => s + Number(l.subtotal), 0);
    const taxAmount = calcLines.reduce((s: number, l: ReturnType<typeof calcLine>) => s + Number(l.taxAmount), 0);
    const total = subtotal + taxAmount;

    const number = await nextInvoiceNumber(req.companyId!, type);

    const invoice = await prisma.invoice.create({
      data: {
        companyId: req.companyId!,
        customerId,
        number,
        type,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal: new Decimal(subtotal.toFixed(2)),
        taxAmount: new Decimal(taxAmount.toFixed(2)),
        total: new Decimal(total.toFixed(2)),
        notes,
        lines: { createMany: { data: calcLines } },
      },
      include: {
        lines: true,
        customer: { select: { id: true, name: true, email: true, taxId: true, address: true } },
      },
    });
    res.status(201).json(invoice);
  } catch (err) { next(err); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: {
        lines: { include: { product: true } },
        customer: true,
        payments: { orderBy: { date: 'desc' } },
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
}

export async function issue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status !== 'DRAFT') throw new AppError('Only DRAFT invoices can be issued');
    const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'ISSUED' } });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === 'CANCELLED') throw new AppError('Already cancelled');
    const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'CANCELLED' } });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function registerPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { amount, method, date, reference, notes } = req.body;
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (!['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
      throw new AppError('Invoice cannot receive payments in current status');
    }

    const paidAmount = Number(invoice.paidAmount) + Number(amount);
    const remaining = Number(invoice.total) - paidAmount;
    const status = remaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          companyId: req.companyId!,
          invoiceId: invoice.id,
          amount: new Decimal(amount),
          method,
          date: new Date(date),
          reference,
          notes,
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: new Decimal(paidAmount.toFixed(2)), status },
      }),
    ]);

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function getPdf(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'PDF generation requires Puppeteer — run locally with npm run dev' });
  } catch (err) { next(err); }
}

export async function sendEmail(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Email sending requires SMTP configuration' });
  } catch (err) { next(err); }
}
