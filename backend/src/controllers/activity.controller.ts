import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const getActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const projectId = req.query.projectId as string | undefined;

    let whereClause: any = {};

    // 1. Role Scoping
    if (user.role === Role.ADMIN) {
      if (projectId) {
        whereClause.projectId = projectId;
      }
    } else if (user.role === Role.PROJECT_MANAGER) {
      if (projectId) {
        whereClause.projectId = projectId;
        whereClause.project = { managerId: user.userId };
      } else {
        whereClause.project = { managerId: user.userId };
      }
    } else if (user.role === Role.DEVELOPER) {
      // Developer sees activity ONLY on tasks assigned to them
      if (projectId) {
        whereClause.projectId = projectId;
        whereClause.task = { assigneeId: user.userId };
      } else {
        whereClause.task = { assigneeId: user.userId };
      }
    }

    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        project: { select: { id: true, title: true } },
        task: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};
