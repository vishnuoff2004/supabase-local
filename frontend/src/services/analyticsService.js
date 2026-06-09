import api from './api';

export async function getBookingsByDate(params = {}) {
  const res = await api.get('/analytics/bookings-by-date', { params });
  return res.data;
}
