import React from 'react';

function InputField({ label, error, register, type = 'text', placeholder, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <input
        className={`form-input ${error ? 'error' : ''}`}
        type={type}
        placeholder={placeholder}
        {...register}
        {...props}
      />
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}

export default InputField;
