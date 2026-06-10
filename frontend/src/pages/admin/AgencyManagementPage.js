import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function AgencyManagementPage() {
  const [agencies, setAgencies] = useState([]);
  const [agencyAdmins, setAgencyAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', adminId: '' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/agencies'),
      api.get('/admin/users'),
    ]).then(([agenciesRes, usersRes]) => {
      setAgencies(agenciesRes.data || []);
      setAgencyAdmins((usersRes.data || []).filter(u => u.role === 'agency_admin'));
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/agencies', form);
      setForm({ name: '', email: '', phone: '', adminId: '' });
      setShowForm(false);
      const res = await api.get('/admin/agencies');
      setAgencies(res.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.put(`/admin/agencies/${id}/deactivate`);
      setAgencies(prev => prev.map(a => a.id === id ? { ...a, active: !isActive } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading agencies..." />;

  return (
    <div className="admin-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Agency Management</h1>
              <p className="text-muted">{agencies.length} agencies registered</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Create Agency'}
            </Button>
          </div>
        </ScrollReveal>

        {showForm && (
          <ScrollReveal className="animate-fade-up">
            <div className="card mb-xl">
              <h3 className="card-title mb-lg">New Agency</h3>
              <form onSubmit={handleCreate}>
                <div className="form-input-group">
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      className="form-input"
                      placeholder="Agency Name"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      className="form-input"
                      placeholder="Phone"
                      value={form.phone}
                      onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <select
                      className="form-input"
                      value={form.adminId}
                      onChange={e => setForm(prev => ({ ...prev, adminId: e.target.value }))}
                      required
                    >
                      <option value="">Select Agency Admin</option>
                      {agencyAdmins.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <Button type="submit" loading={creating}>Create</Button>
                  </div>
                </div>
              </form>
            </div>
          </ScrollReveal>
        )}

        {agencies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3 className="empty-state-title">No Agencies</h3>
            <p className="empty-state-text">Create your first agency to get started.</p>
          </div>
        ) : (
          <ScrollReveal className="animate-fade-up">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.map(a => (
                    <tr key={a.id}>
                      <td><span className="font-semibold">{a.name}</span></td>
                      <td>{a.email}</td>
                      <td>{a.phone}</td>
                      <td>
                        <span className="user-list-item-status">
                          <span className={`status-dot ${a.active !== false ? 'active' : 'inactive'}`} />
                          {a.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant={a.active !== false ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleActive(a.id, a.active !== false)}
                        >
                          {a.active !== false ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default AgencyManagementPage;
