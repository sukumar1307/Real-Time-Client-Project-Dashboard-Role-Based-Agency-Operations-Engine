import React from 'react';
import { Role, TaskStatus, TaskPriority, ProjectStatus } from '../types';

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const cls =
    role === 'ADMIN' ? 'role-badge role-admin' :
    role === 'PROJECT_MANAGER' ? 'role-badge role-pm' :
    'role-badge role-dev';

  const label =
    role === 'ADMIN' ? 'Admin' :
    role === 'PROJECT_MANAGER' ? 'PM' :
    'Developer';

  return <span className={cls}>{label}</span>;
};

export const StatusBadge: React.FC<{ status: TaskStatus | ProjectStatus }> = ({ status }) => {
  const cls: Record<string, string> = {
    TO_DO: 'status-badge status-todo',
    IN_PROGRESS: 'status-badge status-in-progress',
    IN_REVIEW: 'status-badge status-in-review',
    DONE: 'status-badge status-done',
    PLANNING: 'status-badge status-todo',
    ACTIVE: 'status-badge status-in-progress',
    COMPLETED: 'status-badge status-done',
    ON_HOLD: 'status-badge status-in-review',
  };

  const dot: Record<string, string> = {
    TO_DO: '#94a3b8',
    IN_PROGRESS: '#818cf8',
    IN_REVIEW: '#fbbf24',
    DONE: '#34d399',
    PLANNING: '#94a3b8',
    ACTIVE: '#818cf8',
    COMPLETED: '#34d399',
    ON_HOLD: '#fbbf24',
  };

  const label = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span className={cls[status] || 'status-badge status-todo'}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: dot[status] || '#94a3b8',
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const cls: Record<TaskPriority, string> = {
    LOW: 'priority-badge priority-low',
    MEDIUM: 'priority-badge priority-medium',
    HIGH: 'priority-badge priority-high',
    CRITICAL: 'priority-badge priority-critical',
  };

  return <span className={cls[priority]}>{priority}</span>;
};

export const ProjectStatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const cls: Record<string, string> = {
    PLANNING: 'project-status project-status-planning',
    ACTIVE: 'project-status project-status-active',
    COMPLETED: 'project-status project-status-completed',
    ON_HOLD: 'project-status project-status-on-hold',
  };
  const label = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  return <span className={cls[status] || 'project-status project-status-planning'}>{label}</span>;
};
