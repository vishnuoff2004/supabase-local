import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

const mockSignInWithPassword = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();

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
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

const api = require('../services/api').default;
const LoginPage = require('../pages/auth/LoginPage').default;

function renderLoginPage() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('LoginPage — REQ-001, REQ-002', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  });

  test('renders login form with email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/auth\.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signInButton/i })).toBeInTheDocument();
  });

  test('displays error on failed login', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/auth\.email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/auth\.email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/auth\.password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /signInButton/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  test('displays loading state during login', async () => {
    mockSignInWithPassword.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/auth\.email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/auth\.email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/auth\.password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /signInButton/i }));

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('type') === 'submit');
      expect(submitBtn).toBeDisabled();
    });
  });

  test('fills demo credentials on demo account click', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText(/auth\.demoAccounts/i)).toBeInTheDocument();
    });

    const demoSummary = screen.getByText(/auth\.demoAccounts/i);
    await user.click(demoSummary);

    const adminButton = screen.getAllByRole('button').find(b => b.textContent.includes('admin123@gmail.com'));
    await user.click(adminButton);

    const emailInput = screen.getByLabelText(/auth\.email/i);
    expect(emailInput).toHaveValue('admin123@gmail.com');
  });
});
