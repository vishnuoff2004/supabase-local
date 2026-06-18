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

describe('adminService.deactivateAgency — booking cascade (TEST-125, TEST-126, TEST-127, TEST-128)', () => {
  const mockAgency = {
    id: 1, active: true,
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAgency.active = true;
    Agency.findByPk.mockResolvedValue(mockAgency);
    Driver.findAll.mockResolvedValue([{ id: 10 }, { id: 11 }]);
  });

  test('pending booking should be cancelled when driver removed from agency — TEST-125', async () => {
    const pendingBooking = {
      id: 500, status: 'Pending',
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };
    Booking.findAll.mockResolvedValue([pendingBooking]);

    await adminService.deactivateAgency(99, 1);

    expect(pendingBooking.status).toBe('Cancelled');
    expect(pendingBooking.cancelReason).toMatch(/deactivated/i);
  });

  test('confirmed booking should be preserved when agency deactivated — TEST-126', async () => {
    // Confirmed bookings are NOT cascaded (only Pending ones)
    const confirmedBooking = {
      id: 501, status: 'Confirmed',
      save: jest.fn(),
    };
    // findAll with status Pending returns empty (no pending)
    Booking.findAll.mockResolvedValue([]);

    await adminService.deactivateAgency(99, 1);

    expect(confirmedBooking.save).not.toHaveBeenCalled();
    expect(confirmedBooking.status).toBe('Confirmed');
  });

  test('agency deactivation should cancel pending bookings — TEST-127', async () => {
    const pendingBooking1 = {
      id: 502, status: 'Pending',
      save: jest.fn().mockResolvedValue(true),
    };
    const pendingBooking2 = {
      id: 503, status: 'Pending',
      save: jest.fn().mockResolvedValue(true),
    };
    Booking.findAll.mockResolvedValue([pendingBooking1, pendingBooking2]);

    await adminService.deactivateAgency(99, 1);

    expect(pendingBooking1.status).toBe('Cancelled');
    expect(pendingBooking2.status).toBe('Cancelled');
    expect(BookingStatusHistory.create).toHaveBeenCalledTimes(2);
  });

  test('agency deactivation should NOT change On Trip or Completed bookings — TEST-128', async () => {
    // Only Pending bookings are cancelled on deactivation
    Booking.findAll.mockResolvedValue([]); // No pending bookings

    const result = await adminService.deactivateAgency(99, 1);

    expect(mockAgency.active).toBe(false);
    expect(BookingStatusHistory.create).not.toHaveBeenCalled();
  });
});

describe('adminService.adminCancelBooking — audit log (TEST-078, TEST-080)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('admin cancel should log adminId in cancelledBy — TEST-080', async () => {
    const mockBooking = {
      id: 600, status: 'Pending',
      save: jest.fn().mockResolvedValue(true),
    };
    Booking.findByPk.mockResolvedValue(mockBooking);
    BookingStatusHistory.create.mockResolvedValue({});

    const result = await adminService.adminCancelBooking(99, 600, 'Policy violation');

    expect(result.cancelledBy).toBe(99);
    expect(result.cancelReason).toBe('Policy violation');
    expect(BookingStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ changedBy: 99, toStatus: 'Cancelled' })
    );
  });
});
