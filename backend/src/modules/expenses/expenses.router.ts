import { Router } from 'express';
import { list, create, getById, update, markPaid, remove } from './expenses.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', list);
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.post('/:id/pay', markPaid);
router.delete('/:id', remove);
export default router;
