import React from 'react';

function FormError({ message, className = '' }) {
  if (!message) return null;
  return (
    <span className={`form-error ${className}`} role="alert">
      {message}
    </span>
  );
}

export default FormError;
