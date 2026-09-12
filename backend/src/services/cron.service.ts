import cron from 'node-cron';
import { PrismaClient, NotificationType, TaskStatus } from '@prisma/client';
import { logActivity } from './activity.service.js';
import { socketService } from './socket.service.js';

const prisma = new PrismaClient();

export const initOverdueTaskCron = () => {
  console.log('⏱️ Initializing Overdue Task Background Cron Scheduler...');

  // Run every minute
  cron.schedule('*/1 * * * *', async () => {
    try {
      const now = new Date();

      // Find tasks past due date, not done, and not already marked overdue
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
          isOverdue: false,
        },
        include: {
          project: { select: { id: true, title: true, managerId: true } },
          assignee: { select: { id: true, name: true } },
        },
      });

      if (overdueTasks.length === 0) return;

      console.log(`🔍 Cron found ${overdueTasks.length} newly overdue tasks.`);

      for (const task of overdueTasks) {
        // 1. Update task in DB
        const updatedTask = await prisma.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
        });

        // 2. Log Activity
        await logActivity({
          projectId: task.projectId,
          taskId: task.id,
          userId: task.project.managerId, // Attribute to project manager / system
          action: 'TASK_OVERDUE',
          details: { isOverdue: true, dueDate: task.dueDate },
          formattedMessage: `System flagged Task "${task.title}" as OVERDUE`,
        });

        // 3. Create Notifications
        if (task.assigneeId) {
          const devNotification = await prisma.notification.create({
            data: {
              userId: task.assigneeId,
              title: 'Task Overdue Alert ⚠️',
              message: `Task "${task.title}" in project "${task.project.title}" is past its due date!`,
              type: NotificationType.TASK_OVERDUE,
              link: `/projects/${task.projectId}`,
            },
          });

          const unreadDev = await prisma.notification.count({
            where: { userId: task.assigneeId, isRead: false },
          });
          socketService.emitNotification(task.assigneeId, devNotification, unreadDev);
        }

        // Notify Project Manager
        const pmNotification = await prisma.notification.create({
          data: {
            userId: task.project.managerId,
            title: 'Team Task Overdue ⚠️',
            message: `Task "${task.title}" assigned to ${task.assignee?.name || 'Unassigned'} is now overdue!`,
            type: NotificationType.TASK_OVERDUE,
            link: `/projects/${task.projectId}`,
          },
        });

        const unreadPm = await prisma.notification.count({
          where: { userId: task.project.managerId, isRead: false },
        });
        socketService.emitNotification(task.project.managerId, pmNotification, unreadPm);

        // 4. Emit live task update
        socketService.emitTaskUpdate(updatedTask, task.projectId);
      }
    } catch (error) {
      console.error('❌ Error executing overdue task cron job:', error);
    }
  });
};
