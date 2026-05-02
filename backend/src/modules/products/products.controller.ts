import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search = '', page = '1', pageSize = '20', sortBy = 'name', order = 'asc' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const where = {
      companyId: req.companyId,
      deletedAt: null,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: parseInt(pageSize), orderBy: { [sortBy]: order }, include: { taxRate: true } }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, name, description, price, unit, taxRateId, category, stock } = req.body;
    const product = await prisma.product.create({
      data: { code, name, description, price, unit: unit || 'un', taxRateId, category, stock, companyId: req.companyId! },
      include: { taxRate: true },
    });
    res.status(201).json(product);
  } catch (err) { next(err); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, companyId: req.companyId, deletedAt: null },
      include: { taxRate: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, name, description, price, unit, taxRateId, category, stock } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { code, name, description, price, unit, taxRateId, category, stock },
      include: { taxRate: true },
    });
    res.json(product);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.product.update({
      where: { id: req.params.id, companyId: req.companyId },
      data: { deletedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
