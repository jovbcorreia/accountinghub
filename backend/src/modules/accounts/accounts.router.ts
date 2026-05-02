import { Router } from 'express';
import { list, create, update, remove, seedSNC } from './accounts.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', list);
router.post('/', requireRole('ADMIN', 'ACCOUNTANT'), create);
router.put('/:id', requireRole('ADMIN', 'ACCOUNTANT'), update);
router.delete('/:id', requireRole('ADMIN'), remove);
router.post('/seed-snc', requireRole('ADMIN'), seedSNC);
export default router;
