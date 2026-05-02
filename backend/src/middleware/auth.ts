import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  companyId?: string;
  role?: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('Unauthorized', 401));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      companyId: string;
      role: string;
    };
    req.userId = payload.userId;
    req.companyId = payload.companyId;
    req.role = payload.role;
    next();
  } catch {
    next(new AppError('Unauthorized', 401));
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return next(new AppError('Forbidden', 403));
    }
    next();
  };
}
