import { PrismaClient } from '@prisma/client';
import { socketService } from './socket.service.js';

const prisma = new PrismaClient();

interface LogActivityParams {
  projectId: string;
  taskId?: string;
  userId: string;
  action: string;
  details?: any;
  formattedMessage: string;
}

export const logActivity = async (params: LogActivityParams) => {
  const activity = await prisma.activityLog.create({
    data: {
      projectId: params.projectId,
      taskId: params.taskId || null,
      userId: params.userId,
      action: params.action,
      details: params.details || null,
      formattedMessage: params.formattedMessage,
    },
    include: {
      user: {
        select: { id: true, name: true, role: true, email: true },
      },
      project: {
        select: { id: true, title: true },
      },
      task: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  // Emit live WebSockets event to project room & admin room
  socketService.emitActivity(activity, params.projectId);

  return activity;
};
