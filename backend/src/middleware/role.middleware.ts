import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { Role, PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

const prisma = new PrismaClient();

// Restricts route to specific roles
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User context missing'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorized to access this route.`
        )
      );
    }
    next();
  };
};

// Ensures PM can only manage their own project, Admin can manage any
export const checkProjectAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) return next(new ForbiddenError('User context missing'));

    // Admin has access to all projects
    if (user.role === Role.ADMIN) {
      return next();
    }

    // Developer cannot manage projects at all
    if (user.role === Role.DEVELOPER) {
      return next(new ForbiddenError('Developers cannot modify or manage projects'));
    }

    const projectId = (req.params.id || req.params.projectId || req.body.projectId) as string | undefined;
    if (!projectId) {
      return next();
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { managerId: true },
    });

    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    if (user.role === Role.PROJECT_MANAGER && project.managerId !== user.userId) {
      return next(new ForbiddenError('You can only manage projects assigned to you'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Ensures Developer can only interact with tasks assigned to them, PM with tasks in their projects, Admin with any
export const checkTaskAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) return next(new ForbiddenError('User context missing'));

    if (user.role === Role.ADMIN) {
      return next();
    }

    const taskId = (req.params.id || req.params.taskId) as string | undefined;
    if (!taskId) return next();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { managerId: true } } },
    });

    if (!task) {
      return next(new NotFoundError('Task not found'));
    }

    if (user.role === Role.DEVELOPER) {
      if (task.assigneeId !== user.userId) {
        return next(new ForbiddenError('Developers can only view/update tasks assigned to them'));
      }
    }

    if (user.role === Role.PROJECT_MANAGER) {
      if (task.project.managerId !== user.userId) {
        return next(new ForbiddenError('Project Managers can only manage tasks in their own projects'));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
