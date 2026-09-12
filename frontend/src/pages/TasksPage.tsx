import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Task, Project, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FilterBar } from '../components/FilterBar';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { TaskModal } from '../components/TaskModal';
import { CheckSquare, Plus, AlertTriangle, User } from 'lucide-react';

const STATUS_OPTIONS: { key: TaskStatus; label: string }[] = [
  { key: 'TO_DO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
];

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { updatedTask } = useSocket();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryStr = searchParams.toString();
      const url = queryStr ? `/tasks?${queryStr}` : '/tasks';
      const res = await api.get(url);
      setTasks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (err) {
      console.error('Failed to fetch projects list:', err);
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { fetchTasks(); }, [searchParams]);

  useEffect(() => {
    if (!updatedTask) return;
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === updatedTask.id);
      if (exists) return prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
      return [updatedTask, ...prev];
    });
  }, [updatedTask]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-hero-title" style={{ marginBottom: 4 }}>Agency Task Directory</h1>
            <p className="page-hero-desc">Filterable task queue with URL-synced shareable filters &amp; real-time WebSocket updates.</p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
            <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={13} /> Add New Task
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar showProjectSelect={user?.role !== 'DEVELOPER'} projects={projects} />

      {/* Task list */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          Loading Tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.3, color: '#818cf8' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>No matching tasks found</div>
          <div style={{ fontSize: 12 }}>Try clearing or adjusting your active filter parameters.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
                borderColor: task.isOverdue ? 'rgba(244,63,94,0.3)' : 'var(--border-color)',
                background: task.isOverdue ? 'rgba(244,63,94,0.03)' : 'var(--bg-card)',
              }}
            >
              {/* Left: badges + title + desc */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  {task.isOverdue && (
                    <span style={{ fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)', animation: 'pulse 2s infinite' }}>
                      <AlertTriangle size={9} /> OVERDUE
                    </span>
                  )}
                  {task.project && (
                    <span
                      onClick={() => navigate(`/projects/${task.projectId}`)}
                      style={{ fontSize: 10, fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 4, padding: '2px 7px', cursor: 'pointer' }}
                    >
                      📁 {task.project.title}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60ch' }}>
                  {task.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70ch' }}>
                  {task.description}
                </div>
              </div>

              {/* Right: assignee + due + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <User size={11} style={{ color: 'var(--text-muted)' }} />
                    {task.assignee?.name || 'Unassigned'}
                  </div>
                  <div style={{ fontSize: 10.5, marginTop: 2, color: task.isOverdue ? '#fb7185' : 'var(--text-muted)', fontWeight: task.isOverdue ? 700 : 400 }}>
                    Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  className="form-input"
                  style={{ width: 130, padding: '5px 10px', fontSize: 11.5 }}
                >
                  {STATUS_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSuccess={fetchTasks} />
    </div>
  );
};
