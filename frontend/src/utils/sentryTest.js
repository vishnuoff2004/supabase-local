import * as Sentry from '@sentry/react';

export function testSentryIntegration() {
  const environment = process.env.NODE_ENV || 'development';
  const sentryDSN = process.env.REACT_APP_SENTRY_DSN;

  console.log('🔍 Sentry Configuration Check:');
  console.log(`  Environment: ${environment}`);
  console.log(`  DSN Configured: ${sentryDSN ? '✅ Yes' : '❌ No'}`);
  
  if (sentryDSN) {
    console.log(`  DSN: ${sentryDSN.substring(0, 50)}...`);
    console.log(`  Sentry Initialized: ${Sentry.isInitialized() ? '✅ Yes' : '❌ No'}`);
  }

  return {
    environment,
    dsn: sentryDSN,
    initialized: Sentry.isInitialized(),
  };
}

export function triggerTestError() {
  console.log('🚨 Triggering test error for Sentry...');
  try {
    throw new Error('This is a test error from Sentry integration');
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        type: 'test',
      },
    });
    console.log('✅ Test error captured and sent to Sentry');
  }
}

export function triggerTestMessage() {
  console.log('📨 Sending test message to Sentry...');
  Sentry.captureMessage('This is a test message from Sentry integration', 'info');
  console.log('✅ Test message sent to Sentry');
}

export default {
  testSentryIntegration,
  triggerTestError,
  triggerTestMessage,
};
