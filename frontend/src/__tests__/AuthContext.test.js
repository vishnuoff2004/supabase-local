import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

jest.mock('../services/api');

function makeToken(payload) {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.signature`;
}

function TestComponent() {
  const { user, token, loading, error, login, register, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button data-testid="login" onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button data-testid="register" onClick={() => register({ name: 'Test' })}>Register</button>
      <button data-testid="logout" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should start with loading true then false', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  test('should have null user and token when not logged in', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });
  });

  test('should set user from stored token', async () => {
    const token = makeToken({ id: 1, role: 'traveler', exp: Date.now() / 1000 + 3600 });
    localStorage.setItem('token', token);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe(token);
    });
  });
});
