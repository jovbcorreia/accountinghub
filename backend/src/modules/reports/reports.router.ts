import { Router } from 'express';
import { dashboard, trialBalance, profitLoss, vatReport } from './reports.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/dashboard', dashboard);
router.get('/trial-balance', trialBalance);
router.get('/profit-loss', profitLoss);
router.get('/vat', vatReport);
export default router;
