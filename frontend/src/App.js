import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { BookingProvider } from './contexts/BookingContext';
import AnnouncementBanner from './components/AnnouncementBanner';
import PwaUpdatePrompt from './components/common/PwaUpdatePrompt';
import './styles/design-system.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LanguageProvider>
        <NotificationProvider>
          <AuthProvider>
            <SocketProvider>
              <BookingProvider>
                <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
                  <AnnouncementBanner />
                  <AppRoutes />
                  <PwaUpdatePrompt />
                </Sentry.ErrorBoundary>
              </BookingProvider>
            </SocketProvider>
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

function ErrorFallback() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-family)',
      color: 'var(--color-text)'
    }}>
      <div style={{ maxWidth: '500px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--color-error)' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
          We've been notified about this error and our team is working on a fix. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: 'var(--color-accent)',
            color: 'var(--color-white)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--color-dark)'}
          onMouseLeave={(e) => e.target.style.background = 'var(--color-accent)'}
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export default Sentry.withProfiler(App);
