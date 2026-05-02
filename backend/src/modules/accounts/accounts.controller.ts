import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const SNC_ACCOUNTS = [
  { code: '1', name: 'Meios Financeiros Líquidos', type: 'ASSET' },
  { code: '11', name: 'Caixa', type: 'ASSET' },
  { code: '12', name: 'Depósitos à Ordem', type: 'ASSET' },
  { code: '2', name: 'Contas a Receber e a Pagar', type: 'ASSET' },
  { code: '21', name: 'Clientes', type: 'ASSET' },
  { code: '22', name: 'Fornecedores', type: 'LIABILITY' },
  { code: '24', name: 'Estado e Outros Entes Públicos', type: 'LIABILITY' },
  { code: '241', name: 'Imposto sobre o Rendimento', type: 'LIABILITY' },
  { code: '2431', name: 'IVA — Suportado', type: 'ASSET' },
  { code: '2433', name: 'IVA — Liquidado', type: 'LIABILITY' },
  { code: '2435', name: 'IVA — Apuramento', type: 'LIABILITY' },
  { code: '3', name: 'Inventários e Ativos Biológicos', type: 'ASSET' },
  { code: '31', name: 'Compras', type: 'EXPENSE' },
  { code: '32', name: 'Mercadorias', type: 'ASSET' },
  { code: '4', name: 'Investimentos', type: 'ASSET' },
  { code: '43', name: 'Ativos Fixos Tangíveis', type: 'ASSET' },
  { code: '5', name: 'Capital, Reservas e Resultados', type: 'EQUITY' },
  { code: '51', name: 'Capital', type: 'EQUITY' },
  { code: '56', name: 'Resultados Transitados', type: 'EQUITY' },
  { code: '6', name: 'Gastos', type: 'EXPENSE' },
  { code: '61', name: 'Custo das Mercadorias Vendidas', type: 'EXPENSE' },
  { code: '62', name: 'Fornecimentos e Serviços Externos', type: 'EXPENSE' },
  { code: '63', name: 'Gastos com o Pessoal', type: 'EXPENSE' },
  { code: '64', name: 'Gastos de Depreciação e Amortização', type: 'EXPENSE' },
  { code: '68', name: 'Outros Gastos', type: 'EXPENSE' },
  { code: '7', name: 'Rendimentos', type: 'REVENUE' },
  { code: '71', name: 'Vendas', type: 'REVENUE' },
  { code: '72', name: 'Prestações de Serviços', type: 'REVENUE' },
  { code: '78', name: 'Outros Rendimentos', type: 'REVENUE' },
  { code: '8', name: 'Resultados', type: 'EQUITY' },
  { code: '81', name: 'Resultado Antes de Impostos', type: 'EQUITY' },
];

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId: req.companyId },
      orderBy: { code: 'asc' },
      include: { children: { orderBy: { code: 'asc' } } },
    });
    res.json(accounts);
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, name, type, parentId } = req.body;
    const account = await prisma.account.create({
      data: { code, name, type, parentId: parentId || null, companyId: req.companyId! },
    });
    res.status(201).json(account);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, name, type, parentId } = req.body;
    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: { code, name, type, parentId: parentId || null },
    });
    res.json(account);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.account.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

export async function seedSNC(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.account.count({ where: { companyId: req.companyId } });
    if (existing > 0) return res.json({ message: 'Accounts already seeded' });
    await prisma.account.createMany({
      data: SNC_ACCOUNTS.map(a => ({ ...a, companyId: req.companyId!, type: a.type as never })),
    });
    res.json({ message: `${SNC_ACCOUNTS.length} SNC accounts created` });
  } catch (err) { next(err); }
}
