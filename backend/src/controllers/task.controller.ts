import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { PrismaClient, Role, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';
import { socketService } from '../services/socket.service.js';

const prisma = new PrismaClient();

const STATUS_LABELS: Record<TaskStatus, string> = {
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const {
      status,
      priority,
      projectId,
      search,
      dueDateFrom,
      dueDateTo,
      isOverdue,
    } = req.query;

    const where: any = {};

    // 1. Role-based query scoping
    if (user.role === Role.DEVELOPER) {
      where.assigneeId = user.userId;
    } else if (user.role === Role.PROJECT_MANAGER) {
      where.project = { managerId: user.userId };
    }

    // 2. Filter query parameters
    if (status) {
      where.status = status as TaskStatus;
    }
    if (priority) {
      where.priority = priority as TaskPriority;
    }
    if (projectId) {
      where.projectId = projectId as string;
    }
    if (isOverdue !== undefined) {
      where.isOverdue = isOverdue === 'true';
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom as string);
      if (dueDateTo) where.dueDate.lte = new Date(dueDateTo as string);
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, managerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            managerId: true,
            manager: { select: { id: true, name: true, email: true } },
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        activityLogs: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role security check
    if (user.role === Role.DEVELOPER && task.assigneeId !== user.userId) {
      throw new ForbiddenError('You can only view tasks assigned to you');
    }
    if (user.role === Role.PROJECT_MANAGER && task.project.managerId !== user.userId) {
      throw new ForbiddenError('You can only view tasks in your projects');
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

    const parsedDueDate = new Date(dueDate);
    const isOverdue = parsedDueDate < new Date() && status !== TaskStatus.DONE;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId || null,
        createdById: user.userId,
        status: status || TaskStatus.TO_DO,
        priority: priority || TaskPriority.MEDIUM,
        dueDate: parsedDueDate,
        isOverdue,
      },
      include: {
        project: { select: { id: true, title: true, managerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // 1. Audit Log
    const assigneeName = task.assignee ? task.assignee.name : 'Unassigned';
    await logActivity({
      projectId: task.projectId,
      taskId: task.id,
      userId: user.userId,
      action: 'TASK_CREATED',
      details: { title: task.title, assigneeName },
      formattedMessage: `${user.name} created Task "${task.title}" (assigned to ${assigneeName})`,
    });

    // 2. Notification to Developer if assigned
    if (task.assigneeId) {
      const notification = await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          title: 'New Task Assigned 📋',
          message: `You have been assigned to task "${task.title}" in project "${task.project.title}".`,
          type: NotificationType.TASK_ASSIGNED,
          link: `/projects/${task.projectId}`,
        },
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: task.assigneeId, isRead: false },
      });
      socketService.emitNotification(task.assigneeId, notification, unreadCount);
    }

    socketService.emitTaskUpdate(task, task.projectId);

    return res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const { status: newStatus } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, managerId: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    const oldStatus = existingTask.status;
    if (oldStatus === newStatus) {
      return res.status(200).json({ success: true, data: existingTask });
    }

    const isNowDone = newStatus === TaskStatus.DONE;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        isOverdue: isNowDone ? false : existingTask.dueDate < new Date(),
      },
      include: {
        project: { select: { id: true, title: true, managerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // 1. Audit Log format: "Ravi moved Task #12 from In Progress → In Review"
    const oldLabel = STATUS_LABELS[oldStatus];
    const newLabel = STATUS_LABELS[newStatus as TaskStatus];
    const formattedMessage = `${user.name} moved Task "${updatedTask.title}" from ${oldLabel} → ${newLabel}`;

    await logActivity({
      projectId: updatedTask.projectId,
      taskId: updatedTask.id,
      userId: user.userId,
      action: 'TASK_STATUS_CHANGED',
      details: { oldStatus, newStatus, taskTitle: updatedTask.title },
      formattedMessage,
    });

    // 2. Notification to PM when task moved to IN_REVIEW
    if (newStatus === TaskStatus.IN_REVIEW && updatedTask.project.managerId) {
      const pmNotification = await prisma.notification.create({
        data: {
          userId: updatedTask.project.managerId,
          title: 'Task Submitted for Review 🔍',
          message: `${user.name} moved task "${updatedTask.title}" to In Review.`,
          type: NotificationType.TASK_IN_REVIEW,
          link: `/projects/${updatedTask.projectId}`,
        },
      });

      const unreadPm = await prisma.notification.count({
        where: { userId: updatedTask.project.managerId, isRead: false },
      });
      socketService.emitNotification(updatedTask.project.managerId, pmNotification, unreadPm);
    }

    // 3. Emit Socket Updates
    socketService.emitTaskUpdate(updatedTask, updatedTask.projectId);

    return res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const { title, description, assigneeId, status, priority, dueDate } = req.body;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, title: true, managerId: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    const updatedDueDate = dueDate ? new Date(dueDate) : existing.dueDate;
    const updatedStatus = status || existing.status;
    const isOverdue = updatedDueDate < new Date() && updatedStatus !== TaskStatus.DONE;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: updatedDueDate }),
        isOverdue,
      },
      include: {
        project: { select: { id: true, title: true, managerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify developer if assignee was newly changed
    if (assigneeId && assigneeId !== existing.assigneeId) {
      const devNotification = await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'Task Assigned to You 📌',
          message: `You were assigned to task "${updated.title}" in project "${updated.project.title}".`,
          type: NotificationType.TASK_ASSIGNED,
          link: `/projects/${updated.projectId}`,
        },
      });

      const unreadDev = await prisma.notification.count({
        where: { userId: assigneeId, isRead: false },
      });
      socketService.emitNotification(assigneeId, devNotification, unreadDev);
    }

    await logActivity({
      projectId: updated.projectId,
      taskId: updated.id,
      userId: user.userId,
      action: 'TASK_UPDATED',
      formattedMessage: `${user.name} updated details for Task "${updated.title}"`,
    });

    socketService.emitTaskUpdate(updated, updated.projectId);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task not found');

    await prisma.task.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
