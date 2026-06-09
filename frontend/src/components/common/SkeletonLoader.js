import React from 'react';

function SkeletonBase({ width, height, borderRadius, className = '', style }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || 'var(--radius-sm)',
        ...style
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <SkeletonBase height={16} width="70%" style={{ marginBottom: 12 }} borderRadius="var(--radius-sm)" />
          <SkeletonBase height={12} style={{ marginBottom: 8 }} />
          <SkeletonBase height={12} width="80%" style={{ marginBottom: 8 }} />
          <SkeletonBase height={12} width="60%" />
        </div>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="table-container">
      <div className="skeleton-table-row" style={{ background: 'var(--color-bg)' }}>
        <SkeletonBase height={14} />
        <SkeletonBase height={14} />
        <SkeletonBase height={14} />
        <SkeletonBase height={14} />
        <SkeletonBase height={14} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <SkeletonBase height={14} />
          <SkeletonBase height={14} />
          <SkeletonBase height={14} />
          <SkeletonBase height={14} />
          <SkeletonBase height={14} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }) {
  return (
    <div className="skeleton-form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="skeleton skeleton-label" />
          <div className="skeleton" style={{ height: '44px', marginBottom: '20px', borderRadius: 'var(--radius-md)' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat">
          <div className="skeleton skeleton-value" />
          <div className="skeleton skeleton-label" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton skeleton-avatar" />
          <div>
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonLoader({ width, height, borderRadius }) {
  return <SkeletonBase width={width} height={height} borderRadius={borderRadius} />;
}

export default SkeletonLoader;
