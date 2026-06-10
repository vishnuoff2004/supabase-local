import * as Sentry from '@sentry/react';

export function initSentry() {
  const sentryDSN = process.env.REACT_APP_SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (sentryDSN) {
    Sentry.init({
      dsn: sentryDSN,
      environment,
      integrations: [
        Sentry.captureConsoleIntegration({
          levels: ['error', 'warn'],
        }),
      ],
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      beforeSend(event, hint) {
        if (environment === 'development') {
          console.log('[Sentry Frontend] Event captured:', event.exception ? event.exception[0].value : event.message);
        }
        return event;
      },
    });
    console.log('✅ Sentry initialized with DSN:', sentryDSN.substring(0, 50) + '...');
  } else if (environment === 'production') {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
  }
}

export default Sentry;
