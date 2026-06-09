import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BookingProvider, useBooking } from '../contexts/BookingContext';

const mockApi = { get: jest.fn(), post: jest.fn(), put: jest.fn() };
jest.mock('../services/api', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn() }));

function TestComponent() {
  const { bookings, loading, getBookings, cancelBooking } = useBooking();
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="count">{bookings.length}</div>
      <button data-testid="get-bookings" onClick={() => getBookings()}>Get Bookings</button>
      <button data-testid="cancel-booking" onClick={() => cancelBooking(1)}>Cancel</button>
    </div>
  );
}

describe('BookingContext — REQ-050', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TEST-200: provides initial empty state', () => {
    render(
      <BookingProvider>
        <TestComponent />
      </BookingProvider>
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  test('TEST-201: getBookings fetches and sets bookings', async () => {
    const api = require('../services/api');
    api.get.mockResolvedValue({
      data: { data: [{ id: 1, route: 'Delhi → Mumbai' }], totalPages: 1, page: 1, total: 1 }
    });
    render(
      <BookingProvider>
        <TestComponent />
      </BookingProvider>
    );
    act(() => {
      screen.getByTestId('get-bookings').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('1');
    });
  });

  test('TEST-202: cancelBooking calls API', async () => {
    const api = require('../services/api');
    api.put.mockResolvedValue({ data: { success: true } });
    render(
      <BookingProvider>
        <TestComponent />
      </BookingProvider>
    );
    act(() => {
      screen.getByTestId('cancel-booking').click();
    });
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/bookings/1/cancel');
    });
  });

  test('TEST-203: throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useBooking must be used within BookingProvider');
    consoleError.mockRestore();
  });
});
