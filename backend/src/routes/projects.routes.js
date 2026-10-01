import { Router } from 'express';
import { getProjects, saveProject, toggleVisibility, deleteProject } from '../controllers/projects.controller.js';

const router = Router();

router.get('/', getProjects);
router.post('/save', saveProject);
router.post('/toggle-visibility', toggleVisibility);
router.delete('/:id', deleteProject);

export default router;
