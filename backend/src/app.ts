import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.router';
import customersRouter from './modules/customers/customers.router';
import suppliersRouter from './modules/suppliers/suppliers.router';
import productsRouter from './modules/products/products.router';
import invoicesRouter from './modules/invoices/invoices.router';
import paymentsRouter from './modules/payments/payments.router';
import expensesRouter from './modules/expenses/expenses.router';
import accountsRouter from './modules/accounts/accounts.router';
import journalRouter from './modules/journal/journal.router';
import reportsRouter from './modules/reports/reports.router';
import bankRouter from './modules/bank/bank.router';
import companiesRouter from './modules/companies/companies.router';
import usersRouter from './modules/users/users.router';
import taxRatesRouter from './modules/tax-rates/taxRates.router';

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/products', productsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/journal', journalRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/bank', bankRouter);
app.use('/api/tax-rates', taxRatesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
