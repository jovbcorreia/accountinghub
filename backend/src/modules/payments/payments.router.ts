import { Router } from 'express';
import { list } from './payments.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', list);
export default router;
