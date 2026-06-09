import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

function DriverManagementPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get('/agency/drivers')
      .then(res => setDrivers(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!driverId) return;
    setAdding(true);
    try {
      await api.post('/agency/drivers', { driverId: Number(driverId) });
      setDriverId('');
      const res = await api.get('/agency/drivers');
      setDrivers(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add driver');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/agency/drivers/${id}`);
      setDrivers(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove driver');
    }
  };

  if (loading) {
    return (
      <div className="agency-page">
        <div className="container">
          <h1 className="admin-title mb-lg">Manage Drivers</h1>
          <div className="driver-grid">
            <SkeletonCard count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="agency-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Manage Drivers</h1>
              <p className="text-muted">{drivers.length} drivers in your agency</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="card mb-xl">
            <h3 className="card-title mb-lg">Add Driver</h3>
            <div className="form-input-group">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <input
                  className="form-input"
                  placeholder="Enter Driver ID"
                  type="number"
                  value={driverId}
                  onChange={e => setDriverId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <Button onClick={handleAdd} loading={adding}>Add Driver</Button>
            </div>
          </div>
        </ScrollReveal>

        {drivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3 className="empty-state-title">No Drivers</h3>
            <p className="empty-state-text">Add drivers to your agency to get started.</p>
          </div>
        ) : (
          <div className="driver-grid">
            {drivers.map((d, i) => (
              <ScrollReveal key={d.id} className="animate-fade-up">
                <div className="driver-card">
                  <div className="driver-card-header">
                    <div className="driver-card-avatar">
                      {d.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'D'}
                    </div>
                    <div>
                      <div className="driver-card-name">{d.name}</div>
                      <div className="driver-card-vehicle">{d.vehicleReg || 'No vehicle'}</div>
                    </div>
                  </div>
                  <div className="driver-card-actions">
                    <Button variant="danger" size="sm" onClick={() => handleRemove(d.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverManagementPage;
