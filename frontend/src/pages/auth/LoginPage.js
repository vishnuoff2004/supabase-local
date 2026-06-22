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
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fillDemo = (demoEmail) => {
    const cred = demoCredentials.find(c => c.email === demoEmail);
    setEmail(demoEmail);
    setPassword(cred?.password || '');
  };

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
      const role = data?.role || 'traveler';
      const route = roleRoutes[role] || '/search';
      navigate(route);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google login failed');
      setGoogleLoading(false);
    }
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

        <div className="auth-divider">
          <span>{t('auth.orContinueWith', 'or continue with')}</span>
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          loading={googleLoading}
          className="w-full"
          size="lg"
          variant="outline"
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth.signInWithGoogle', 'Sign in with Google')}
          </span>
        </Button>

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

        <div className="auth-footer" style={{ marginTop: 16 }}>
          {t('auth.dontHaveAccount')} <Link to="/register">{t('auth.createOne')}</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
