import React, { useState, useEffect } from 'react';
import { Task, Project, User, TaskPriority, TaskStatus } from '../types';
import { api } from '../services/api';
import { X, AlertCircle } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProjectId?: string;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSuccess, initialProjectId, taskToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TO_DO');
  const [dueDate, setDueDate] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjectsAndDevs();
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description);
        setProjectId(taskToEdit.projectId);
        setAssigneeId(taskToEdit.assigneeId || '');
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
        setDueDate(new Date(taskToEdit.dueDate).toISOString().split('T')[0]);
      } else {
        setTitle(''); setDescription('');
        setProjectId(initialProjectId || ''); setAssigneeId('');
        setPriority('MEDIUM'); setStatus('TO_DO');
        setDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      }
      setError(null);
    }
  }, [isOpen, taskToEdit, initialProjectId]);

  const fetchProjectsAndDevs = async () => {
    try {
      const [projRes, devRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users?role=DEVELOPER'),
      ]);
      setProjects(projRes.data.data);
      setDevelopers(devRes.data.data);
    } catch (err) {
      console.error('Failed to load project/dev lists:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const isoDueDate = new Date(dueDate).toISOString();
      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, { title, description, assigneeId: assigneeId || null, priority, status, dueDate: isoDueDate });
      } else {
        await api.post('/tasks', { title, description, projectId, assigneeId: assigneeId || null, priority, status, dueDate: isoDueDate });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">{taskToEdit ? 'Edit Task' : 'Create New Task'}</span>
          <button onClick={onClose} className="icon-btn"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 7, fontSize: 12, color: '#fb7185', marginBottom: 14 }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Implement Stripe Payment Gateway" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed task description..." className="form-input" style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project</label>
                <select disabled={!!taskToEdit || !!initialProjectId} value={projectId} onChange={e => setProjectId(e.target.value)} required className="form-input" style={{ cursor: 'pointer', opacity: (!!taskToEdit || !!initialProjectId) ? 0.5 : 1 }}>
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assign Developer</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="">Unassigned</option>
                  {developers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.email})</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="TO_DO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Due Date</label>
                <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm" style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
