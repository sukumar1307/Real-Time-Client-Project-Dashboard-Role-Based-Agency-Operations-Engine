import { Router } from 'express';
import { getClients, createClient } from '../controllers/client.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.get('/', getClients);
router.post('/', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), createClient);

export default router;
