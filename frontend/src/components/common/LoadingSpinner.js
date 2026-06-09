import React from 'react';

function LoadingSpinner({ size = '', text = '' }) {
  return (
    <div className="loading-page" role="status" aria-label="Loading">
      <div className={`spinner ${size ? `spinner-${size}` : ''}`} />
      {text && <p className="loading-page-text">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
