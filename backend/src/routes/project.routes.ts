import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, checkProjectAccess } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/schemas.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);

router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(createProjectSchema),
  createProject
);

router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  checkProjectAccess,
  validateRequest(updateProjectSchema),
  updateProject
);

router.delete(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  checkProjectAccess,
  deleteProject
);

export default router;
