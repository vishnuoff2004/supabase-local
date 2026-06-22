import api from '../services/api';

jest.mock('../services/api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register sends POST to /auth/register', async () => {
    const mockResponse = { data: { email: 'test@example.com' } };
    api.post.mockResolvedValue(mockResponse);

    const { register } = require('../services/authService');
    const result = await register({ name: 'Test', email: 'test@example.com', password: 'Password123' });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Test', email: 'test@example.com', password: 'Password123',
    });
    expect(result).toEqual(mockResponse.data);
  });

  test('register propagates API errors', async () => {
    api.post.mockRejectedValue(new Error('Request failed'));

    const { register } = require('../services/authService');
    await expect(register({ name: 'Test', email: 'test@example.com', password: 'Password123' })).rejects.toThrow('Request failed');
  });
});
