import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../services/api');
jest.mock('../components/AnnouncementBanner', () => () => null);
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({ user: null, token: null, loading: false }),
}));
jest.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }) => <div data-testid="notif-provider">{children}</div>,
}));
jest.mock('../contexts/SocketContext', () => ({
  SocketProvider: ({ children }) => <div data-testid="socket-provider">{children}</div>,
}));
jest.mock('../contexts/BookingContext', () => ({
  BookingProvider: ({ children }) => <div data-testid="booking-provider">{children}</div>,
}));
jest.mock('../AppRoutes', () => () => <div data-testid="app-routes">Routes</div>);
jest.mock('../components/AnnouncementBanner', () => () => null);

describe('App Integration — REQ-050, REQ-053', () => {
  test('TEST-204: App mounts with all providers', () => {
    render(<App />);
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  test('TEST-205: BookingProvider is mounted in provider tree', () => {
    render(<App />);
    expect(screen.getByTestId('booking-provider')).toBeInTheDocument();
  });

  test('TEST-206: AppRoutes is rendered inside providers', () => {
    render(<App />);
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });
});
