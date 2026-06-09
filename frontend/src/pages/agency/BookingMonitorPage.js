import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonList } from '../../components/common/SkeletonLoader';

function BookingMonitorPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/agency/bookings')
      .then(res => setBookings(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="agency-page">
        <div className="container">
          <h1 className="admin-title mb-lg">Booking Monitor</h1>
          <SkeletonList rows={6} />
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
              <h1 className="admin-title">Booking Monitor</h1>
              <p className="text-muted">{bookings.length} bookings</p>
            </div>
          </div>
        </ScrollReveal>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Bookings</h3>
            <p className="empty-state-text">No bookings have been made yet.</p>
          </div>
        ) : (
          <ScrollReveal className="animate-fade-up">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Traveler</th>
                    <th>Route</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={i}>
                      <td><span className="font-semibold">#{b.bookingId || i + 1}</span></td>
                      <td>{b.travelerName || 'N/A'}</td>
                      <td>{b.route || 'N/A'}</td>
                      <td><BookingStatusBadge status={b.status} /></td>
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

export default BookingMonitorPage;
