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
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: parseInt(pageSize), orderBy: { [sortBy]: order } }),
      prisma.supplier.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, taxId, email, phone, address, city, zipCode, country, notes } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, taxId, email, phone, address, city, zipCode, country: country || 'PT', notes, companyId: req.companyId! },
    });
    res.status(201).json(supplier);
  } catch (err) { next(err); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, companyId: req.companyId, deletedAt: null },
      include: {
        expenses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, number: true, status: true, total: true, dueDate: true, date: true },
        },
      },
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, taxId, email, phone, address, city, zipCode, country, notes } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { name, taxId, email, phone, address, city, zipCode, country, notes },
    });
    res.json(supplier);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.supplier.update({
      where: { id: req.params.id, companyId: req.companyId },
      data: { deletedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
