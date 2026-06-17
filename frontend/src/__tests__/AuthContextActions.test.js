import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

var mockPost, mockGet;

jest.mock('../services/api', () => {
  mockPost = jest.fn();
  mockGet = jest.fn();
  return { default: { post: mockPost, get: mockGet }, __esModule: true };
});

function TestComponent() {
  const { user, token, loading, error, login, register, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={() => { login('test@test.com', 'pass').catch(() => {}); }}>Login</button>
      <button onClick={() => { register({ name: 'Test', email: 'test@test.com' }).catch(() => {}); }}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

describe('AuthContext — Actions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('login calls api.post with email and password', async () => {
    mockPost.mockResolvedValue({
      data: { token: 'jwt-token', user: { id: 1, role: 'traveler' } },
    });
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'pass' });
    });
  });

  test('login sets error on failure', async () => {
    mockPost.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
    });
  });

  test('register calls api.post with data', async () => {
    mockPost.mockResolvedValue({ data: { message: 'OTP sent' } });
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/register', { name: 'Test', email: 'test@test.com' });
    });
  });

  test('logout clears localStorage token and resets state', async () => {
    localStorage.setItem('token', 'old-token');
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Logout'));

    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
