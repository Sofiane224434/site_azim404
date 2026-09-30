import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { sendEmail, sendContactEmail } from '../controllers/email.controller.js';

const router = Router();

router.post('/contact', sendContactEmail);
router.post('/send', authMiddleware, sendEmail);

export default router;
