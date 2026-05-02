import { Router } from 'express';
import { getCompany, updateCompany } from './companies.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getCompany);
router.put('/', updateCompany);
export default router;
