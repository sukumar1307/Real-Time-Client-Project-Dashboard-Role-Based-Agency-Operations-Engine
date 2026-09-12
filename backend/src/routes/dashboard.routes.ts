import { Router } from 'express';
import {
  getAdminDashboardStats,
  getPMDashboardStats,
  getDeveloperDashboardStats,
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/admin', requireRole(Role.ADMIN), getAdminDashboardStats);
router.get('/pm', requireRole(Role.PROJECT_MANAGER), getPMDashboardStats);
router.get('/developer', requireRole(Role.DEVELOPER), getDeveloperDashboardStats);

export default router;
