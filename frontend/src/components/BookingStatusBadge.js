import React from 'react';

const statusMap = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  'in-progress': 'badge-in-progress',
  in_progress: 'badge-in-progress',
  'on trip': 'badge-in-progress',
  'on_trip': 'badge-in-progress',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  rejected: 'badge-rejected',
};

function BookingStatusBadge({ status, className = '' }) {
  const badgeClass = statusMap[status?.toLowerCase()] || 'badge-pending';
  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {status || 'Unknown'}
    </span>
  );
}

export default BookingStatusBadge;
