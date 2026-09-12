import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Task, TaskStatus } from '../types';
import { StatCard } from '../components/StatCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Circle,
} from 'lucide-react';

const STATUS_OPTIONS: { key: TaskStatus; label: string }[] = [
  { key: 'TO_DO', label: 'TO DO' },
  { key: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { key: 'IN_REVIEW', label: 'IN REVIEW' },
  { key: 'DONE', label: 'DONE' },
];

// Fake subtasks for demo purposes
const FAKE_SUBTASKS: Record<string, { label: string; done: boolean }[]> = {};

function getPriorityClass(priority: string) {
  if (priority === 'CRITICAL') return 'priority-critical';
  if (priority === 'HIGH') return 'priority-high';
  if (priority === 'MEDIUM') return 'priority-medium';
  return 'priority-low';
}

export const DeveloperDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchStatsAndTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/developer');
      setStats(res.data.data);
      setTasks(res.data.data.assignedTasks || []);
    } catch (err) {
      console.error('Failed to fetch developer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      await fetchStatsAndTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '60px 0',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: '2px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        Loading Developer Workstation...
      </div>
    );
  }

  const totalTasks = tasks.length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Banner */}
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="page-hero-badge">
              <ShieldCheck size={10} />
              Developer Isolated Workstation
            </div>
            <h1 className="page-hero-title">Your Assigned Tasks &amp; Status Pipeline</h1>
            <p className="page-hero-desc">
              Focus exclusively on your deliverables, commit milestone updates, and prompt PMs for review.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: '#34d399',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite',
                }}
              />
              Sorted by Priority &amp; Due Date
            </div>
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 11,
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Sprint {new Date().getMonth() + 30}
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard
          title="Assigned Tasks"
          value={stats?.totalAssigned || 0}
          note={`+${Math.min(2, stats?.totalAssigned || 0)} new today`}
          subtitle="Tasks assigned strictly to you"
          icon={CheckSquare}
          color="emerald"
        />
        <StatCard
          title="In Review"
          value={stats?.tasksByStatus?.IN_REVIEW || 0}
          note="Feedback expected"
          subtitle="Awaiting Project Manager review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueCount || 0}
          badgeText={stats?.overdueCount > 0 ? 'Urgent Attention' : 'Zero Overdue'}
          badgeColor={stats?.overdueCount > 0 ? '#f43f5e' : '#10b981'}
          subtitle="Past due date - high priority"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Task Queue */}
        <div>
          <div className="section-header">
            <div className="section-title">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite',
                }}
              />
              Your Task Execution Queue
              <span className="section-badge">{totalTasks}</span>
            </div>
            <span className="section-meta">Sorted by impact factor</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                }}
              >
                <CheckSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>All caught up!</div>
                <div style={{ marginTop: 4 }}>No pending tasks currently assigned to you.</div>
              </div>
            ) : (
              tasks.map((task, i) => {
                const isOverdue = task.isOverdue;
                const pClass = getPriorityClass(task.priority);

                // Fake subtask data for demonstration
                const subs = FAKE_SUBTASKS[task.id] || [];
                const hasSubs = subs.length > 0;

                return (
                  <div
                    key={task.id}
                    className={`task-card ${pClass} ${isOverdue ? 'overdue' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Card Header */}
                    <div className="task-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                        {isOverdue && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'rgba(244,63,94,0.15)',
                              color: '#fb7185',
                              border: '1px solid rgba(244,63,94,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              animation: 'pulse 2s infinite',
                            }}
                          >
                            <AlertTriangle size={9} /> OVERDUE
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Due:{' '}
                        <strong style={{ color: isOverdue ? '#fb7185' : 'var(--text-secondary)' }}>
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </strong>
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="task-card-body">
                      <div className="task-title">{task.title}</div>
                      <div className="task-desc" style={{ WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                        {task.description}
                      </div>
                      {task.project && (
                        <div className="task-project-link">
                          <span style={{ fontSize: 10 }}>📁</span>
                          Project: <span>{task.project.title}</span>
                        </div>
                      )}

                      {/* Fake subtask progress for visual richness */}
                      {hasSubs && (
                        <div style={{ marginTop: 12 }}>
                          <div className="subtask-progress-label">
                            <span>Subtask Progress</span>
                            <span>{subs.filter((s) => s.done).length} of {subs.length} done ({Math.round((subs.filter((s) => s.done).length / subs.length) * 100)}%)</span>
                          </div>
                          <div className="progress-bar-track">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${(subs.filter((s) => s.done).length / subs.length) * 100}%` }}
                            />
                          </div>
                          <div className="subtask-chips">
                            {subs.map((s, si) => (
                              <span key={si} className={`subtask-chip ${s.done ? 'done' : ''}`}>
                                <span className="subtask-chip-dot">
                                  {s.done ? '✓' : '○'}
                                </span>
                                {s.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Status updater */}
                    <div className="task-card-footer">
                      <span className="status-label">UPDATE STATUS:</span>
                      <div className="status-tabs">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            className={`status-tab ${task.status === opt.key ? 'active' : ''}`}
                            disabled={updatingTaskId === task.id}
                            onClick={() => {
                              if (task.status !== opt.key) handleStatusChange(task.id, opt.key);
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ height: 'calc(100vh - 260px)', position: 'sticky', top: 0 }}>
          <ActivityFeed title="Your Assigned Task Activity" limit={20} />
        </div>
      </div>
    </div>
  );
};
