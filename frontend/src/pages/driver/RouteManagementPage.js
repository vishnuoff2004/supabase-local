import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

const PAGE_SIZE = 10;

function RouteManagementPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ source: '', destination: '', departureTime: '', arrivalTime: '', fare: '', capacity: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const fetchRoutes = useCallback(async () => {
    setRoutesLoading(true);
    setRoutesError(null);
    try {
      const res = await api.get('/drivers/routes');
      setRoutes(res.data);
    } catch (err) {
      setRoutesError(err.response?.data?.message || t('driver.failedToLoadRoutes', 'Failed to load routes'));
    } finally {
      setRoutesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filteredRoutes = useMemo(() => {
    let result = routes.filter(r => r.status === 'active');
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.source.toLowerCase().includes(term) ||
        r.destination.toLowerCase().includes(term)
      );
    }
    return result;
  }, [routes, searchTerm]);

  const paginatedRoutes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRoutes.slice(start, start + PAGE_SIZE);
  }, [filteredRoutes, page]);

  const totalPages = Math.ceil(filteredRoutes.length / PAGE_SIZE);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/drivers/routes', form);
      setSuccess(true);
      setForm({ source: '', destination: '', departureTime: '', arrivalTime: '', fare: '', capacity: '' });
      setTimeout(() => setSuccess(false), 3000);
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || t('driver.failedToCreateRoute', 'Failed to create route'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (routeId, currentAvailable) => {
    setToggleLoading(routeId);
    try {
      await api.put(`/drivers/routes/${routeId}/availability`, { available: !currentAvailable });
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || t('driver.failedToUpdateAvailability', 'Failed to update availability'));
    } finally {
      setToggleLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="driver-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('driver.routes', 'Manage Routes')}</h1>
              <p className="text-muted">{t('driver.createNewRoutes', 'Create new driving routes')}</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="route-form-card">
            {success && (
              <div className="success-state" style={{ padding: '16px 0' }}>
                <div className="success-state-icon" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>&#10003;</div>
                <h3 style={{ marginTop: 8 }}>{t('driver.routeCreated', 'Route Created!')}</h3>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-input-group">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.source', 'Source')}</label>
                  <input className="form-input" name="source" placeholder={t('driver.sourcePlaceholder', 'City name')} value={form.source} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.destination', 'Destination')}</label>
                  <input className="form-input" name="destination" placeholder={t('driver.destinationPlaceholder', 'City name')} value={form.destination} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-input-group">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.departure', 'Departure')}</label>
                  <input className="form-input" name="departureTime" type="datetime-local" value={form.departureTime} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.arrival', 'Arrival')}</label>
                  <input className="form-input" name="arrivalTime" type="datetime-local" value={form.arrivalTime} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-input-group">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.farePerSeat', 'Fare (₹)')}</label>
                  <input className="form-input" name="fare" type="number" placeholder={t('driver.fareAmountPlaceholder', 'Amount')} value={form.fare} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.capacity', 'Capacity')}</label>
                  <input className="form-input" name="capacity" type="number" placeholder={t('driver.capacityPlaceholder', 'Seats')} value={form.capacity} onChange={handleChange} required />
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                {t('driver.createRoute', 'Create Route')}
              </Button>
            </form>
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="route-table-section">
            <div className="route-table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2>{t('driver.myRoutes', 'My Routes')}</h2>
                {filteredRoutes.length > 0 && (
                  <span className="route-count-badge">{filteredRoutes.length}</span>
                )}
              </div>
              <input
                className="form-input"
                placeholder={t('driver.searchRoutes', 'Search routes...')}
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>

            {routesLoading && (
              <div className="table-loading">
                <div className="skeleton" style={{ height: 40, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 40, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            )}

            {routesError && (
              <div style={{ padding: 24 }}>
                <div className="error-banner">
                  <span>{routesError}</span>
                  <button className="btn btn-sm btn-outline" onClick={fetchRoutes} style={{ marginLeft: 12 }}>
                    {t('common.retry', 'Retry')}
                  </button>
                </div>
              </div>
            )}

            {!routesLoading && !routesError && filteredRoutes.length === 0 && (
              <div className="table-empty">
                <div className="table-empty-icon">&#128652;</div>
                <p>{searchTerm ? t('driver.noSearchResults', 'No routes match your search.') : t('driver.noRoutes', 'No active routes yet. Create your first route above.')}</p>
              </div>
            )}

            {!routesLoading && !routesError && filteredRoutes.length > 0 && (
              <>
                <div className="table-container" style={{ boxShadow: 'none', borderRadius: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('driver.route', 'Route')}</th>
                        <th>{t('driver.departure', 'Departure')}</th>
                        <th>{t('driver.arrival', 'Arrival')}</th>
                        <th>{t('driver.fare', 'Fare')}</th>
                        <th>{t('driver.capacity', 'Capacity')}</th>
                        <th>{t('driver.availability', 'Availability')}</th>
                        <th>{t('common.action', 'Action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRoutes.map(route => (
                        <tr key={route.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '1.1rem' }}>&#128205;</span>
                              <strong>{route.source} &rarr; {route.destination}</strong>
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(route.departureTime)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(route.arrivalTime)}</td>
                          <td><strong style={{ color: 'var(--color-accent)' }}>&#8377;{route.fare}</strong></td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              &#128100; {route.capacity}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${route.available ? 'badge-confirmed' : 'badge-cancelled'}`}>
                              {route.available ? t('driver.available', 'Available') : t('driver.unavailable', 'Unavailable')}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${route.available ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => handleToggleAvailability(route.id, route.available)}
                              disabled={toggleLoading === route.id}
                            >
                              {toggleLoading === route.id
                                ? '...'
                                : route.available
                                  ? t('driver.markUnavailable', 'Mark Unavailable')
                                  : t('driver.markAvailable', 'Mark Available')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--color-border)' }}>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default RouteManagementPage;
