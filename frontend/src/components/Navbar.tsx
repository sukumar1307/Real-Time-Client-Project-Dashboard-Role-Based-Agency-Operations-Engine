import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import { LogOut, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel =
    user.role === 'ADMIN'
      ? 'Administrator'
      : user.role === 'PROJECT_MANAGER'
      ? 'Project Manager'
      : 'Developer';

  return (
    <header className="topbar">
      {/* Search bar */}
      <div className="topbar-search" style={{ cursor: 'text' }}>
        <Search size={13} />
        <span>Search tasks, commits, or tickets...</span>
        <span className="topbar-search-kbd">⌘K</span>
      </div>

      {/* Right section */}
      <div className="topbar-right">
        {/* Live pill */}
        <div className={`live-pill ${isConnected ? '' : 'offline'}`}>
          <span className="live-dot" />
          <div style={{ lineHeight: 1.2, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{isConnected ? 'Live' : 'Sync'}</div>
            <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.8 }}>
              {isConnected ? 'Sync' : '...'}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            id="notif-bell-btn"
            className="icon-btn"
            onClick={() => setShowNotif((v) => !v)}
            title="Notifications"
          >
            <Bell size={15} />
            <span className="badge-dot" />
          </button>
          {showNotif && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100 }}>
              <NotificationDropdown />
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="user-chip">
          <div className="user-chip-info">
            <div className="user-chip-name">{user.name}</div>
            <div className="user-chip-role">+ {roleLabel}</div>
          </div>
          <div className="user-chip-avatar">
            {initials}
            <span className="online-ring" />
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};
