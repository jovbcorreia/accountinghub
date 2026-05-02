import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const where = { companyId: req.companyId };
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { date: 'desc' },
        include: { invoice: { select: { number: true, customer: { select: { name: true } } } } },
      }),
      prisma.payment.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}
