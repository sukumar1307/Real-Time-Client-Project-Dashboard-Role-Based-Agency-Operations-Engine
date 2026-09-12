import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, checkTaskAccess } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
} from '../validators/schemas.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', checkTaskAccess, getTaskById);

router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(createTaskSchema),
  createTask
);

router.patch(
  '/:id/status',
  checkTaskAccess,
  validateRequest(updateTaskStatusSchema),
  updateTaskStatus
);

router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  checkTaskAccess,
  validateRequest(updateTaskSchema),
  updateTask
);

router.delete(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  checkTaskAccess,
  deleteTask
);

export default router;
