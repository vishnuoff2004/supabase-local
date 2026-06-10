import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';

function UnauthorizedAccessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const roleDescriptions = {
    admin: t('admin.dashboard'),
    agency_admin: t('agency.dashboard'),
    driver: t('driver.dashboard'),
    traveler: t('nav.home'),
  };

  const roleRoutes = {
    admin: '/admin/dashboard',
    agency_admin: '/agency/dashboard',
    driver: '/driver/dashboard',
    traveler: '/search',
  };

  const defaultRoute = roleRoutes[user?.role] || '/search';
  const defaultLabel = roleDescriptions[user?.role] || 'Home';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--color-error)' }}>{t('error.unauthorized')}</h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
          {t('error.unauthorizedMsg')} {t('error.yourRole')} <strong>{user?.role || 'Unknown'}</strong>
        </p>

        <div style={{ 
          background: 'var(--color-bg)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-md)', 
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            <strong>{t('error.yourRole')}</strong> {user?.role || 'Unknown'}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            <strong>{t('error.yourUserId')}</strong> {user?.id || 'Unknown'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            onClick={() => navigate(defaultRoute)}
            size="lg"
          >
            {t('error.goToDashboard')}
          </Button>
          <Button 
            onClick={() => navigate(-1)}
            variant="secondary"
            size="lg"
          >
            {t('error.goBack')}
          </Button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '24px' }}>
          {t('error.contact')}
        </p>
      </div>
    </div>
  );
}

export default UnauthorizedAccessPage;
