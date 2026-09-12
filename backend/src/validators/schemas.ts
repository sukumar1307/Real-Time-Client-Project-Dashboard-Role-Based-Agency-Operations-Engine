import { z } from 'zod';
import { Role, ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    clientId: z.string().uuid('Invalid client ID'),
    managerId: z.string().uuid('Invalid manager ID').optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    clientId: z.string().uuid().optional(),
    managerId: z.string().uuid().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Task title is required'),
    description: z.string().min(2, 'Description is required'),
    projectId: z.string().uuid('Invalid project ID'),
    assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime({ message: 'Invalid ISO date format' }),
  }),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TaskStatus),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().optional(),
  }),
});
