import { Router } from 'express';
import {
  getContextInfo,
  saveContextContent,
  updateTargets,
  propagateContext,
  getContextBundle,
  addTarget,
  deleteTarget,
} from '../controllers/context.controller.js';

const router = Router();

router.get('/', getContextInfo);
router.get('/bundle', getContextBundle);
router.post('/save', saveContextContent);
router.post('/targets', updateTargets);
router.post('/targets/add', addTarget);
router.delete('/targets/:id', deleteTarget);
router.post('/sync', propagateContext);

export default router;
