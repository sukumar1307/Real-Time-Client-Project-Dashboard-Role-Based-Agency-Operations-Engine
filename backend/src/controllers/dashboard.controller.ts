import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import { socketService } from '../services/socket.service.js';

const prisma = new PrismaClient();

export const getAdminDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalProjects,
      totalTasks,
      tasksByStatusRaw,
      overdueCount,
      totalUsers,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.task.count({ where: { isOverdue: true } }),
      prisma.user.count(),
    ]);

    const tasksByStatus = {
      TO_DO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    tasksByStatusRaw.forEach((item) => {
      tasksByStatus[item.status] = item._count.status;
    });

    const activeOnlineUsers = socketService.getActiveUsersCount();

    return res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalTasks,
        tasksByStatus,
        overdueCount,
        totalUsers,
        activeOnlineUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPMDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const projects = await prisma.project.findMany({
      where: { managerId: user.userId },
      select: { id: true, title: true, status: true, _count: { select: { tasks: true } } },
    });

    const projectIds = projects.map((p) => p.id);

    const [tasksByPriorityRaw, upcomingTasks, overdueCount] = await Promise.all([
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId: { in: projectIds } },
        _count: { priority: true },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          dueDate: { gte: now, lte: nextWeek },
          status: { not: TaskStatus.DONE },
        },
        include: {
          project: { select: { title: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          isOverdue: true,
        },
      }),
    ]);

    const tasksByPriority = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    tasksByPriorityRaw.forEach((item) => {
      tasksByPriority[item.priority] = item._count.priority;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalProjects: projects.length,
        projects,
        tasksByPriority,
        upcomingTasks,
        overdueCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDeveloperDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const [tasksByStatusRaw, assignedTasks, overdueCount] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { assigneeId: user.userId },
        _count: { status: true },
      }),
      prisma.task.findMany({
        where: { assigneeId: user.userId },
        include: {
          project: { select: { id: true, title: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
      }),
      prisma.task.count({
        where: {
          assigneeId: user.userId,
          isOverdue: true,
        },
      }),
    ]);

    const tasksByStatus = {
      TO_DO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    tasksByStatusRaw.forEach((item) => {
      tasksByStatus[item.status] = item._count.status;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAssigned: assignedTasks.length,
        tasksByStatus,
        overdueCount,
        assignedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};
