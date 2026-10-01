import { Router } from 'express';
import { getProjects, saveProject, deleteProject } from '../controllers/projects.controller.js';

const router = Router();

router.get('/', getProjects);
router.post('/save', saveProject);
router.delete('/:id', deleteProject);

export default router;
