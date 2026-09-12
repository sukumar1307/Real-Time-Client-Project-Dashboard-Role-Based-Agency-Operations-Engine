import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Client } from '../types';
import { Building, Plus, Mail, FolderKanban, X, AlertCircle } from 'lucide-react';

const CLIENT_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

function getClientColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CLIENT_COLORS[Math.abs(h) % CLIENT_COLORS.length];
}

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/clients', { name, company, email });
      setIsModalOpen(false);
      setName(''); setCompany(''); setEmail('');
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-hero-title">Agency Clients Directory</h1>
            <p className="page-hero-desc">Manage enterprise client accounts and associated project portfolios.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={13} /> Add New Client
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          Loading Clients...
        </div>
      ) : clients.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Building size={32} style={{ margin: '0 auto 10px', opacity: 0.3, color: '#818cf8' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>No clients yet</div>
          <div style={{ fontSize: 12 }}>Add your first client to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {clients.map((client) => {
            const color = getClientColor(client.name);
            const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={client.id} className="client-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="client-avatar" style={{ background: color }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{client.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{client.company}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  <Mail size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  {client.email}
                </div>

                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#818cf8' }}>
                    <FolderKanban size={12} />
                    {client._count?.projects || 0} Projects
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-header">
              <span className="modal-title">Add New Agency Client</span>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn"><X size={14} /></button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 7, fontSize: 12, color: '#fb7185', marginBottom: 14 }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
              <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Client Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Global Inc." className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Company Entity</label>
                  <input type="text" required value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp LLC" className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Client Contact Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@acme.com" className="form-input" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" onClick={handleCreateClient as any} disabled={submitting} className="btn btn-primary btn-sm" style={{ opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
