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
      prisma.customer.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { [sortBy]: order },
      }),
      prisma.customer.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, taxId, email, phone, address, city, zipCode, country, notes } = req.body;
    const customer = await prisma.customer.create({
      data: { name, taxId, email, phone, address, city, zipCode, country: country || 'PT', notes, companyId: req.companyId! },
    });
    res.status(201).json(customer);
  } catch (err) { next(err); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, companyId: req.companyId, deletedAt: null },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, number: true, status: true, total: true, dueDate: true, issueDate: true },
        },
      },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, taxId, email, phone, address, city, zipCode, country, notes } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, taxId, email, phone, address, city, zipCode, country, notes },
    });
    res.json(customer);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.customer.update({
      where: { id: req.params.id, companyId: req.companyId },
      data: { deletedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
