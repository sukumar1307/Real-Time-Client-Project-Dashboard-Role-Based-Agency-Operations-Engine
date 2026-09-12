import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  GitBranch,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
    { label: 'Projects', path: '/projects', icon: FolderKanban, end: false },
    { label: 'My Tasks', path: '/tasks', icon: CheckSquare, end: false, badge: user.role === 'DEVELOPER' ? '5' : undefined },
  ];

  if (user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER') {
    navItems.push({ label: 'Clients', path: '/clients', icon: Users, end: false });
  }

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const scopeText =
    user.role === 'ADMIN'
      ? 'Full agency system access across all projects and users.'
      : user.role === 'PROJECT_MANAGER'
      ? 'Restricted to managed team projects only.'
      : 'Restricted strictly to assigned task queue. Zero peripheral cross-client exposure.';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={16} color="#818cf8" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="sidebar-brand-name">VELOCITY</span>
            <span className="sidebar-badge-tag">AGENCY</span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
            Ops &amp; Delivery Engine
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-label">Workstation</div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            );
          })}

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 4px' }} />

          <a className="nav-item" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
            <GitBranch size={15} />
            <span>Repositories</span>
          </a>
          <a className="nav-item" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
            <Settings size={15} />
            <span>Settings</span>
          </a>
        </nav>
      </div>

      {/* Scope Isolation */}
      <div className="sidebar-scope-box">
        <div className="sidebar-scope-title">
          <ShieldCheck size={12} />
          Scope Isolation Active
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {scopeText}
        </div>
      </div>
    </aside>
  );
};
