import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

// ── Confirmation Modal (rendered via portal directly onto document.body) ──────
function RemoveConfirmModal({ driver, onConfirm, onCancel, removing }) {
  if (!driver) return null;

  const initials = driver.name
    ? driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'D';

  const available = driver.available === true || driver.available === 1;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: '460px',
          padding: '32px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800 }}>Remove Driver</h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280' }}>
            Review driver details before confirming removal.
          </p>
        </div>

        {/* Driver detail box */}
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: '12px', padding: '20px', marginBottom: '20px',
          display: 'flex', gap: '16px', alignItems: 'flex-start',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: '1rem',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '12px' }}>
              {driver.name || '—'}
            </div>
            {[
              ['📞 Phone', driver.phone || 'N/A'],
              ['🚗 Vehicle', driver.vehicleType || 'N/A'],
              ['🔖 Reg. No.', driver.vehicleReg || 'N/A'],
              ['📋 License', driver.licenseNo || 'N/A'],
              ['✅ Status', available ? 'Available' : 'Unavailable'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.83rem', marginBottom: '6px',
              }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{
                  fontWeight: 600,
                  color: label === '✅ Status' ? (available ? '#16a34a' : '#6b7280') : '#111827',
                }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <p style={{
          fontSize: '0.82rem', color: '#92400e',
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '8px', padding: '10px 14px',
          marginBottom: '24px', lineHeight: 1.5,
        }}>
          Removing this driver will unlink them from your agency and cancel any pending bookings assigned to them.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel} disabled={removing}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={removing}>
            Confirm Remove
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function DriverManagementPage() {
  const [drivers, setDrivers] = useState([]);
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    api.get('/agency/drivers')
      .then(res => {
        setDrivers(res.data.data || []);
        setAgencyName(res.data.agencyName || 'Your Agency');
      })
      .catch(() => setError('Failed to load drivers'))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmRemove = async () => {
    if (!selectedDriver) return;
    setRemoving(true);
    try {
      await api.delete(`/agency/drivers/${selectedDriver.id}`);
      setDrivers(prev => prev.filter(d => d.id !== selectedDriver.id));
      setSelectedDriver(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove driver');
      setSelectedDriver(null);
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="agency-page">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: '#e5e7eb' }} />
            <div>
              <div style={{ width: 220, height: 32, background: '#e5e7eb', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 140, height: 16, background: '#f3f4f6', borderRadius: 4 }} />
            </div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 72, background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 12, marginBottom: 12,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="agency-page">
      <div className="container">

        {/* Agency heading */}
        <ScrollReveal className="animate-fade-up revealed">
          <div className="driver-mgmt-header">
            <div className="driver-mgmt-agency-badge">🏢</div>
            <div>
              <h1 className="driver-mgmt-agency-name">{agencyName}</h1>
              <p className="text-muted">
                {drivers.length === 0
                  ? 'No drivers in your agency'
                  : `${drivers.length} driver${drivers.length !== 1 ? 's' : ''} in your agency`}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Error banner */}
        {error && (
          <div className="action-error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button className="action-error-dismiss" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Driver list — plain divs, NO ScrollReveal wrapper (prevents click issues) */}
        {drivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3 className="empty-state-title">No Drivers Yet</h3>
            <p className="empty-state-text">Drivers who join your agency will appear here.</p>
          </div>
        ) : (
          <div className="driver-numbered-list">
            {drivers.map((d, i) => {
              const initials = d.name
                ? d.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : 'D';
              const available = d.available === true || d.available === 1;

              return (
                <div key={d.id} className="driver-numbered-row">
                  <div className="driver-row-number">{i + 1}</div>
                  <div className="driver-row-avatar">{initials}</div>
                  <div className="driver-row-info">
                    <div className="driver-row-name">{d.name || '—'}</div>
                    <div className="driver-row-meta">
                      {d.vehicleType && <span>🚗 {d.vehicleType}</span>}
                      {d.vehicleReg && <span>🔖 {d.vehicleReg}</span>}
                      {d.phone && <span>📞 {d.phone}</span>}
                    </div>
                  </div>
                  <div className={`driver-row-status ${available ? 'available' : 'unavailable'}`}>
                    {available ? '● Available' : '● Unavailable'}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setSelectedDriver(d)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal — portal to document.body */}
      <RemoveConfirmModal
        driver={selectedDriver}
        onConfirm={handleConfirmRemove}
        onCancel={() => { if (!removing) setSelectedDriver(null); }}
        removing={removing}
      />
    </div>
  );
}

export default DriverManagementPage;
