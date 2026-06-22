import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const mockSignInWithPassword = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock('../services/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signOut: (...args) => mockSignOut(...args),
    },
  },
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: (...args) => mockApiGet(...args), post: (...args) => mockApiPost(...args) },
}));

function TestComponent() {
  const { user, session, loading, error, login, register, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{session?.access_token || 'null'}</div>
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
    jest.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  });

  test('login calls supabase signInWithPassword and then api.get for profile', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'supa-token', user: { id: 'uuid-1' } } },
      error: null,
    });
    mockApiGet.mockResolvedValue({ data: { id: 1, role: 'traveler', email: 'test@test.com' } });

    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@test.com', password: 'pass' });
    });
  });

  test('login sets error on failure', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Invalid credentials'));
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
    mockApiPost.mockResolvedValue({ data: { email: 'test@test.com' } });
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/auth/register', { name: 'Test', email: 'test@test.com' });
    });
  });

  test('logout clears localStorage and resets state', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    localStorage.setItem('supabase_token', 'old-token');
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('null');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    expect(localStorage.getItem('supabase_token')).toBeNull();
  });
});
