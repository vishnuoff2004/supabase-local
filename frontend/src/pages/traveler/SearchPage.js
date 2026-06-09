import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function SearchPage() {
  const { t } = useTranslation();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSource = useDebounce(source, 300);
  const debouncedDestination = useDebounce(destination, 300);
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!debouncedSource && !debouncedDestination) {
      setResults([]);
      return;
    }
    hasFetched.current = true;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/routes/search', { params: { source: debouncedSource, destination: debouncedDestination } });
        if (!cancelled) setResults(res.data.data || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSource, debouncedDestination]);

  return (
    <div className="search-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="search-header">
            <h1 className="search-title">{t('search.title') || 'Find Your Route'}</h1>
            <p className="search-description">{t('search.description') || 'Search for available routes between cities'}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="search-bar">
            <input
              className="form-input"
              placeholder={t('search.from') || 'From'}
              value={source}
              onChange={e => setSource(e.target.value)}
              aria-label={t('search.from') || 'Source'}
            />
            <input
              className="form-input"
              placeholder={t('search.to') || 'To'}
              value={destination}
              onChange={e => setDestination(e.target.value)}
              aria-label={t('search.to') || 'Destination'}
            />
          </div>
        </ScrollReveal>

        {loading && (
          <div className="search-results">
            <SkeletonCard count={3} />
          </div>
        )}

        {!loading && !hasFetched.current && results.length === 0 && (
          <ScrollReveal className="animate-scale-in">
            <div className="search-empty">
              <div className="search-empty-icon">🔍</div>
              <h3 className="search-empty-title">{t('search.startTyping') || 'Start Searching'}</h3>
              <p className="search-empty-text">{t('search.hint') || 'Enter a source and destination to find available routes.'}</p>
            </div>
          </ScrollReveal>
        )}

        {!loading && hasFetched.current && results.length === 0 && (
          <ScrollReveal className="animate-scale-in">
            <div className="search-empty">
              <div className="search-empty-icon">🚫</div>
              <h3 className="search-empty-title">{t('search.noResults') || 'No Routes Found'}</h3>
              <p className="search-empty-text">{t('search.tryDifferent') || 'Try a different search or check back later.'}</p>
            </div>
          </ScrollReveal>
        )}

        {results.length > 0 && (
          <div className="search-results animate-stagger revealed">
            {results.map(r => (
              <div key={r.id} className="search-result-card">
                <div className="search-result-route">
                  <h3>
                    <span className="search-result-route-icon">📍</span>
                    {r.source} → {r.destination}
                  </h3>
                  <div className="search-result-details">
                    <span className="search-result-detail">🚗 {r.vehicleType}</span>
                    <span className="search-result-detail">👤 {r.driverName}</span>
                    <span className="search-result-detail">🏢 {r.agencyName}</span>
                  </div>
                </div>
                <div className="search-result-actions">
                  <div className="search-result-price">₹{r.fare}</div>
                  <div className="search-result-price-label">per seat</div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/bookings/new?routeId=${r.id}&driverId=${r.driverId}`)}
                  >
                    {t('search.book') || 'Book Now'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
