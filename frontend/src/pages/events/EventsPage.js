import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

const eventIcons = ['🎉', '📅', '🎪', '🎭', '🎵', '🏆', '✈️', '🎊'];

function EventsPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/events');
        if (!cancelled) setEvents(res.data.data || []);
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  if (loading) {
    return (
      <div className="events-page">
        <div className="container">
          <h1 className="admin-title mb-lg">{t('events.title')}</h1>
          <div className="events-grid">
            <SkeletonCard count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-page">
        <div className="container">
          <div className="error-state">
            <div className="error-state-icon">✕</div>
            <h3>{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('events.title')}</h1>
              <p className="text-muted">{events.length} upcoming events</p>
            </div>
          </div>
        </ScrollReveal>

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 className="empty-state-title">{t('events.noUpcoming')}</h3>
            <p className="empty-state-text">Check back later for new events.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((e, i) => (
              <ScrollReveal key={e.id} className="animate-fade-up">
                <div className="event-card">
                  <div className="event-card-image">
                    {eventIcons[i % eventIcons.length]}
                  </div>
                  <div className="event-card-body">
                    <h3 className="event-card-title">{e.title}</h3>
                    <p className="event-card-description">{e.description}</p>
                    <div className="event-card-meta">
                      <div className="event-card-meta-item">
                        <span className="event-card-meta-icon">📅</span>
                        <span>{new Date(e.startDate).toLocaleDateString()} - {new Date(e.endDate).toLocaleDateString()}</span>
                      </div>
                      {e.location && (
                        <div className="event-card-meta-item">
                          <span className="event-card-meta-icon">📍</span>
                          <span>{e.location}</span>
                        </div>
                      )}
                    </div>
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

export default EventsPage;
