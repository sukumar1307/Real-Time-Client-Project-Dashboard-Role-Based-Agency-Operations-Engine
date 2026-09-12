import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, AlertTriangle } from 'lucide-react';

interface FilterBarProps {
  showProjectSelect?: boolean;
  projects?: Array<{ id: string; title: string }>;
}

export const FilterBar: React.FC<FilterBarProps> = ({ showProjectSelect, projects }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const projectId = searchParams.get('projectId') || '';
  const search = searchParams.get('search') || '';
  const isOverdue = searchParams.get('isOverdue') === 'true';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const resetFilters = () => setSearchParams(new URLSearchParams());

  const hasFilters = status || priority || projectId || search || isOverdue || dueDateFrom || dueDateTo;

  return (
    <div className="card" style={{ padding: '12px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: 200, maxWidth: 280 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="form-input"
            style={{ paddingLeft: 30, fontSize: 11.5, padding: '6px 10px 6px 30px' }}
          />
        </div>

        {/* Status */}
        <select value={status} onChange={(e) => updateParam('status', e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="TO_DO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        {/* Priority */}
        <select value={priority} onChange={(e) => updateParam('priority', e.target.value)} className="filter-select">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {/* Project filter */}
        {showProjectSelect && projects && (
          <select value={projectId} onChange={(e) => updateParam('projectId', e.target.value)} className="filter-select">
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        )}

        {/* Overdue toggle */}
        <button
          type="button"
          onClick={() => updateParam('isOverdue', isOverdue ? '' : 'true')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 7,
            fontSize: 11.5,
            fontWeight: 600,
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: isOverdue ? 'rgba(244,63,94,0.12)' : 'var(--bg-card)',
            color: isOverdue ? '#fb7185' : 'var(--text-muted)',
            borderColor: isOverdue ? 'rgba(244,63,94,0.35)' : 'var(--border-subtle)',
          }}
        >
          <AlertTriangle size={11} /> Overdue Only
        </button>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={resetFilters}
            title="Reset Filters"
            style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <RotateCcw size={11} /> Clear
          </button>
        )}
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Due Date Range:</span>
        <input
          type="date"
          value={dueDateFrom}
          onChange={(e) => updateParam('dueDateFrom', e.target.value)}
          className="filter-select"
          style={{ padding: '4px 8px' }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
        <input
          type="date"
          value={dueDateTo}
          onChange={(e) => updateParam('dueDateTo', e.target.value)}
          className="filter-select"
          style={{ padding: '4px 8px' }}
        />
      </div>
    </div>
  );
};
