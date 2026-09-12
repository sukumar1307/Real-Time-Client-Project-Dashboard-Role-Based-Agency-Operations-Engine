import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

class SocketService {
  private io: Server | null = null;
  private activeUsers = new Map<string, number>(); // userId -> count of open socket connections

  public init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.CLIENT_ORIGIN,
        credentials: true,
      },
    });

    // Socket Authentication Middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication error: Token missing'));
        }

        const decoded = verifyAccessToken(token);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid or expired token'));
      }
    });

    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const user = socket.user;
      if (!user) return;

      console.log(`⚡ Socket connected: ${user.name} (${user.role}) [${socket.id}]`);

      // Increment active user connection count
      const count = this.activeUsers.get(user.userId) || 0;
      this.activeUsers.set(user.userId, count + 1);

      // Join personal user room for direct notifications
      socket.join(`user:${user.userId}`);

      // Join role room
      if (user.role === Role.ADMIN) {
        socket.join('role:admin');
      }

      // Join relevant project rooms based on role & permissions
      if (user.role === Role.ADMIN) {
        const allProjects = await prisma.project.findMany({ select: { id: true } });
        allProjects.forEach((p) => socket.join(`project:${p.id}`));
      } else if (user.role === Role.PROJECT_MANAGER) {
        const pmProjects = await prisma.project.findMany({
          where: { managerId: user.userId },
          select: { id: true },
        });
        pmProjects.forEach((p) => socket.join(`project:${p.id}`));
      } else if (user.role === Role.DEVELOPER) {
        const devTasks = await prisma.task.findMany({
          where: { assigneeId: user.userId },
          select: { projectId: true, id: true },
        });
        const projectIds = Array.from(new Set(devTasks.map((t) => t.projectId)));
        projectIds.forEach((pId) => socket.join(`project:${pId}`));
        devTasks.forEach((t) => socket.join(`task:${t.id}`));
      }

      // Broadcast active user presence update to Admin clients
      this.broadcastPresence();

      socket.on('join:project', (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${user.name} [${socket.id}]`);
        const currentCount = this.activeUsers.get(user.userId) || 1;
        if (currentCount <= 1) {
          this.activeUsers.delete(user.userId);
        } else {
          this.activeUsers.set(user.userId, currentCount - 1);
        }
        this.broadcastPresence();
      });
    });
  }

  public broadcastPresence() {
    if (!this.io) return;
    const onlineUserIds = Array.from(this.activeUsers.keys());
    const activeCount = onlineUserIds.length;

    this.io.to('role:admin').emit('presence:update', {
      activeCount,
      onlineUserIds,
    });
  }

  public emitActivity(activity: any, projectId: string) {
    if (!this.io) return;
    // Emit to specific project room (PMs and Devs viewing that project) AND admin room
    this.io.to(`project:${projectId}`).to('role:admin').emit('activity:new', activity);
  }

  public emitTaskUpdate(task: any, projectId: string) {
    if (!this.io) return;
    this.io.to(`project:${projectId}`).to('role:admin').emit('task:updated', task);
  }

  public emitNotification(userId: string, notification: any, unreadCount: number) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification:new', {
      notification,
      unreadCount,
    });
  }

  public emitNotificationCount(userId: string, unreadCount: number) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification:count', { unreadCount });
  }

  public getActiveUsersCount(): number {
    return this.activeUsers.size;
  }
}

export const socketService = new SocketService();
