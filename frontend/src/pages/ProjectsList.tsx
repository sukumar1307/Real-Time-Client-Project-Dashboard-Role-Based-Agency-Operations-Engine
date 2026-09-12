import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/Badges';
import { ProjectModal } from '../components/ProjectModal';
import { FolderKanban, Plus, Building, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProjectsList: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="page-hero-badge">
              <ShieldAlert size={10} />
              {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'PROJECT_MANAGER' ? 'PM' : 'Developer'} Access Scope
            </div>
            <h1 className="page-hero-title">Client Projects Portfolio</h1>
            <p className="page-hero-desc">
              Overview of active agency client projects and deliverable boards.
            </p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={13} /> Create Project
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          Loading Projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <FolderKanban size={32} style={{ margin: '0 auto 10px', opacity: 0.3, color: '#818cf8' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>No projects found</div>
          <div style={{ fontSize: 12 }}>No projects available in your current role scope.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12, padding: '16px 18px', transition: 'border-color 0.15s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <StatusBadge status={proj.status} />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#818cf8',
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.18)',
                      borderRadius: 20,
                      padding: '2px 8px',
                    }}
                  >
                    {proj._count?.tasks || proj.tasks?.length || 0} Tasks
                  </span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{proj.title}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {proj.description}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building size={12} color="#818cf8" />
                  {proj.client?.name || 'Client'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#818cf8', fontWeight: 700 }}>
                  Kanban Board <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchProjects} />
    </div>
  );
};
