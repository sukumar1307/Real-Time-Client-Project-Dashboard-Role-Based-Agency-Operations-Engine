import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Project, Task, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskModal } from '../components/TaskModal';
import { FolderKanban, Plus, ArrowLeft, Calendar, User, Building, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { updatedTask } = useSocket();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchProject = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Real-time WebSocket live updates for tasks in this project
  useEffect(() => {
    if (!updatedTask || !project) return;
    if (updatedTask.projectId === project.id) {
      setProject((prev) => {
        if (!prev) return prev;
        const exists = prev.tasks?.some((t) => t.id === updatedTask.id);
        const updatedTasks = exists
          ? prev.tasks?.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
          : [...(prev.tasks || []), updatedTask];
        return { ...prev, tasks: updatedTasks };
      });
    }
  }, [updatedTask]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchProject();
    } catch (err) {
      console.error('Failed to change task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
        Loading Project Workspace...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 w-16 h-16 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Access Denied or Project Not Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{error || 'Project does not exist or you lack role access permissions.'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const tasksByStatus = (status: TaskStatus) => {
    return project.tasks?.filter((t) => t.status === status) || [];
  };

  const columns: Array<{ status: TaskStatus; label: string; icon: any; color: string }> = [
    { status: 'TO_DO', label: 'To Do', icon: Clock, color: 'text-slate-400' },
    { status: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'text-amber-400' },
    { status: 'IN_REVIEW', label: 'In Review', icon: CheckCircle2, color: 'text-blue-400' },
    { status: 'DONE', label: 'Done', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back Button & Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects List
        </button>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight">{project.title}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">{project.description}</p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
              {project.client && (
                <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  Client: <strong className="text-white">{project.client.name}</strong> ({project.client.company})
                </span>
              )}

              {project.manager && (
                <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  Manager: <strong className="text-white">{project.manager.name}</strong>
                </span>
              )}
            </div>
          </div>

          {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Task to Project
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            Project Kanban Board
          </h3>
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Socket Sync Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {columns.map((col) => {
            const colTasks = tasksByStatus(col.status);
            const Icon = col.icon;
            return (
              <div key={col.status} className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col min-h-[480px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${col.color}`} />
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">{col.label}</h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-600 text-xs border border-dashed border-slate-800/80 rounded-xl">
                      No tasks in {col.label}
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl glass-card border transition-all ${
                          t.isOverdue ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <PriorityBadge priority={t.priority} />
                          {t.isOverdue && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              OVERDUE
                            </span>
                          )}
                        </div>

                        <h5 className="text-xs font-bold text-white">{t.title}</h5>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{t.description}</p>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            👤 {t.assignee?.name || 'Unassigned'}
                          </span>
                          <span className={t.isOverdue ? 'text-rose-400 font-bold' : ''}>
                            {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Move Status Buttons */}
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value as TaskStatus)}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="TO_DO">Move to To Do</option>
                            <option value="IN_PROGRESS">Move to In Progress</option>
                            <option value="IN_REVIEW">Move to In Review</option>
                            <option value="DONE">Move to Done</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Activity Feed */}
      <div className="min-h-[350px]">
        <ActivityFeed projectId={project.id} title={`Activity Feed for ${project.title}`} limit={20} />
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={fetchProject}
        initialProjectId={project.id}
        taskToEdit={editingTask}
      />
    </div>
  );
};
