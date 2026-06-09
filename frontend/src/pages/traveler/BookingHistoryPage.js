import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBookings } from '../../services/bookingService';
import Pagination from '../../components/common/Pagination';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonList } from '../../components/common/SkeletonLoader';

function BookingHistoryPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getBookings(page, 10)
      .then(data => {
        setBookings(data.data || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => {
        setError('Failed to load bookings');
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="booking-history-page">
        <div className="container">
          <h1 className="search-title mb-lg">{t('nav.bookings')}</h1>
          <SkeletonList rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="booking-history-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <h1 className="search-title">{t('nav.bookings')}</h1>
        </ScrollReveal>

        {error ? (
          <div className="error-state">
            <div className="error-state-icon">✕</div>
            <h3>Error Loading Bookings</h3>
            <p className="text-muted mt-sm">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <ScrollReveal className="animate-scale-in">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3 className="empty-state-title">{t('booking.noBookings') || 'No Bookings Yet'}</h3>
              <p className="empty-state-text">{t('booking.noBookingsHint') || 'Search for routes and book your first trip.'}</p>
              <div className="empty-state-action">
                <Link to="/search" className="btn btn-primary">{t('search.title') || 'Search Routes'}</Link>
              </div>
            </div>
          </ScrollReveal>
        ) : (
          <div className="booking-list">
            {bookings.map(b => (
              <ScrollReveal key={b.id} className="animate-fade-up">
                <Link to={`/bookings/${b.id}`} className="booking-list-item">
                  <div className="booking-list-item-info">
                    <div className="booking-list-item-title">Booking #{b.id}</div>
                    <div className="booking-list-item-meta">
                      <span>{b.route || 'Route'}</span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                  </div>
                  <span className="booking-list-item-arrow">→</span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default BookingHistoryPage;
