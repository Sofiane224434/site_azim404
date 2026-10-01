import { Router } from 'express';
import { getAllStatus, getSiteStatus, toggleSiteStatus } from '../controllers/status.controller.js';

const router = Router();

router.get('/', getAllStatus);
router.get('/:site', getSiteStatus);
router.post('/toggle', toggleSiteStatus);

export default router;
