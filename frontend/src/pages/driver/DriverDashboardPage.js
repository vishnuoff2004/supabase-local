import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DashboardStats from '../../components/DashboardStats';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

// ── Agency Status / Join Panel ────────────────────────────────────────────────
function AgencyPanel() {
  const [status, setStatus] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAgencies, setShowAgencies] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/drivers/agency-status');
      setStatus(res.data);
    } catch { /* ignore */ }
    finally { setLoadingStatus(false); }
  };

  const fetchAgencies = async () => {
    setLoadingAgencies(true);
    try {
      const res = await api.get('/drivers/agencies');
      setAgencies(res.data);
    } catch { setError('Failed to load agencies'); }
    finally { setLoadingAgencies(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleShowAgencies = () => {
    setShowAgencies(true);
    fetchAgencies();
  };

  const handleRequest = async (agencyId, agencyName) => {
    setRequestingId(agencyId);
    setError(''); setSuccess('');
    try {
      await api.post('/drivers/agency-request', { agencyId });
      setSuccess(`Join request sent to ${agencyName}! Waiting for approval.`);
      await fetchStatus();
      setShowAgencies(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally { setRequestingId(null); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError(''); setSuccess('');
    try {
      await api.delete('/drivers/agency-request');
      setSuccess('Request cancelled.');
      await fetchStatus();
      setShowAgencies(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    } finally { setCancelling(false); }
  };

  if (loadingStatus) return null;
  if (!status?.hasProfile) return null;

  // Driver is already in an agency — don't show this panel
  if (status.agency) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      {/* "Removed from agency" notice */}
      <div style={{
        background: 'rgba(239,68,68,0.07)',
        border: '1.5px solid rgba(239,68,68,0.25)',
        borderRadius: 12, padding: '20px 24px',
        marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>🚫</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#b91c1c', marginBottom: 4 }}>
            You are not currently part of any agency
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.5 }}>
            You may have been removed, or you haven't joined one yet. Request to join an agency below to start accepting trips.
          </div>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 12,
          color: '#dc2626', fontSize: '0.87rem', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
        </div>
      )}
      {success && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 12,
          color: '#16a34a', fontSize: '0.87rem',
        }}>
          ✅ {success}
        </div>
      )}

      {/* Pending request status */}
      {status.request && (
        <div style={{
          background: 'rgba(234,179,8,0.08)', border: '1.5px solid rgba(234,179,8,0.35)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#92400e' }}>
              ⏳ Pending request to <strong>{status.request.agencyName}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
              Sent {new Date(status.request.createdAt).toLocaleDateString()} · Waiting for agency approval
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCancel} loading={cancelling}>
            Cancel Request
          </Button>
        </div>
      )}

      {/* Browse agencies */}
      {!status.request && !showAgencies && (
        <Button variant="primary" onClick={handleShowAgencies}>
          🔍 Browse Agencies to Join
        </Button>
      )}

      {showAgencies && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Available Agencies</h3>
            <button onClick={() => setShowAgencies(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1.2rem',
            }}>✕</button>
          </div>
          {loadingAgencies ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Loading agencies...</div>
          ) : agencies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>No active agencies found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agencies.map(a => (
                <div key={a.id} style={{
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                  padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  }}>🏢</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>📞 {a.phone} · ✉️ {a.email}</div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={requestingId === a.id}
                    disabled={a.requestPending || requestingId !== null}
                    onClick={() => handleRequest(a.id, a.name)}
                  >
                    {a.requestPending ? '⏳ Requested' : 'Request to Join'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Driver Dashboard ─────────────────────────────────────────────────────
function DriverDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/dashboard/driver')
      .then(res => { if (mounted) { setData(res.data); setLoading(false); } })
      .catch(err => { if (mounted) { setPageError(err.response?.data?.message || 'Failed to load dashboard'); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await api.get('/dashboard/driver');
    return { pendingRequests: res.data.pendingRequests ?? 0, activeTrips: res.data.activeTrips ?? 0 };
  }, []);

  const reloadData = async () => {
    try { const res = await api.get('/dashboard/driver'); setData(res.data); }
    catch (err) { console.error('Reload failed', err); }
  };

  const showActionError = (msg) => { setActionError(msg); setTimeout(() => setActionError(''), 6000); };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setActionId(bookingId); setActionError('');
    try { await api.put(`/drivers/bookings/${bookingId}/status`, { status: newStatus }); await reloadData(); }
    catch (err) { showActionError(err.response?.data?.message || 'Failed to update status'); }
    finally { setActionId(null); }
  };

  const handleAccept = async (bookingId) => {
    setActionId(bookingId); setActionError('');
    try { await api.put(`/drivers/bookings/${bookingId}/accept`); await reloadData(); }
    catch (err) { showActionError(err.response?.data?.message || 'Failed to accept booking'); }
    finally { setActionId(null); }
  };

  const handleReject = async (bookingId) => {
    setActionId(bookingId); setActionError('');
    try { await api.put(`/drivers/bookings/${bookingId}/reject`, { reason: 'Vehicle unavailable' }); await reloadData(); }
    catch (err) { showActionError(err.response?.data?.message || 'Failed to reject booking'); }
    finally { setActionId(null); }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (pageError) return (
    <div className="driver-page"><div className="container">
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3 className="empty-state-title">Failed to load dashboard</h3>
        <p className="empty-state-text">{pageError}</p>
      </div>
    </div></div>
  );

  const activeTripsList = data?.activeTripsList || [];
  const pendingRequestsList = data?.pendingRequestsList || [];
  const pastTripsList = data?.pastTripsList || [];
  const hasOngoingTrip = activeTripsList.some(t => t.status === 'On Trip');

  return (
    <div className="driver-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up revealed">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Driver Dashboard</h1>
              <p className="text-muted">Manage your trips and driving routes</p>
            </div>
            {hasOngoingTrip && (
              <div className="driver-active-badge">
                <span className="pulse-dot" /> Currently On Trip
              </div>
            )}
          </div>
        </ScrollReveal>

        <DashboardStats fetchStats={fetchStats} />

        {/* Agency panel — shown only when driver has no agency */}
        <AgencyPanel />

        {actionError && (
          <div className="action-error-banner" role="alert">
            <span>⚠️ {actionError}</span>
            <button className="action-error-dismiss" onClick={() => setActionError('')}>✕</button>
          </div>
        )}

        <div className="dashboard-tabs">
          <button className={`dashboard-tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            Active Trips ({activeTripsList.length})
          </button>
          <button className={`dashboard-tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            Pending Requests ({pendingRequestsList.length})
          </button>
          <button className={`dashboard-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Past Trips ({pastTripsList.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'active' && (
            <div className="trip-list">
              {hasOngoingTrip && (
                <div className="driver-trip-notice">
                  🚦 You have a trip in progress. Complete it before starting another.
                </div>
              )}
              {activeTripsList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🚗</div>
                  <h3 className="empty-state-title">No Active Trips</h3>
                  <p className="empty-state-text">You have no active or confirmed bookings right now.</p>
                </div>
              ) : activeTripsList.map(t => (
                <div key={t.id} className={`trip-card ${t.status === 'On Trip' ? 'trip-card--active' : ''}`}>
                  {t.status === 'On Trip' && (
                    <div className="trip-card-live-indicator"><span className="pulse-dot" /> LIVE — ON TRIP</div>
                  )}
                  <div className="trip-info">
                    <div className="trip-route"><span>📍</span> {t.route}</div>
                    <div className="trip-meta">
                      <span className="trip-meta-item">👤 {t.travelerName || 'Unknown'}</span>
                      <span className="trip-meta-item">📅 {t.travelDate}</span>
                      <span className="trip-meta-item">🎟️ {t.seatCount} seats</span>
                      <span className="trip-meta-item"><BookingStatusBadge status={t.status} /></span>
                    </div>
                  </div>
                  <div className="trip-actions">
                    {t.status === 'Confirmed' && (
                      <Button variant="primary" size="sm" loading={actionId === t.id}
                        disabled={hasOngoingTrip} title={hasOngoingTrip ? 'Complete current trip first' : ''}
                        onClick={() => handleUpdateStatus(t.id, 'On Trip')}>Start Trip</Button>
                    )}
                    {t.status === 'On Trip' && (
                      <Button variant="success" size="sm" loading={actionId === t.id}
                        onClick={() => handleUpdateStatus(t.id, 'Completed')}>Complete Trip</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="trip-list">
              {pendingRequestsList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <h3 className="empty-state-title">No Pending Requests</h3>
                  <p className="empty-state-text">All booking requests have been answered.</p>
                </div>
              ) : pendingRequestsList.map(t => (
                <div key={t.id} className="trip-card">
                  <div className="trip-info">
                    <div className="trip-route"><span>📍</span> {t.route}</div>
                    <div className="trip-meta">
                      <span className="trip-meta-item">👤 {t.travelerName || 'Unknown'}</span>
                      <span className="trip-meta-item">📅 {t.travelDate}</span>
                      <span className="trip-meta-item">🎟️ {t.seatCount} seats</span>
                      <span className="trip-meta-item"><BookingStatusBadge status={t.status} /></span>
                    </div>
                  </div>
                  <div className="trip-actions">
                    <Button variant="primary" size="sm" loading={actionId === t.id} onClick={() => handleAccept(t.id)}>Accept</Button>
                    <Button variant="danger" size="sm" loading={actionId === t.id} onClick={() => handleReject(t.id)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="trip-list">
              {pastTripsList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <h3 className="empty-state-title">No Route History</h3>
                  <p className="empty-state-text">Completed and cancelled trips will appear here.</p>
                </div>
              ) : pastTripsList.map(t => (
                <div key={t.id} className="trip-card">
                  <div className="trip-info">
                    <div className="trip-route"><span>📍</span> {t.route}</div>
                    <div className="trip-meta">
                      <span className="trip-meta-item">👤 {t.travelerName || 'Unknown'}</span>
                      <span className="trip-meta-item">📅 {t.travelDate}</span>
                      <span className="trip-meta-item">🎟️ {t.seatCount} seats</span>
                      <span className="trip-meta-item"><BookingStatusBadge status={t.status} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverDashboardPage;
