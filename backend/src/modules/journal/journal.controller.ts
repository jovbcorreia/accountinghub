import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20', search = '' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const where = {
      companyId: req.companyId,
      ...(search ? { description: { contains: search, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { date: 'desc' },
        include: { lines: { include: { account: true } } },
      }),
      prisma.journalEntry.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { date, description, reference, lines } = req.body;
    if (!lines || lines.length < 2) throw new AppError('At least two lines required');

    const totalDebit = lines.reduce((s: number, l: { debit?: number }) => s + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((s: number, l: { credit?: number }) => s + Number(l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(`Journal entry must balance. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`);
    }

    const entry = await prisma.journalEntry.create({
      data: {
        companyId: req.companyId!,
        date: new Date(date),
        description,
        reference: reference || null,
        createdBy: req.userId!,
        lines: {
          createMany: {
            data: lines.map((l: { accountId: string; debit?: number; credit?: number; description?: string }) => ({
              accountId: l.accountId,
              debit: new Decimal(l.debit || 0),
              credit: new Decimal(l.credit || 0),
              description: l.description || null,
            })),
          },
        },
      },
      include: { lines: { include: { account: true } } },
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: { lines: { include: { account: true } } },
    });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (err) { next(err); }
}
