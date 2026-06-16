import React, { useState, useEffect } from 'react';

function PwaUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleUpdate = (event) => {
      setWaitingWorker(event.detail);
      setShowPrompt(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 10000,
        background: 'var(--color-surface, #fff)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '400px',
        fontFamily: 'var(--font-family, sans-serif)',
        border: '1px solid var(--color-border, #e0e0e0)',
        animation: 'slideUp 0.3s ease',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--color-text, #333)' }}>
          Update Available
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary, #666)' }}>
          A new version is ready. Refresh to get the latest features.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleDismiss}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--color-border, #d0d0d0)',
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--color-text-secondary, #666)',
          }}
        >
          Later
        </button>
        <button
          onClick={handleUpdate}
          style={{
            padding: '6px 16px',
            border: 'none',
            borderRadius: '6px',
            background: 'var(--color-accent, #0D530E)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default PwaUpdatePrompt;
