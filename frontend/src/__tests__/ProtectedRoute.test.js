import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('../contexts/AuthContext');
const ProtectedRoute = require('../components/common/ProtectedRoute').default;

function TestPage() {
  return <div data-testid="protected-content">Protected Content</div>;
}

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={<ProtectedRoute />}>
          <Route index element={<TestPage />} />
        </Route>
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute — REQ-044', () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  test('renders children when authenticated', () => {
    useAuth.mockReturnValue({ token: 'valid-token', loading: false });
    renderProtectedRoute();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    useAuth.mockReturnValue({ token: null, loading: false });
    renderProtectedRoute();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('shows loading spinner while auth is loading', () => {
    useAuth.mockReturnValue({ token: null, loading: true });
    renderProtectedRoute();
    expect(screen.getByText('Verifying session...')).toBeInTheDocument();
  });
});
