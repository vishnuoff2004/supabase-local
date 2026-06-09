import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../contexts/AuthContext';
import UserManagementPage from '../pages/admin/UserManagementPage';

jest.mock('../services/api');
jest.mock('../services/adminService');

const mockUsers = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'traveler', active: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'driver', active: false },
];

function renderWithAuth() {
  localStorage.setItem('token', 'mock-token');
  return render(
    <AuthProvider>
      <UserManagementPage />
    </AuthProvider>
  );
}

describe('UserManagementPage — REQ-045, REQ-046, REQ-047', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('TEST-164: displays loading skeleton on mount', () => {
    const adminService = require('../services/adminService');
    adminService.getUsers.mockImplementation(() => new Promise(() => {}));
    renderWithAuth();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-list-item')).toBeInTheDocument();
  });

  test('TEST-165: renders users from API response via adminService', async () => {
    const adminService = require('../services/adminService');
    adminService.getUsers.mockResolvedValue(mockUsers);
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  test('TEST-166: renders error state when adminService fails', async () => {
    const adminService = require('../services/adminService');
    adminService.getUsers.mockRejectedValue(new Error('Network error'));
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });

  test('TEST-167: shows empty state when no users', async () => {
    const adminService = require('../services/adminService');
    adminService.getUsers.mockResolvedValue([]);
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
    });
  });

  test('TEST-168: calls toggleUserStatus on button click', async () => {
    const adminService = require('../services/adminService');
    adminService.getUsers.mockResolvedValue(mockUsers);
    adminService.toggleUserStatus.mockResolvedValue({});
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    const buttons = screen.getAllByText('Deactivate');
    await userEvent.click(buttons[0]);
    await waitFor(() => {
      expect(adminService.toggleUserStatus).toHaveBeenCalledWith(1);
    });
  });

  test('TEST-169: shows error when toggleUserStatus fails', async () => {
    const adminService = require('../services/adminService');
    adminService.getUsers.mockResolvedValue(mockUsers);
    adminService.toggleUserStatus.mockRejectedValue({ response: { data: { message: 'Toggle failed' } } });
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    const buttons = screen.getAllByText('Deactivate');
    await userEvent.click(buttons[0]);
    await waitFor(() => {
      expect(screen.getByText(/Toggle failed/i)).toBeInTheDocument();
    });
  });

  test('TEST-170: renders pagination when totalPages > 1', async () => {
    const adminService = require('../services/adminService');
    adminService.getUsers.mockResolvedValue({
      data: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, name: `User${i + 1}`, email: `user${i + 1}@test.com`, role: 'traveler', active: true
      })),
      totalPages: 3, page: 1, total: 25
    });
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByText('User1')).toBeInTheDocument();
    });
    expect(document.querySelector('.pagination')).toBeInTheDocument();
  });
});
