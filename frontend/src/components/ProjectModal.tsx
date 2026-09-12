import React, { useState, useEffect } from 'react';
import { Client, User, ProjectStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, AlertCircle } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClientsAndManagers();
      setTitle(''); setDescription(''); setClientId('');
      setManagerId(user?.id || ''); setStatus('ACTIVE'); setError(null);
    }
  }, [isOpen, user]);

  const fetchClientsAndManagers = async () => {
    try {
      const [clientRes, mgrRes] = await Promise.all([
        api.get('/clients'),
        api.get('/users?role=PROJECT_MANAGER'),
      ]);
      setClients(clientRes.data.data);
      setManagers(mgrRes.data.data);
    } catch (err) {
      console.error('Failed to load clients/managers:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/projects', {
        title, description, clientId,
        managerId: user?.role === 'ADMIN' ? managerId : user?.id,
        status,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">Create New Project</span>
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
              <label className="form-label">Project Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Next-Gen Mobile App" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Project overview & milestone targets..." className="form-input" style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Client</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} required className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>

              {user?.role === 'ADMIN' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Assign Manager</label>
                  <select value={managerId} onChange={e => setManagerId(e.target.value)} required className="form-input" style={{ cursor: 'pointer' }}>
                    <option value="">Select PM</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Project Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} className="form-input" style={{ cursor: 'pointer' }}>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm" style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
