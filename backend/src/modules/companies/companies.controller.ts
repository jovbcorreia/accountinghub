import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

export async function getCompany(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    res.json(company);
  } catch (err) { next(err); }
}

export async function updateCompany(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, address, city, zipCode, country, email, phone, iban, currency } = req.body;
    const company = await prisma.company.update({
      where: { id: req.companyId },
      data: { name, address, city, zipCode, country, email, phone, iban, currency },
    });
    res.json(company);
  } catch (err) { next(err); }
}
