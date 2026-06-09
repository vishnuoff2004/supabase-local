import React from 'react';

function SelectField({ label, error, options, placeholder, register, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <select
        className={`form-select ${error ? 'error' : ''}`}
        {...register}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}

export default SelectField;
