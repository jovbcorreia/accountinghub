import { Router } from 'express';
import { list, create } from './taxRates.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', list);
router.post('/', create);
export default router;
