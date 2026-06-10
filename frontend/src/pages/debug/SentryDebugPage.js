import React from 'react';
import * as Sentry from '@sentry/react';
import Button from '../../components/common/Button';

function SentryDebugPage() {
  const [status, setStatus] = React.useState('');
  const [logs, setLogs] = React.useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const checkSentryStatus = () => {
    addLog('🔍 Checking Sentry status...');
    
    const dsn = process.env.REACT_APP_SENTRY_DSN;
    const environment = process.env.NODE_ENV;
    
    addLog(`DSN: ${dsn ? '✅ Configured' : '❌ Not found'}`);
    addLog(`DSN Value: ${dsn ? dsn.substring(0, 50) + '...' : 'undefined'}`);
    addLog(`Environment: ${environment}`);
    addLog(`Sentry Initialized: ${Sentry.isInitialized() ? '✅ Yes' : '❌ No'}`);
    
    setStatus(`DSN: ${dsn ? 'Configured' : 'Missing'} | Initialized: ${Sentry.isInitialized() ? 'Yes' : 'No'}`);
  };

  const testConsoleError = () => {
    addLog('🚨 Triggering console error...');
    try {
      throw new Error('Test error from SentryDebugPage - console.error');
    } catch (error) {
      console.error(error);
      addLog('✅ Error thrown and logged to console');
    }
  };

  const testCaptureException = () => {
    addLog('🚨 Capturing exception via Sentry.captureException()...');
    try {
      throw new Error('Test error from SentryDebugPage - captureException');
    } catch (error) {
      const eventId = Sentry.captureException(error);
      addLog(`✅ Exception captured. Event ID: ${eventId}`);
    }
  };

  const testCaptureMessage = () => {
    addLog('📨 Sending message via Sentry.captureMessage()...');
    const eventId = Sentry.captureMessage('Test message from SentryDebugPage', 'info');
    addLog(`✅ Message captured. Event ID: ${eventId}`);
  };

  const testBreadcrumb = () => {
    addLog('🔗 Adding breadcrumb...');
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'This is a test breadcrumb',
      level: 'info',
    });
    addLog('✅ Breadcrumb added');
  };

  const testSetUser = () => {
    addLog('👤 Setting user context...');
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'traveler',
    });
    addLog('✅ User context set');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('📋 Logs cleared');
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: 'var(--font-family)',
      color: 'var(--color-text)'
    }}>
      <h1 style={{ color: 'var(--color-accent)' }}>🔍 Sentry Debug Panel</h1>
      
      <div style={{
        background: 'var(--color-bg)',
        border: '2px solid var(--color-accent)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>
          Status: <span style={{ color: 'var(--color-success)' }}>{status || 'Click "Check Status" to start'}</span>
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <Button onClick={checkSentryStatus} size="md">
          🔍 Check Status
        </Button>
        <Button onClick={testSetUser} size="md">
          👤 Set User Context
        </Button>
        <Button onClick={testBreadcrumb} size="md">
          🔗 Add Breadcrumb
        </Button>
        <Button onClick={testCaptureMessage} size="md">
          📨 Send Message
        </Button>
        <Button onClick={testCaptureException} size="md" style={{ background: 'var(--color-error)' }}>
          🚨 Capture Exception
        </Button>
        <Button onClick={testConsoleError} size="md" style={{ background: 'var(--color-warning)' }}>
          ⚠️ Console Error
        </Button>
        <Button onClick={clearLogs} variant="secondary" size="md">
          🗑️ Clear Logs
        </Button>
      </div>

      <div style={{
        background: '#1a1a2e',
        color: '#00ff00',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid var(--color-border)'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>Logs will appear here...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '8px', wordBreak: 'break-word' }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        fontSize: '0.9rem',
        lineHeight: '1.6'
      }}>
        <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>📝 Debug Steps:</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>Click "Check Status" to verify DSN is loaded</li>
          <li>Click "Set User Context" to add user info</li>
          <li>Click "Capture Exception" to send an error</li>
          <li>Check <strong>Sentry Dashboard Issues</strong> tab</li>
          <li>Open <strong>Browser DevTools → Network</strong> and look for requests to <code>sentry.io</code></li>
          <li>Verify response status is <strong>200 OK</strong></li>
        </ol>
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#fff3cd',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #ffc107',
        color: '#856404'
      }}>
        <strong>⚠️ Troubleshooting Tips:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Make sure you're logged into <strong>Sentry Dashboard</strong> in another tab</li>
          <li>Refresh Sentry Dashboard (F5) to see new events</li>
          <li>Check <strong>Network tab</strong> in DevTools for errors sending to Sentry</li>
          <li>Look for <strong>CORS errors</strong> or <strong>404s</strong> in Network tab</li>
          <li>Verify DSN is exactly correct (no typos or spaces)</li>
          <li>Check if your Sentry projects are still active</li>
        </ul>
      </div>
    </div>
  );
}

export default SentryDebugPage;
