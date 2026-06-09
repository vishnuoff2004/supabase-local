import React from 'react';

function DatePicker({ label, error, register, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <input
        className={`form-input ${error ? 'error' : ''}`}
        type="date"
        {...register}
        {...props}
      />
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}

export default DatePicker;
