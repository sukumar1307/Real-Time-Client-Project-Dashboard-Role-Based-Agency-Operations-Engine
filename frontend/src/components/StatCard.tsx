import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan';
  badgeText?: string;
  badgeColor?: string;
  note?: string;
}

const iconColors: Record<string, { bg: string; color: string; glow: string }> = {
  indigo: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', glow: 'rgba(99,102,241,0.15)' },
  emerald: { bg: 'rgba(16,185,129,0.1)', color: '#34d399', glow: 'rgba(16,185,129,0.12)' },
  amber: { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', glow: 'rgba(245,158,11,0.12)' },
  rose: { bg: 'rgba(244,63,94,0.1)', color: '#fb7185', glow: 'rgba(244,63,94,0.1)' },
  purple: { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa', glow: 'rgba(139,92,246,0.1)' },
  cyan: { bg: 'rgba(6,182,212,0.1)', color: '#22d3ee', glow: 'rgba(6,182,212,0.1)' },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  badgeText,
  badgeColor,
  note,
}) => {
  const c = iconColors[color];

  return (
    <div className="stat-card">
      {/* Icon */}
      <div
        className="stat-card-icon"
        style={{ background: c.bg, border: `1px solid ${c.glow}` }}
      >
        <Icon size={16} color={c.color} />
      </div>

      <div className="stat-card-label">{title}</div>
      <div className="stat-card-value">{value}</div>

      {note && (
        <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginBottom: 4 }}>{note}</div>
      )}

      {subtitle && <div className="stat-card-sub">{subtitle}</div>}

      {badgeText && (
        <div className="stat-badge">
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: badgeColor || c.color,
              display: 'inline-block',
              flexShrink: 0,
              ...(badgeColor?.includes('emerald') ? { animation: 'pulse 2s infinite' } : {}),
            }}
          />
          {badgeText}
        </div>
      )}
    </div>
  );
};
