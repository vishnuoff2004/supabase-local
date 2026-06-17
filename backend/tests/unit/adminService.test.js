const { User, Agency, Driver, Booking, BookingStatusHistory } = require('../../src/models');

jest.mock('../../src/models', () => {
  const mockSequelize = {
    Op: {
      gte: Symbol('gte'),
      lte: Symbol('lte'),
      like: Symbol('like'),
      in: Symbol('in'),
      ne: Symbol('ne'),
      notIn: Symbol('notIn'),
    },
  };
  return {
    User: { findAll: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(), count: jest.fn() },
    Agency: { findAll: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn(), count: jest.fn() },
    Driver: { findAll: jest.fn() },
    Booking: { findAll: jest.fn(), findAndCountAll: jest.fn(), findByPk: jest.fn(), count: jest.fn() },
    BookingStatusHistory: { create: jest.fn() },
    Route: {},
    Sequelize: mockSequelize,
  };
});

jest.mock('../../src/config/algolia', () => ({
  getAlgoliaClient: jest.fn(() => null),
}));

const adminService = require('../../src/services/adminService');

describe('adminService.getUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return paginated users', async () => {
    const mockUsers = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    User.findAndCountAll.mockResolvedValue({ rows: mockUsers, count: 2 });

    const result = await adminService.getUsers(1, 10, '');

    expect(result.data).toHaveLength(2);
    expect(result.totalPages).toBe(1);
  });

  test('should apply search filter', async () => {
    User.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await adminService.getUsers(1, 10, 'Alice');

    const callArgs = User.findAndCountAll.mock.calls[0][0];
    expect(callArgs.where).toBeDefined();
  });
});

describe('adminService.toggleUserStatus', () => {
  const mockUser = {
    id: 1,
    active: true,
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    User.findByPk.mockResolvedValue(mockUser);
  });

  test('should toggle user active status', async () => {
    const result = await adminService.toggleUserStatus(99, 1);

    expect(mockUser.active).toBe(false);
    expect(mockUser.save).toHaveBeenCalled();
  });

  test('should throw 404 if user not found', async () => {
    User.findByPk.mockResolvedValue(null);

    await expect(
      adminService.toggleUserStatus(99, 999)
    ).rejects.toThrow('User not found');
  });
});

describe('adminService.createAgency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Agency.create.mockResolvedValue({ id: 1, name: 'New Agency' });
  });

  test('should create agency', async () => {
    const result = await adminService.createAgency(1, {
      name: 'New Agency',
      email: 'agency@example.com',
      phone: '1234567890',
    });

    expect(Agency.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Agency', createdBy: 1 })
    );
    expect(result.name).toBe('New Agency');
  });
});

describe('adminService.deactivateAgency', () => {
  const mockAgency = {
    id: 1,
    active: true,
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAgency.active = true; // reset shared mutable state
    Agency.findByPk.mockResolvedValue(mockAgency);
    Driver.findAll.mockResolvedValue([]);
    Booking.findAll.mockResolvedValue([]);
  });

  test('should toggle agency active status', async () => {
    const result = await adminService.deactivateAgency(99, 1);

    expect(mockAgency.active).toBe(false);
    expect(mockAgency.save).toHaveBeenCalled();
  });

  test('should cancel pending bookings when deactivating', async () => {
    const mockBooking = {
      id: 100,
      status: 'Pending',
      save: jest.fn().mockImplementation(function() {
        this.status = 'Cancelled';
        this.cancelReason = 'Agency deactivated';
        return Promise.resolve(this);
      }),
    };
    Driver.findAll.mockResolvedValue([{ id: 10 }, { id: 11 }]);
    Booking.findAll.mockResolvedValue([mockBooking]);

    await adminService.deactivateAgency(99, 1);

    expect(mockBooking.status).toBe('Cancelled');
    expect(mockBooking.cancelReason).toBe('Agency deactivated');
    expect(BookingStatusHistory.create).toHaveBeenCalled();
  });

  test('should throw 404 if agency not found', async () => {
    Agency.findByPk.mockResolvedValue(null);

    await expect(
      adminService.deactivateAgency(99, 999)
    ).rejects.toThrow('Agency not found');
  });
});

describe('adminService.adminCancelBooking', () => {
  const mockBooking = {
    id: 100,
    status: 'Confirmed',
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Booking.findByPk.mockResolvedValue(mockBooking);
  });

  test('should cancel any booking', async () => {
    const result = await adminService.adminCancelBooking(99, 100, 'Violation');

    expect(result.status).toBe('Cancelled');
    expect(result.cancelReason).toBe('Violation');
    expect(result.cancelledBy).toBe(99);
    expect(BookingStatusHistory.create).toHaveBeenCalled();
  });

  test('should throw 404 if booking not found', async () => {
    Booking.findByPk.mockResolvedValue(null);

    await expect(
      adminService.adminCancelBooking(99, 999, 'Reason')
    ).rejects.toThrow('Booking not found');
  });
});

describe('adminService.getDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.count.mockResolvedValue(100);
    Agency.count.mockResolvedValue(5);
    Booking.count.mockResolvedValue(42);
    Booking.count
      .mockResolvedValueOnce(42) // totalActiveBookings
      .mockResolvedValueOnce(10) // Pending
      .mockResolvedValueOnce(15) // Confirmed
      .mockResolvedValueOnce(5)  // On Trip
      .mockResolvedValueOnce(8)  // Completed
      .mockResolvedValueOnce(4); // Cancelled
  });

  test('should return dashboard stats', async () => {
    const result = await adminService.getDashboardData();

    expect(result.totalUsers).toBe(100);
    expect(result.totalAgencies).toBe(5);
    expect(result.totalActiveBookings).toBe(42);
    expect(result.bookingsByStatus.Pending).toBe(10);
    expect(result.bookingsByStatus.Completed).toBe(8);
  });
});
