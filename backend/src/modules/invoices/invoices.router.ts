import { Router } from 'express';
import { list, create, getById, issue, cancel, registerPayment, getPdf, sendEmail } from './invoices.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', list);
router.post('/', create);
router.get('/:id', getById);
router.post('/:id/issue', issue);
router.post('/:id/cancel', cancel);
router.post('/:id/payment', registerPayment);
router.get('/:id/pdf', getPdf);
router.post('/:id/send-email', sendEmail);
export default router;
