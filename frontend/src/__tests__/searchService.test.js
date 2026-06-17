import api from '../services/api';

jest.mock('../services/api');

describe('searchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('searchRoutes sends GET to /routes/search with params', async () => {
    const mockResponse = { data: [{ id: 1, source: 'Mumbai', destination: 'Pune' }] };
    api.get.mockResolvedValue(mockResponse);

    const { searchRoutes } = require('../services/searchService');
    const result = await searchRoutes('Mumbai', 'Pune', { seats: 2 });

    expect(api.get).toHaveBeenCalledWith('/routes/search', {
      params: { source: 'Mumbai', destination: 'Pune', seats: 2 },
    });
    expect(result).toEqual(mockResponse.data);
  });

  test('searchRoutes works without filters', async () => {
    api.get.mockResolvedValue({ data: [] });

    const { searchRoutes } = require('../services/searchService');
    await searchRoutes('Delhi', 'Agra');

    expect(api.get).toHaveBeenCalledWith('/routes/search', {
      params: { source: 'Delhi', destination: 'Agra' },
    });
  });

  test('searchRoutes propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Network error'));

    const { searchRoutes } = require('../services/searchService');
    await expect(searchRoutes('Mumbai', 'Pune')).rejects.toThrow('Network error');
  });
});
