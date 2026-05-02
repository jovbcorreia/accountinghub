import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

function signTokens(userId: string, companyId: string, role: string) {
  const accessExpiry = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
  const refreshExpiry = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  const access = jwt.sign(
    { userId, companyId, role },
    process.env.JWT_SECRET!,
    { expiresIn: accessExpiry }
  );
  const refresh = jwt.sign(
    { userId, companyId, role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: refreshExpiry }
  );
  return { access, refresh };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyName, taxId, email, password, name } = req.body;
    if (!companyName || !taxId || !email || !password || !name) {
      throw new AppError('All fields are required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already in use');

    const hash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        taxId,
        users: {
          create: {
            email,
            password: hash,
            name,
            role: 'ADMIN',
          },
        },
        taxRates: {
          createMany: {
            data: [
              { name: 'IVA 23%', rate: 23 },
              { name: 'IVA 13%', rate: 13 },
              { name: 'IVA 6%', rate: 6 },
              { name: 'Isento', rate: 0 },
            ],
          },
        },
        docSeries: {
          createMany: {
            data: [
              { type: 'INVOICE', prefix: 'FT', nextNumber: 1, year: new Date().getFullYear() },
              { type: 'RECEIPT', prefix: 'RC', nextNumber: 1, year: new Date().getFullYear() },
              { type: 'CREDIT_NOTE', prefix: 'NC', nextNumber: 1, year: new Date().getFullYear() },
              { type: 'QUOTE', prefix: 'OR', nextNumber: 1, year: new Date().getFullYear() },
            ],
          },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const tokens = signTokens(user.id, company.id, user.role);

    res.cookie('accessToken', tokens.access, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refresh, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      company: { id: company.id, name: company.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password required');

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const tokens = signTokens(user.id, user.companyId, user.role);

    res.cookie('accessToken', tokens.access, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refresh, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      company: { id: user.company.id, name: user.company.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      userId: string; companyId: string; role: string;
    };

    const tokens = signTokens(payload.userId, payload.companyId, payload.role);
    res.cookie('accessToken', tokens.access, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refresh, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true });
  } catch {
    next(new AppError('Invalid refresh token', 401));
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ ok: true });
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { company: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      company: { id: user.company.id, name: user.company.name, currency: user.company.currency },
    });
  } catch (err) {
    next(err);
  }
}
