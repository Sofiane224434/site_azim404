import { Router } from 'express';
import {
  getContextInfo,
  saveContextContent,
  updateTargets,
  propagateContext,
} from '../controllers/context.controller.js';

const router = Router();

router.get('/', getContextInfo);
router.post('/save', saveContextContent);
router.post('/targets', updateTargets);
router.post('/sync', propagateContext);

export default router;
