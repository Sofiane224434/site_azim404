import { Router } from 'express';
import {
  getAllStatus,
  getSiteStatus,
  checkMaintenanceStatus,
  renderMaintenanceScreen,
  saveSite,
  toggleSiteStatus,
  deleteSite,
  auditSiteHeaders,
} from '../controllers/status.controller.js';

const router = Router();

router.get('/', getAllStatus);
router.get('/check', checkMaintenanceStatus);
router.get('/maintenance-screen', renderMaintenanceScreen);
router.get('/audit-headers', auditSiteHeaders);
router.get('/lookup', getSiteStatus);
router.get('/:site', getSiteStatus);
router.post('/save', saveSite);
router.post('/toggle', toggleSiteStatus);
router.delete('/:id', deleteSite);

export default router;
