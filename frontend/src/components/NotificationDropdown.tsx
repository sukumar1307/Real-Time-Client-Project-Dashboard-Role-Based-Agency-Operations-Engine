import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getIcon = (type: string) => {
  const s = { flexShrink: 0 };
  if (type === 'TASK_OVERDUE') return <AlertTriangle size={13} color="#fb7185" style={s} />;
  if (type === 'TASK_IN_REVIEW') return <Clock size={13} color="#fbbf24" style={s} />;
  if (type === 'TASK_ASSIGNED') return <CheckCircle size={13} color="#34d399" style={s} />;
  return <Info size={13} color="#818cf8" style={s} />;
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (id: string, link?: string | null) => {
    await markAsRead(id);
    if (link) navigate(link);
  };

  return (
    <div
      style={{
        width: 340,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        animation: 'slideDown 0.15s ease',
      }}
    >
      <style>{`@keyframes slideDown { from { opacity:0; transform: translateY(-6px) } to { opacity:1; transform: translateY(0) } }`}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={13} color="#818cf8" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#818cf8',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 20,
                padding: '1px 6px',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#818cf8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            <Bell size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            No notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item.id, item.link)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                cursor: 'pointer',
                background: !item.isRead ? 'rgba(99,102,241,0.04)' : 'transparent',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.background = !item.isRead ? 'rgba(99,102,241,0.04)' : 'transparent')}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  {!item.isRead && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                  {item.message}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  {timeAgo(item.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
