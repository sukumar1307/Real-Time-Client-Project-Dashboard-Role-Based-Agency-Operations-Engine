export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_IN_REVIEW' | 'TASK_OVERDUE' | 'GENERAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  _count?: { projects: number };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  client?: Client;
  managerId: string;
  manager?: User;
  status: ProjectStatus;
  tasks?: Task[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  project?: { id: string; title: string; managerId?: string };
  assigneeId?: string | null;
  assignee?: User | null;
  createdById: string;
  createdBy?: User;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  activityLogs?: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  project?: { id: string; title: string };
  taskId?: string | null;
  task?: { id: string; title: string; status: TaskStatus };
  userId: string;
  user: User;
  action: string;
  details?: any;
  formattedMessage: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  projectId?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  isOverdue?: boolean;
}
