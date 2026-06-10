const Sentry = require('@sentry/node');

function initSentry(app) {
  const sentryDSN = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (sentryDSN) {
    Sentry.init({
      dsn: sentryDSN,
      environment,
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      beforeSend(event, hint) {
        if (environment === 'development') {
          console.log('[Sentry Backend] Event captured:', event.exception ? event.exception[0].value : event.message);
        }
        return event;
      },
    });

    // Attach Sentry middleware
    if (Sentry.Handlers && Sentry.Handlers.requestHandler) {
      app.use(Sentry.Handlers.requestHandler());
    }

    return true;
  } else if (environment === 'production') {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
  }

  return false;
}

function attachSentryErrorHandler(app) {
  if (Sentry.Handlers && Sentry.Handlers.errorHandler) {
    app.use(Sentry.Handlers.errorHandler());
  }
}

function captureException(error, context = {}) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, level);
  if (Object.keys(context).length > 0) {
    Sentry.setContext('custom', context);
  }
}

module.exports = {
  Sentry,
  initSentry,
  attachSentryErrorHandler,
  captureException,
  captureMessage,
};
