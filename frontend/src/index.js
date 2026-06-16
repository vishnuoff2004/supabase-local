import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './utils/sentry';
import App from './App';
import './i18n';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register({
  onUpdate(registration) {
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      window.dispatchEvent(
        new CustomEvent('sw-update-available', { detail: waitingWorker })
      );
    }
  },
  onSuccess() {
    console.log('Content cached for offline use.');
  },
});
