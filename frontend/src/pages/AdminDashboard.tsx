import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Users,
  Plus,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const STATUS_BARS = [
  { key: 'TO_DO', label: 'To Do', color: '#64748b' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#6366f1' },
  { key: 'IN_REVIEW', label: 'In Review', color: '#f59e0b' },
  { key: 'DONE', label: 'Done', color: '#10b981' },
];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const navigate = useNavigate();
  const { activeOnlineCount, isConnected } = useSocket();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        Loading Admin Dashboard...
      </div>
    );
  }

  const total = stats?.totalTasks || 1;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Banner */}
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="page-hero-badge">
              <ShieldCheck size={10} />
              Admin Global Overview
            </div>
            <h1 className="page-hero-title">Agency Operations Control Center</h1>
            <p className="page-hero-desc">
              Real-time telemetry, client project management &amp; global live activity feed.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={13} /> New Project
            </button>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={13} /> New Task
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          subtitle="Active agency client deliverables"
          icon={FolderKanban}
          color="indigo"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          subtitle="Spread across all projects"
          icon={CheckSquare}
          color="purple"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueCount || 0}
          subtitle="Flagged by background cron scanner"
          icon={AlertTriangle}
          color="rose"
          badgeText={stats?.overdueCount > 0 ? 'Action Required' : 'All On Track'}
          badgeColor={stats?.overdueCount > 0 ? '#f43f5e' : '#10b981'}
        />
        <StatCard
          title="Online Users"
          value={activeOnlineCount || 1}
          subtitle="Real-time WebSocket presence"
          icon={Users}
          color="emerald"
          badgeText="Live Socket Presence"
          badgeColor="#10b981"
        />
      </div>

      {/* Bottom section: Task breakdown + Activity feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Task Status Breakdown */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 16 }}>
            Tasks by Status
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {STATUS_BARS.map((bar) => {
              const count = stats?.tasksByStatus?.[bar.key] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={bar.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11.5, fontWeight: 600 }}>
                    <span style={{ color: bar.color }}>{bar.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: bar.color,
                        borderRadius: 9999,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}
              onClick={() => navigate('/projects')}
            >
              View All Projects <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Global Activity Feed */}
        <div style={{ minHeight: 420 }}>
          <ActivityFeed title="Global Live Activity Feed (Admin Scope)" limit={20} />
        </div>
      </div>

      {/* Modals */}
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSuccess={fetchStats} />
      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSuccess={fetchStats} />
    </div>
  );
};
