import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';

const roleRoutes = {
  admin: '/admin/dashboard',
  agency_admin: '/agency/dashboard',
  driver: '/driver/dashboard',
  traveler: '/search',
};

const demoCredentials = [
  { role: 'Admin', email: 'admin123@gmail.com', password: 'Admin123' },
  { role: 'Agency', email: 'agency@example.com', password: 'Password@123' },
  { role: 'Driver', email: 'driver@example.com', password: 'Password@123' },
  { role: 'Traveler', email: 'traveler@example.com', password: 'Password@123' },
];

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get('sessionExpired')) {
      setError(t('auth.sessionExpired'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data?.user?.role || 'traveler';
      const route = roleRoutes[role] || '/search';
      navigate(route);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    const cred = demoCredentials.find(c => c.email === demoEmail);
    setEmail(demoEmail);
    setPassword(cred?.password || 'Password@123');
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in-on-load">
        <div className="auth-logo">
          <span className="auth-logo-icon">TP</span>
        </div>
        <h1 className="auth-title">{t('auth.welcomeBack')}</h1>
        <p className="auth-subtitle">{t('auth.signIn')}</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">{t('auth.email')}</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">{t('auth.password')}</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('auth.signInButton')}
          </Button>
        </form>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          {t('auth.dontHaveAccount')} <Link to="/register">{t('auth.createOne')}</Link>
        </div>

        <details style={{ marginTop: 20, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t('auth.demoAccounts')}</summary>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {demoCredentials.map(d => (
              <button
                key={d.email}
                type="button"
                onClick={() => fillDemo(d.email)}
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-family)',
                  color: 'var(--color-text)',
                  transition: 'all var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
              >
                <strong style={{ color: 'var(--color-accent)' }}>{d.role}</strong>
                : {d.email} / {d.password}
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

export default LoginPage;
