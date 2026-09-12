import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { PrismaClient, Role } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';

const prisma = new PrismaClient();

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    let whereClause: any = {};

    if (user.role === Role.PROJECT_MANAGER) {
      whereClause = { managerId: user.userId };
    } else if (user.role === Role.DEVELOPER) {
      whereClause = {
        tasks: {
          some: { assigneeId: user.userId },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, company: true } },
        manager: { select: { id: true, name: true, email: true } },
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            isOverdue: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Role-based authorization verification
    if (user.role === Role.PROJECT_MANAGER && project.managerId !== user.userId) {
      throw new ForbiddenError('You can only view projects managed by you');
    }

    let resultProject: any = { ...project };

    if (user.role === Role.DEVELOPER) {
      // Filter tasks to show ONLY assigned tasks for Developer
      const assignedTasks = project.tasks.filter((t) => t.assigneeId === user.userId);
      if (assignedTasks.length === 0) {
        throw new ForbiddenError('You are not assigned to any tasks in this project');
      }
      // Redact unassigned or other dev tasks for Developer role
      resultProject.tasks = assignedTasks;
    }

    return res.status(200).json({
      success: true,
      data: resultProject,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { title, description, clientId, managerId, status } = req.body;

    const assignedManagerId =
      user.role === Role.ADMIN ? managerId || user.userId : user.userId;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        clientId,
        managerId: assignedManagerId,
        status: status || 'ACTIVE',
      },
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      projectId: project.id,
      userId: user.userId,
      action: 'PROJECT_CREATED',
      formattedMessage: `${user.name} created Project "${project.title}"`,
    });

    return res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const { title, description, clientId, managerId, status } = req.body;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(clientId && { clientId }),
        ...(managerId && user.role === Role.ADMIN && { managerId }),
        ...(status && { status }),
      },
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      projectId: updated.id,
      userId: user.userId,
      action: 'PROJECT_UPDATED',
      formattedMessage: `${user.name} updated project "${updated.title}" details`,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
