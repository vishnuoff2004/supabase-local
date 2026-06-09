import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get(`/bookings/${id}`),
      api.get(`/bookings/${id}/status-history`),
    ])
      .then(([b, h]) => {
        setBooking(b.data);
        setHistory(h.data);
      })
      .catch(() => navigate('/bookings'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.put(`/bookings/${id}/cancel`);
      navigate('/bookings');
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading booking details..." />;
  if (!booking) return (
    <div className="booking-detail-page">
      <div className="container">
        <div className="error-state">
          <div className="error-state-icon">✕</div>
          <h3>Booking Not Found</h3>
          <Button variant="secondary" onClick={() => navigate('/bookings')}>Go Back</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking-detail-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="booking-detail-card">
            <div className="booking-detail-header">
              <h1>Booking #{booking.id}</h1>
              <div className="booking-detail-meta">
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-label">Status</span>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-label">Seats</span>
                  <span className="booking-detail-meta-value">{booking.seatCount}</span>
                </div>
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-label">Travel Date</span>
                  <span className="booking-detail-meta-value">{booking.travelDate}</span>
                </div>
              </div>
            </div>
            <div className="booking-detail-body">
              {['Pending', 'Confirmed'].includes(booking.status) && (
                <div className="booking-detail-actions">
                  <Button variant="danger" onClick={handleCancel} loading={cancelling}>
                    Cancel Booking
                  </Button>
                </div>
              )}

              {history.length > 0 && (
                <>
                  <h3 style={{ marginTop: 32, marginBottom: 16 }}>Status History</h3>
                  <div className="booking-status-timeline">
                    {history.map((h, i) => (
                      <div key={i} className="booking-status-timeline-item">
                        <div>
                          <div className="booking-status-timeline-status">
                            {h.fromStatus || 'N/A'} → {h.toStatus}
                          </div>
                          <div className="booking-status-timeline-date">
                            {new Date(h.changedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default BookingDetailPage;
