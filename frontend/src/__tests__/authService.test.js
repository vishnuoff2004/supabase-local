import api from '../services/api';

jest.mock('../services/api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login sends POST to /auth/login', async () => {
    const mockResponse = { data: { token: 'jwt', user: { id: 1 } } };
    api.post.mockResolvedValue(mockResponse);

    const { login } = require('../services/authService');
    const result = await login('test@example.com', 'Password123');

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'Password123',
    });
    expect(result).toEqual(mockResponse.data);
  });

  test('register sends POST to /auth/register', async () => {
    const mockResponse = { data: { message: 'OTP sent', email: 'test@example.com' } };
    api.post.mockResolvedValue(mockResponse);

    const { register } = require('../services/authService');
    const result = await register({ name: 'Test', email: 'test@example.com', password: 'Password123' });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Test', email: 'test@example.com', password: 'Password123',
    });
    expect(result).toEqual(mockResponse.data);
  });

  test('login propagates API errors', async () => {
    api.post.mockRejectedValue(new Error('Request failed'));

    const { login } = require('../services/authService');
    await expect(login('test@example.com', 'Password123')).rejects.toThrow('Request failed');
  });
});
