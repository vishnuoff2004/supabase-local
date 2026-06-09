import React from 'react';

function Button({ children, variant = 'primary', size = '', loading = false, icon = false, className = '', ...props }) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size && `btn-${size}`,
    icon && 'btn-icon',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={loading} {...props}>
      {loading ? <span className="spinner spinner-sm" /> : children}
    </button>
  );
}

export default Button;
