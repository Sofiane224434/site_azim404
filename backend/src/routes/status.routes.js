import { Router } from 'express';
import {
  getAllStatus,
  getSiteStatus,
  saveSite,
  toggleSiteStatus,
  deleteSite,
} from '../controllers/status.controller.js';

const router = Router();

router.get('/', getAllStatus);
router.get('/lookup', getSiteStatus);
router.get('/:site', getSiteStatus);
router.post('/save', saveSite);
router.post('/toggle', toggleSiteStatus);
router.delete('/:id', deleteSite);

export default router;
