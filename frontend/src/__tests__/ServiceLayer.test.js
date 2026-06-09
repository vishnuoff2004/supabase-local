import api from '../services/api';

jest.mock('../services/api');

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Service Layer — REQ-054', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  test('TEST-194: adminService.getUsers returns user list', async () => {
    const mockUsers = [{ id: 1, name: 'Admin', email: 'admin@test.com' }];
    api.get.mockResolvedValue({ data: mockUsers });
    const { getUsers } = require('../services/adminService');
    const result = await getUsers();
    expect(result).toEqual(mockUsers);
    expect(api.get).toHaveBeenCalledWith('/admin/users');
  });

  test('TEST-195: adminService.toggleUserStatus sends PUT request', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    const { toggleUserStatus } = require('../services/adminService');
    await toggleUserStatus(1);
    expect(api.put).toHaveBeenCalledWith('/admin/users/1/deactivate');
  });

  test('TEST-196: bookingService.getBookings returns paginated bookings', async () => {
    const mockResponse = { data: [{ id: 1 }], totalPages: 1, page: 1 };
    api.get.mockResolvedValue({ data: mockResponse });
    const { getBookings } = require('../services/bookingService');
    const result = await getBookings(1, 10);
    expect(result).toEqual(mockResponse);
    expect(api.get).toHaveBeenCalledWith('/bookings', { params: { page: 1, limit: 10 } });
  });

  test('TEST-199: service functions reject when API fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    const { getUsers } = require('../services/adminService');
    await expect(getUsers()).rejects.toThrow('Network error');
  });
});
