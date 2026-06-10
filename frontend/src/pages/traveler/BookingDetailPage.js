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
              {/* Info Grid */}
              <div className="booking-info-grid">
                {/* 1. Trip Information Card */}
                {booking.Route ? (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>📍</span> Trip Information
                    </h3>
                    <div className="detail-field-group">
                      <div className="detail-field">
                        <span className="detail-label">Route</span>
                        <span className="detail-value font-semibold">
                          {booking.Route.source} → {booking.Route.destination}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Departure</span>
                        <span className="detail-value">
                          {new Date(booking.Route.departureTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Arrival</span>
                        <span className="detail-value">
                          {new Date(booking.Route.arrivalTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Fare per Seat</span>
                        <span className="detail-value">₹{booking.Route.fare}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value text-accent font-bold" style={{ fontSize: '1.15rem' }}>
                          ₹{(Number(booking.Route.fare) * booking.seatCount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>📍</span> Trip Information
                    </h3>
                    <p className="text-muted">Route details unavailable</p>
                  </div>
                )}

                {/* 2. Driver & Vehicle Card */}
                {booking.Driver ? (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>👤</span> Driver & Vehicle
                    </h3>
                    <div className="detail-field-group">
                      <div className="detail-field">
                        <span className="detail-label">Driver Name</span>
                        <span className="detail-value font-semibold">{booking.Driver.name}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Driver Contact</span>
                        <span className="detail-value">{booking.Driver.phone}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Vehicle Type</span>
                        <span className="detail-value">{booking.Driver.vehicleType || 'N/A'}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Vehicle Reg. No</span>
                        <span className="detail-value font-mono">{booking.Driver.vehicleReg || 'N/A'}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">License Number</span>
                        <span className="detail-value font-mono">{booking.Driver.licenseNo || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>👤</span> Driver & Vehicle
                    </h3>
                    <p className="text-muted">Driver details unavailable</p>
                  </div>
                )}

                {/* 3. Agency Details Card */}
                {booking.Driver?.Agency ? (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>🏢</span> Service Provider
                    </h3>
                    <div className="detail-field-group">
                      <div className="detail-field">
                        <span className="detail-label">Agency Name</span>
                        <span className="detail-value font-semibold">
                          {booking.Driver.Agency.name}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Agency Contact</span>
                        <span className="detail-value">{booking.Driver.Agency.phone}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Agency Email</span>
                        <span className="detail-value">{booking.Driver.Agency.email}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>🏢</span> Service Provider
                    </h3>
                    <p className="text-muted">Agency details unavailable</p>
                  </div>
                )}
              </div>

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
