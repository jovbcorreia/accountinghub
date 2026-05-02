import { Router } from 'express';
import { listAccounts, createAccount, listTransactions, addTransaction } from './bank.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/accounts', listAccounts);
router.post('/accounts', createAccount);
router.get('/accounts/:id/transactions', listTransactions);
router.post('/accounts/:id/transactions', addTransaction);
export default router;
