import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { FolderKanban, Clock, Plus, ShieldCheck, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: 'rgba(244,63,94,0.1)', text: '#fb7185' },
  HIGH: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24' },
  MEDIUM: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8' },
  LOW: { bg: 'rgba(16,185,129,0.08)', text: '#34d399' },
};

export const PMDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/pm');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch PM stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        Loading PM Dashboard...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="page-hero-badge">
              <ShieldCheck size={10} />
              Project Manager Scope Isolated
            </div>
            <h1 className="page-hero-title">Team Projects &amp; Task Command</h1>
            <p className="page-hero-desc">
              Manage assigned client deliverables, assign developer tasks, and track team progress.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setIsProjectModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={13} /> Create Project
            </button>
            <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-secondary btn-sm">
              <Plus size={13} /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard
          title="Managed Projects"
          value={stats?.totalProjects || 0}
          subtitle="Projects assigned to your management"
          icon={FolderKanban}
          color="indigo"
        />
        <StatCard
          title="Due This Week"
          value={stats?.upcomingTasks?.length || 0}
          subtitle="Tasks due in the next 7 days"
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Overdue Team Tasks"
          value={stats?.overdueCount || 0}
          subtitle="Needs immediate developer attention"
          icon={AlertTriangle}
          color="rose"
          badgeText={stats?.overdueCount > 0 ? 'Overdue Flagged' : 'On Schedule'}
          badgeColor={stats?.overdueCount > 0 ? '#f43f5e' : '#10b981'}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Left: Projects + Priority breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Projects list */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderKanban size={14} color="#818cf8" />
              Your Managed Projects
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats?.projects?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>No projects assigned yet.</div>
              ) : (
                stats?.projects?.map((proj: any) => (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{proj.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{proj._count?.tasks || 0} Tasks</div>
                    </div>
                    <StatusBadge status={proj.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>
              Tasks by Priority
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => {
                const c = PRIORITY_COLORS[p];
                return (
                  <div key={p} style={{ padding: '10px', background: c.bg, border: `1px solid ${c.text}22`, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: c.text, textTransform: 'uppercase', marginBottom: 4 }}>{p}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.tasksByPriority?.[p] || 0}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Upcoming + Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Upcoming tasks */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#a78bfa" />
              Upcoming Due Dates This Week
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats?.upcomingTasks?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>No upcoming due dates.</div>
              ) : (
                stats?.upcomingTasks?.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.projectId}`)}
                    style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PriorityBadge priority={task.priority} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{task.title}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                          {task.assignee?.name || 'Unassigned'} · {task.project?.title}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div style={{ flex: 1, minHeight: 300 }}>
            <ActivityFeed title="Your Projects Live Activity Feed" limit={20} />
          </div>
        </div>
      </div>

      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSuccess={fetchStats} />
      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSuccess={fetchStats} />
    </div>
  );
};
