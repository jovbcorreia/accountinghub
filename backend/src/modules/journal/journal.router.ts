import { Router } from 'express';
import { list, create, getById } from './journal.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', list);
router.post('/', requireRole('ADMIN', 'ACCOUNTANT'), create);
router.get('/:id', getById);
export default router;
