import React, { useEffect } from 'react';

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function NotificationToast({ id, type = 'info', title, message, onDismiss, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button className="toast-close" onClick={() => onDismiss(id)} aria-label="Dismiss notification">
        ✕
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => (
        <NotificationToast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default NotificationToast;
