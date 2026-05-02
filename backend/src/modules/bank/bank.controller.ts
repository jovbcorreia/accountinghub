import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

export async function listAccounts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { companyId: req.companyId },
      include: { _count: { select: { transactions: true } } },
    });
    res.json(accounts);
  } catch (err) { next(err); }
}

export async function createAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, iban, currency, balance } = req.body;
    const account = await prisma.bankAccount.create({
      data: { name, iban, currency: currency || 'EUR', balance: new Decimal(balance || 0), companyId: req.companyId! },
    });
    res.status(201).json(account);
  } catch (err) { next(err); }
}

export async function listTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [items, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: { bankAccountId: req.params.id, bankAccount: { companyId: req.companyId } },
        skip,
        take: parseInt(pageSize),
        orderBy: { date: 'desc' },
      }),
      prisma.bankTransaction.count({
        where: { bankAccountId: req.params.id, bankAccount: { companyId: req.companyId } },
      }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}

export async function addTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { date, description, amount, balance } = req.body;
    const tx = await prisma.bankTransaction.create({
      data: {
        bankAccountId: req.params.id,
        date: new Date(date),
        description,
        amount: new Decimal(amount),
        balance: new Decimal(balance),
      },
    });
    res.status(201).json(tx);
  } catch (err) { next(err); }
}
