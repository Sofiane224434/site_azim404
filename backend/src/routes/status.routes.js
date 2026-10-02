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
  auditObservatory,
  auditSSLLabs,
  getAuditSummary,
  auditFullSite,
  auditSystem,
} from '../controllers/status.controller.js';

const router = Router();

router.get('/', getAllStatus);
router.get('/check', checkMaintenanceStatus);
router.get('/maintenance-screen', renderMaintenanceScreen);
router.get('/audit-summary', getAuditSummary);
router.get('/audit-full', auditFullSite);
router.get('/audit-headers', auditSiteHeaders);
router.get('/audit-observatory', auditObservatory);
router.get('/audit-ssllabs', auditSSLLabs);
router.get('/audit-system', auditSystem);
router.get('/lookup', getSiteStatus);
router.get('/:site', getSiteStatus);
router.post('/save', saveSite);
router.post('/toggle', toggleSiteStatus);
router.delete('/:id', deleteSite);

export default router;
