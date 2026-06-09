import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function BookingRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    api.get('/dashboard/driver')
      .then(res => setRequests(res.data.pendingRequestsList || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    setActionId(id);
    try {
      const url = `/drivers/bookings/${id}/${action}`;
      await api.put(url);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading requests..." />;

  return (
    <div className="driver-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Booking Requests</h1>
              <p className="text-muted">{requests.length} pending requests</p>
            </div>
          </div>
        </ScrollReveal>

        {requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3 className="empty-state-title">All Clear</h3>
            <p className="empty-state-text">No pending booking requests at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requests.map((r, i) => (
              <ScrollReveal key={r.id || i} className="animate-fade-up">
                <div className="booking-request-card">
                  <div className="booking-request-info">
                    <div className="booking-request-title">Booking Request</div>
                    <div className="booking-request-meta">
                      {r.travelerName && <span>From: {r.travelerName} | </span>}
                      {r.route && <span>Route: {r.route}</span>}
                    </div>
                  </div>
                  <div className="booking-request-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionId === r.id}
                      onClick={() => handleAction(r.id, 'accept')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={actionId === r.id}
                      onClick={() => handleAction(r.id, 'reject')}
                    >
                      Reject
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

export default BookingRequestsPage;
