import { Router } from 'express';
import { listUsers, createUser, updateUser, deleteUser } from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', listUsers);
router.post('/', requireRole('ADMIN'), createUser);
router.put('/:id', requireRole('ADMIN'), updateUser);
router.delete('/:id', requireRole('ADMIN'), deleteUser);
export default router;
