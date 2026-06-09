import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonTable } from '../../components/common/SkeletonLoader';

function BookingOversightPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    api.get('/admin/bookings')
      .then(res => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.put(`/admin/bookings/${id}/cancel`, { reason: 'Platform policy' });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <h1 className="admin-title mb-lg">Booking Oversight</h1>
          <SkeletonTable rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Booking Oversight</h1>
              <p className="text-muted">{bookings.length} total bookings</p>
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
                    <th>Booking ID</th>
                    <th>Traveler</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td><span className="font-semibold">#{b.id}</span></td>
                      <td>{b.travelerName || 'N/A'}</td>
                      <td>{b.route || 'N/A'}</td>
                      <td><BookingStatusBadge status={b.status} /></td>
                      <td>
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={cancelling === b.id}
                            onClick={() => handleCancel(b.id)}
                          >
                            Cancel
                          </Button>
                        )}
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

export default BookingOversightPage;
