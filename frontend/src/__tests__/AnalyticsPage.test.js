import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../contexts/AuthContext';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';

jest.mock('../services/api');
jest.mock('../services/analyticsService');

const mockAnalyticsData = [
  { date: '2026-06-01', count: 5 },
  { date: '2026-06-02', count: 3 },
  { date: '2026-06-03', count: 8 },
];

function renderWithAuth() {
  localStorage.setItem('token', 'mock-token');
  return render(
    <AuthProvider>
      <AnalyticsPage />
    </AuthProvider>
  );
}

describe('AnalyticsPage — REQ-051', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('TEST-177: displays loading skeleton on mount', () => {
    const analyticsService = require('../services/analyticsService');
    analyticsService.getBookingsByDate.mockImplementation(() => new Promise(() => {}));
    renderWithAuth();
    expect(document.querySelector('.skeleton-table-row')).toBeInTheDocument();
  });

  test('TEST-178: renders analytics data from service', async () => {
    const analyticsService = require('../services/analyticsService');
    analyticsService.getBookingsByDate.mockResolvedValue(mockAnalyticsData);
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('2026-06-01')).toBeInTheDocument();
      expect(screen.getByText('2026-06-02')).toBeInTheDocument();
      expect(screen.getByText('2026-06-03')).toBeInTheDocument();
    });
  });

  test('TEST-179: renders error state when service fails', async () => {
    const analyticsService = require('../services/analyticsService');
    analyticsService.getBookingsByDate.mockRejectedValue(new Error('Failed to load analytics'));
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    });
  });

  test('TEST-180: shows empty state when no data', async () => {
    const analyticsService = require('../services/analyticsService');
    analyticsService.getBookingsByDate.mockResolvedValue([]);
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
    });
  });

  test('TEST-181: applies date filter on button click', async () => {
    const analyticsService = require('../services/analyticsService');
    analyticsService.getBookingsByDate.mockResolvedValue(mockAnalyticsData);
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    });
    const applyButton = screen.getByText('Apply Filter');
    await userEvent.click(applyButton);
    await waitFor(() => {
      expect(analyticsService.getBookingsByDate).toHaveBeenCalled();
    });
  });

  test('TEST-182: displays total booking count', async () => {
    const analyticsService = require('../services/analyticsService');
    analyticsService.getBookingsByDate.mockResolvedValue(mockAnalyticsData);
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('16')).toBeInTheDocument();
    });
  });
});
