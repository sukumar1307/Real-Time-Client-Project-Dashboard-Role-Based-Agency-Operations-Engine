import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Zap, GitCommit, User } from 'lucide-react';

interface ActivityFeedProps {
  projectId?: string;
  title?: string;
  limit?: number;
}

const avatarColors = [
  '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Detect if an activity looks like a git commit
function isCommitActivity(msg: string) {
  return msg.toLowerCase().includes('commit') || msg.toLowerCase().includes('git');
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  title = 'Live Activity Feed',
  limit = 20,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { latestActivity, isConnected } = useSocket();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const url = projectId
        ? `/activities?projectId=${projectId}&limit=${limit}`
        : `/activities?limit=${limit}`;
      const res = await api.get(url);
      setActivities(res.data.data);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  useEffect(() => {
    if (!latestActivity) return;
    if (projectId && latestActivity.projectId !== projectId) return;
    setActivities((prev) => {
      if (prev.some((a) => a.id === latestActivity.id)) return prev;
      return [latestActivity, ...prev.slice(0, limit - 1)];
    });
  }, [latestActivity, projectId, limit]);

  return (
    <div className="activity-feed">
      {/* Header */}
      <div className="activity-feed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={13} color="#818cf8" />
          </div>
          <span className="activity-feed-title">{title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#f59e0b',
              display: 'inline-block',
              animation: isConnected ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
            {isConnected ? 'Real-time WebSocket Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="activity-feed-body">
        {loading ? (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(99,102,241,0.3)',
                borderTopColor: '#6366f1',
                borderRadius: '50%',
                margin: '0 auto 8px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            Loading events...
          </div>
        ) : activities.length === 0 ? (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            No recent activity
          </div>
        ) : (
          activities.map((item, idx) => {
            const color = getAvatarColor(item.user.name);
            const initials = getInitials(item.user.name);
            const isCommit = isCommitActivity(item.formattedMessage || '');
            const role = item.user.role;
            const roleLabel =
              role === 'ADMIN' ? 'Admin' :
              role === 'PROJECT_MANAGER' ? 'PM' :
              null;

            // Parse message to highlight quoted text
            const msg = item.formattedMessage || '';
            const parts = msg.split(/"([^"]+)"/g);

            return (
              <div key={item.id} className="activity-item animate-fade-in">
                {/* Avatar or Icon */}
                <div className="activity-avatar" style={{ background: isCommit ? 'rgba(16,185,129,0.15)' : color }}>
                  {isCommit ? (
                    <GitCommit size={13} color="#34d399" />
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{initials}</span>
                  )}
                </div>

                <div className="activity-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="activity-name">{item.user.name}</span>
                      {roleLabel && (
                        <span style={{ fontSize: 9.5, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <span className="activity-time">{formatTimeAgo(item.createdAt)}</span>
                  </div>

                  <div className="activity-message">
                    {parts.map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i}>"{part}"</strong>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </div>

                  {isCommit && (
                    <div className="activity-code-snippet">
                      {msg.substring(0, 60)}
                    </div>
                  )}

                  {item.project && !projectId && (
                    <span className="activity-project-tag">📁 {item.project.title}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
