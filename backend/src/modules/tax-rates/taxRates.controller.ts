import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rates = await prisma.taxRate.findMany({ where: { companyId: req.companyId }, orderBy: { rate: 'desc' } });
    res.json(rates);
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, rate } = req.body;
    const taxRate = await prisma.taxRate.create({ data: { name, rate, companyId: req.companyId! } });
    res.status(201).json(taxRate);
  } catch (err) { next(err); }
}
