import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

jest.mock('../hooks/useScrollAnimation', () => ({
  ScrollReveal: ({ children }) => <>{children}</>,
}));

const api = require('../services/api').default;
const SearchPage = require('../pages/traveler/SearchPage').default;

function renderSearchPage() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>
  );
}

describe('SearchPage — REQ-006, REQ-007', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search inputs', () => {
    renderSearchPage();
    expect(screen.getByLabelText(/search\.from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search\.to/i)).toBeInTheDocument();
  });

  test('shows results when source and destination are entered', async () => {
    api.get = jest.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            source: 'Mumbai',
            destination: 'Pune',
            departureTime: new Date(Date.now() + 86400000).toISOString(),
            fare: 500,
            capacity: 4,
            driverName: 'Driver A',
            vehicleType: 'SUV',
            agencyName: 'Agency X',
            exclusivelyBooked: false,
            bookedByMe: false,
          },
        ],
        facetCounts: { vehicleType: { SUV: 1 } },
      },
    });
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/search\.from/i), 'Mumbai');
    await user.type(screen.getByLabelText(/search\.to/i), 'Pune');

    await waitFor(() => {
      expect(screen.getByText(/Driver A/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('TEST-026: displays fare in correct INR format (₹500.00)', async () => {
    api.get = jest.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            source: 'Mumbai',
            destination: 'Pune',
            departureTime: new Date(Date.now() + 86400000).toISOString(),
            fare: 500,
            capacity: 4,
            driverName: 'Driver A',
            vehicleType: 'SUV',
            agencyName: 'Agency X',
            exclusivelyBooked: false,
            bookedByMe: false,
          },
        ],
        facetCounts: { vehicleType: { SUV: 1 } },
      },
    });
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/search\.from/i), 'Mumbai');
    await user.type(screen.getByLabelText(/search\.to/i), 'Pune');

    await waitFor(() => {
      expect(screen.getByText('₹500.00')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('shows empty state when no results found', async () => {
    api.get = jest.fn().mockResolvedValue({ data: { data: [], facetCounts: null } });
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/search\.from/i), 'Nowhere');
    await user.type(screen.getByLabelText(/search\.to/i), 'Nowhere');

    await waitFor(() => {
      expect(screen.getByText(/search\.noResults/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('handles API error gracefully', async () => {
    api.get = jest.fn().mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/search\.from/i), 'Mumbai');
    await user.type(screen.getByLabelText(/search\.to/i), 'Pune');

    await waitFor(() => {
      expect(screen.getByText(/search\.noResults/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

// ─── TEST-160: Keyboard navigation on search page ────────────────────────────

describe('TEST-160 — Keyboard navigation on search page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Tab navigates through all search form elements', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    const fromInput = screen.getByLabelText(/search\.from/i);
    const toInput = screen.getByLabelText(/search\.to/i);
    const filterBtn = screen.getByLabelText('Filters');
    const searchBtn = screen.getByRole('button', { name: /search/i });

    fromInput.focus();
    expect(document.activeElement).toBe(fromInput);

    await user.tab();
    expect(document.activeElement).toBe(toInput);

    await user.tab();
    expect(document.activeElement).toBe(filterBtn);

    await user.tab();
    expect(document.activeElement).toBe(searchBtn);
  });

  test('Enter on Search button triggers API call', async () => {
    api.get = jest.fn().mockResolvedValue({ data: { data: [], facetCounts: null } });
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/search\.from/i), 'Mumbai');
    await user.type(screen.getByLabelText(/search\.to/i), 'Pune');

    const searchBtn = screen.getByRole('button', { name: /search/i });
    searchBtn.focus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/routes/search', expect.objectContaining({
        params: expect.objectContaining({ source: 'Mumbai', destination: 'Pune' }),
      }));
    });
  });

  test('Escape key closes the filter popup', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    const filterBtn = screen.getByLabelText('Filters');
    await user.click(filterBtn);

    const popup = document.querySelector('.search-filters-popup');
    expect(popup).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(document.querySelector('.search-filters-popup')).not.toBeInTheDocument();
  });

  test('result cards have tabIndex for keyboard navigation', async () => {
    api.get = jest.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            source: 'Mumbai',
            destination: 'Pune',
            departureTime: new Date(Date.now() + 86400000).toISOString(),
            fare: 500,
            capacity: 4,
            driverName: 'Driver A',
            vehicleType: 'SUV',
            agencyName: 'Agency X',
            exclusivelyBooked: false,
            bookedByMe: false,
          },
        ],
        facetCounts: { vehicleType: { SUV: 1 } },
      },
    });
    const user = userEvent.setup();
    renderSearchPage();

    await user.type(screen.getByLabelText(/search\.from/i), 'Mumbai');
    await user.type(screen.getByLabelText(/search\.to/i), 'Pune');

    await waitFor(() => {
      expect(screen.getByText(/Driver A/)).toBeInTheDocument();
    }, { timeout: 5000 });

    const cards = document.querySelectorAll('.search-result-card');
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach(card => {
      expect(card.getAttribute('tabindex')).toBe('0');
    });
  });
});
