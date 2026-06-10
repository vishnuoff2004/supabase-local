import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './utils/sentry';
import App from './App';
import './i18n';

initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
