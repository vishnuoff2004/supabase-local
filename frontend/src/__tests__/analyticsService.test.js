import api from '../services/api';

jest.mock('../services/api');

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getBookingsByDate sends GET with params', async () => {
    const mockResponse = { data: [{ date: '2026-06-01', count: 5 }] };
    api.get.mockResolvedValue(mockResponse);

    const { getBookingsByDate } = require('../services/analyticsService');
    const result = await getBookingsByDate({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(api.get).toHaveBeenCalledWith('/analytics/bookings-by-date', {
      params: { startDate: '2026-06-01', endDate: '2026-06-30' },
    });
    expect(result).toEqual(mockResponse.data);
  });

  test('getBookingsByDate works without params', async () => {
    api.get.mockResolvedValue({ data: [] });

    const { getBookingsByDate } = require('../services/analyticsService');
    await getBookingsByDate();

    expect(api.get).toHaveBeenCalledWith('/analytics/bookings-by-date', { params: {} });
  });

  test('getBookingsByDate propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Server error'));

    const { getBookingsByDate } = require('../services/analyticsService');
    await expect(getBookingsByDate({ startDate: '2026-01-01' })).rejects.toThrow('Server error');
  });
});
