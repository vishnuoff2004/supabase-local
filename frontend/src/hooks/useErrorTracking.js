import * as Sentry from '@sentry/react';
import { useAuth } from '../contexts/AuthContext';

export function useErrorTracking() {
  const { user } = useAuth();

  const captureError = (error, context = {}) => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        role: user.role,
      });
    }

    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  };

  const captureMessage = (message, level = 'info', context = {}) => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        role: user.role,
      });
    }

    Sentry.captureMessage(message, level);
    if (Object.keys(context).length > 0) {
      Sentry.setContext('custom', context);
    }
  };

  const addBreadcrumb = (message, data = {}) => {
    Sentry.addBreadcrumb({
      message,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  };

  const startTransaction = (name) => {
    return Sentry.startTransaction({
      name,
      op: 'http.request',
    });
  };

  return {
    captureError,
    captureMessage,
    addBreadcrumb,
    startTransaction,
  };
}

export default useErrorTracking;
