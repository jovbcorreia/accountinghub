import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

type ExpenseLineInput = { description: string; quantity: number; unitPrice: number; taxRate: number; accountId?: string };

function calcLine(l: ExpenseLineInput) {
  const qty = Number(l.quantity);
  const price = Number(l.unitPrice);
  const taxRate = Number(l.taxRate);
  const subtotal = qty * price;
  return {
    description: l.description,
    quantity: new Decimal(qty),
    unitPrice: new Decimal(price),
    taxRate: new Decimal(taxRate),
    accountId: l.accountId || null,
    total: new Decimal((subtotal * (1 + taxRate / 100)).toFixed(2)),
  };
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search = '', page = '1', pageSize = '20', status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const where: Record<string, unknown> = {
      companyId: req.companyId,
      ...(status ? { status } : {}),
      ...(search ? { OR: [
        { number: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ]} : {}),
    };
    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { date: 'desc' },
        include: { supplier: { select: { id: true, name: true } } },
      }),
      prisma.expense.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { supplierId, number, date, dueDate, lines, notes } = req.body;
    if (!lines || lines.length === 0) throw new AppError('At least one line is required');
    const calcLines = lines.map(calcLine);
    const subtotal = calcLines.reduce((s: number, l: ReturnType<typeof calcLine>) => s + Number(l.quantity) * Number(l.unitPrice), 0);
    const taxAmount = calcLines.reduce((s: number, l: ReturnType<typeof calcLine>) => {
      const base = Number(l.quantity) * Number(l.unitPrice);
      return s + base * (Number(l.taxRate) / 100);
    }, 0);
    const total = subtotal + taxAmount;
    const expense = await prisma.expense.create({
      data: {
        companyId: req.companyId!,
        supplierId: supplierId || null,
        number: number || null,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: new Decimal(subtotal.toFixed(2)),
        taxAmount: new Decimal(taxAmount.toFixed(2)),
        total: new Decimal(total.toFixed(2)),
        notes,
        lines: { createMany: { data: calcLines } },
      },
      include: { lines: true, supplier: true },
    });
    res.status(201).json(expense);
  } catch (err) { next(err); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: { lines: true, supplier: true },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { supplierId, number, date, dueDate, notes } = req.body;
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { supplierId, number, date: date ? new Date(date) : undefined, dueDate: dueDate ? new Date(dueDate) : null, notes },
    });
    res.json(expense);
  } catch (err) { next(err); }
}

export async function markPaid(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id, companyId: req.companyId },
      data: { status: 'PAID' },
    });
    res.json(expense);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await prisma.expense.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!expense) throw new AppError('Expense not found', 404);
    await prisma.expense.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
