import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.companyId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (err) { next(err); }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already in use');
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, name, role, companyId: req.companyId! },
      select: { id: true, email: true, name: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, role, password } = req.body;
    const data: Record<string, unknown> = { name, role };
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.params.id, companyId: req.companyId },
      data,
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(user);
  } catch (err) { next(err); }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.params.id === req.userId) throw new AppError('Cannot delete yourself');
    await prisma.user.delete({ where: { id: req.params.id, companyId: req.companyId } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
