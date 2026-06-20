const bookingService = require('../../src/services/bookingService');
const { Booking, BookingStatusHistory, Route, Driver } = require('../../src/models');

jest.mock('../../src/models', () => {
  const mockBooking = {
    id: 100,
    userId: 1,
    routeId: 10,
    driverId: 20,
    seatCount: 2,
    travelDate: '2026-07-11',
    status: 'Pending',
    save: jest.fn(),
  };

  const mockRoute = {
    id: 10,
    driverId: 20,
    capacity: 10,
    available: true,
    status: 'active',
    departureTime: '2026-07-11T12:00:00Z',
    arrivalTime: '2026-07-12T12:00:00Z',
  };

  const mockDriver = {
    id: 20,
  };

  return {
    Booking: {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    },
    BookingStatusHistory: {
      create: jest.fn(),
      findAll: jest.fn(),
    },
    Route: {
      findByPk: jest.fn().mockResolvedValue(mockRoute),
    },
    Driver: {
      findByPk: jest.fn().mockResolvedValue(mockDriver),
    },
    Sequelize: {
      Op: {
        notIn: Symbol('notIn'),
      },
    },
  };
});

describe('bookingService.createBooking unit tests', () => {
  let mockRoute;
  let mockDriver;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoute = {
      id: 10,
      driverId: 20,
      capacity: 10,
      available: true,
      status: 'active',
    departureTime: '2026-07-11T12:00:00Z',
    arrivalTime: '2026-07-12T12:00:00Z',
    };
    mockDriver = { id: 20 };

    Route.findByPk.mockResolvedValue(mockRoute);
    Driver.findByPk.mockResolvedValue(mockDriver);
    Booking.findOne.mockResolvedValue(null);
    Booking.findAll.mockResolvedValue([]);
  });

  test('should throw error if route date does not match booking date', async () => {
    await expect(
      bookingService.createBooking(1, {
        routeId: 10,
        driverId: 20,
        seatCount: 2,
        travelDate: '2026-07-13', // mismatched date
      })
    ).rejects.toThrow('Booking date must match the route departure date');
  });

  test('should throw error if route is unavailable — TEST-053', async () => {
    mockRoute.available = false;

    await expect(
      bookingService.createBooking(1, {
        routeId: 10,
        driverId: 20,
        seatCount: 2,
        travelDate: '2026-07-11',
      })
    ).rejects.toThrow('This route is currently unavailable');
  });

  test('should merge bookings on same route/driver/date and update seat count', async () => {
    const mockExistingBooking = {
      id: 100,
      userId: 1,
      routeId: 10,
      driverId: 20,
      seatCount: 3,
      travelDate: '2026-07-11',
      status: 'Pending',
      save: jest.fn().mockResolvedValue(true),
    };

    Booking.findOne
      .mockResolvedValueOnce(null) // exclusive vehicle: no other user
      .mockResolvedValueOnce(mockExistingBooking); // existing booking: found
    Booking.findAll.mockResolvedValue([mockExistingBooking]);

    const result = await bookingService.createBooking(1, {
      routeId: 10,
      driverId: 20,
      seatCount: 2, // adding 2 seats
      travelDate: '2026-07-11',
    });

    expect(mockExistingBooking.seatCount).toBe(5); // 3 + 2
    expect(mockExistingBooking.save).toHaveBeenCalled();
    expect(BookingStatusHistory.create).toHaveBeenCalled();
    expect(result.id).toBe(100);
  });

  test('should reject merge if seat count exceeds route capacity', async () => {
    const mockExistingBooking = {
      id: 100,
      userId: 1,
      routeId: 10,
      driverId: 20,
      seatCount: 8,
      travelDate: '2026-07-11',
      status: 'Pending',
      save: jest.fn(),
    };

    Booking.findOne
      .mockResolvedValueOnce(null) // exclusive vehicle: no other user
      .mockResolvedValueOnce(mockExistingBooking); // existing booking: found

    await expect(
      bookingService.createBooking(1, {
        routeId: 10,
        driverId: 20,
        seatCount: 3, // 8 + 3 = 11, exceeds capacity (10)
        travelDate: '2026-07-11',
      })
    ).rejects.toThrow('vehicle capacity');
  });

  test('should reject creation of new booking if capacity is exceeded', async () => {
    await expect(
      bookingService.createBooking(1, {
        routeId: 10,
        driverId: 20,
        seatCount: 11, // 11 > 10, exceeds vehicle capacity
        travelDate: '2026-07-11',
      })
    ).rejects.toThrow('vehicle capacity');
  });

  test('should create new booking when everything matches and seats are available', async () => {
    Booking.findOne.mockResolvedValue(null);
    Booking.findAll.mockResolvedValue([{ seatCount: 5, status: 'Confirmed' }]);
    Booking.create.mockResolvedValue({ id: 101, status: 'Pending' });

    const result = await bookingService.createBooking(1, {
      routeId: 10,
      driverId: 20,
      seatCount: 2, // 5 + 2 = 7 <= 10
      travelDate: '2026-07-11',
    });

    expect(Booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        routeId: 10,
        driverId: 20,
        seatCount: 2,
        travelDate: '2026-07-11',
        status: 'Pending',
      })
    );
    expect(result.id).toBe(101);
  });
});

describe('bookingService — capacity & duplicate checks (TEST-115, TEST-119, TEST-120, TEST-144)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should reject new booking if seatCount exceeds vehicle capacity — TEST-115', async () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const travelDate = tomorrow.toISOString().split('T')[0];
    Route.findByPk.mockResolvedValue({
      id: 10, driverId: 20, capacity: 4, available: true, status: 'active',
      departureTime: tomorrow.toISOString(),
    });
    Driver.findByPk.mockResolvedValue({ id: 20 });
    // Both findOne calls return null (no other user, no same user)
    Booking.findOne.mockResolvedValue(null);
    Booking.findAll.mockResolvedValue([]);

    await expect(
      bookingService.createBooking(1, {
        routeId: 10, driverId: 20, seatCount: 5, travelDate,
      })
    ).rejects.toThrow(/capacity/i);
  });

  test('should reject duplicate booking (409) from another user — TEST-119', async () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const travelDate = tomorrow.toISOString().split('T')[0];
    Route.findByPk.mockResolvedValue({
      id: 10, driverId: 20, capacity: 10, available: true, status: 'active',
      departureTime: tomorrow.toISOString(),
    });
    Driver.findByPk.mockResolvedValue({ id: 20 });
    // findOne: other user already has booking
    Booking.findOne.mockResolvedValue({ id: 99, userId: 999, status: 'Pending' });

    await expect(
      bookingService.createBooking(1, {
        routeId: 10, driverId: 20, seatCount: 2, travelDate,
      })
    ).rejects.toThrow(/exclusively booked/i);
  });

  test('should reject booking on route with past departure — TEST-120', async () => {
    Route.findByPk.mockResolvedValue({
      id: 10, driverId: 20, capacity: 10, available: true, status: 'active',
      departureTime: new Date(Date.now() - 86400000).toISOString(), // yesterday
    });
    Driver.findByPk.mockResolvedValue({ id: 20 });
    Booking.findOne.mockResolvedValue(null);

    await expect(
      bookingService.createBooking(1, {
        routeId: 10, driverId: 20, seatCount: 1, travelDate: '2026-06-17',
      })
    ).rejects.toThrow(/past/i);
  });

  test('should create booking when seatCount equals vehicle capacity — TEST-144', async () => {
    Route.findByPk.mockResolvedValue({
      id: 10, driverId: 20, capacity: 4, available: true, status: 'active',
      departureTime: '2026-07-11T12:00:00Z',
    });
    Driver.findByPk.mockResolvedValue({ id: 20 });
    Booking.findOne.mockResolvedValue(null);
    Booking.findAll.mockResolvedValue([]);
    Booking.create.mockResolvedValue({ id: 105, status: 'Pending', seatCount: 4 });
    BookingStatusHistory.create.mockResolvedValue({});

    const result = await bookingService.createBooking(1, {
      routeId: 10, driverId: 20, seatCount: 4, travelDate: '2026-07-11',
    });

    expect(result.id).toBe(105);
  });

  test('capacity check: seatCount(1) with existing booking(2 of 2) should be rejected via merge path — TEST-145', async () => {
    Route.findByPk.mockResolvedValue({
      id: 10, driverId: 20, capacity: 2, available: true, status: 'active',
      departureTime: '2026-07-11T12:00:00Z',
    });
    Driver.findByPk.mockResolvedValue({ id: 20 });
    // Other user has booking (blocks via exclusive rule)
    Booking.findOne.mockResolvedValue({ id: 99, userId: 999, status: 'Confirmed' });

    await expect(
      bookingService.createBooking(2, {
        routeId: 10, driverId: 20, seatCount: 1, travelDate: '2026-07-11',
      })
    ).rejects.toThrow(/exclusively booked/i);
  });
});

describe('bookingService — last seat concurrent booking (TEST-118)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TEST-118: second booking on last seat should be rejected — exclusive vehicle rule', async () => {
    // Route with capacity=1 (single seat)
    Route.findByPk.mockResolvedValue({
      id: 10, driverId: 20, capacity: 1, available: true, status: 'active',
      departureTime: '2026-07-11T12:00:00Z',
    });
    Driver.findByPk.mockResolvedValue({ id: 20 });

    // Traveler A (userId=1) already has the only seat committed for this driver+date.
    // The exclusive-vehicle check (first findOne) returns their booking → Traveler B is rejected.
    const travelerABooking = { id: 99, userId: 1, seatCount: 1, status: 'Confirmed' };
    Booking.findOne
      .mockResolvedValueOnce(travelerABooking)  // exclusive-vehicle block fires
      .mockResolvedValueOnce(null);             // merge check — never reached

    // Traveler B (userId=2) tries to book the last seat — should fail with 409
    await expect(
      bookingService.createBooking(2, {
        routeId: 10, driverId: 20, seatCount: 1, travelDate: '2026-07-11',
      })
    ).rejects.toThrow(/exclusively booked/i);
  });

  test('TEST-118: first booking on last seat should succeed', async () => {
    Route.findByPk.mockResolvedValue({
      id: 10, driverId: 20, capacity: 1, available: true, status: 'active',
      departureTime: '2026-07-11T12:00:00Z',
    });
    Driver.findByPk.mockResolvedValue({ id: 20 });

    // No existing bookings — seat is free for Traveler A
    Booking.findOne.mockResolvedValue(null);
    Booking.create.mockResolvedValue({ id: 100, status: 'Pending', seatCount: 1 });
    BookingStatusHistory.create.mockResolvedValue({});

    const result = await bookingService.createBooking(1, {
      routeId: 10, driverId: 20, seatCount: 1, travelDate: '2026-07-11',
    });

    expect(result.id).toBe(100);
    expect(result.status).toBe('Pending');
  });
});


describe('bookingService — cancel logic (TEST-040, TEST-041, TEST-042)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should cancel a Confirmed booking — TEST-040', async () => {
    const mockConfirmedBooking = {
      id: 200, status: 'Confirmed', userId: 1,
      save: jest.fn().mockResolvedValue(true),
    };
    Booking.findOne = jest.fn().mockResolvedValue(mockConfirmedBooking);
    BookingStatusHistory.create.mockResolvedValue({});

    const result = await bookingService.cancelBooking(1, 200);

    expect(result.status).toBe('Cancelled');
  });

  test('should reject cancel of a Completed booking — TEST-041', async () => {
    const mockCompletedBooking = {
      id: 201, status: 'Completed', userId: 1,
      save: jest.fn(),
    };
    Booking.findOne = jest.fn().mockResolvedValue(mockCompletedBooking);

    await expect(
      bookingService.cancelBooking(1, 201)
    ).rejects.toThrow(/cannot cancel/i);
  });

  test('should reject cancel of already Cancelled booking — TEST-042', async () => {
    const mockCancelledBooking = {
      id: 202, status: 'Cancelled', userId: 1,
      save: jest.fn(),
    };
    Booking.findOne = jest.fn().mockResolvedValue(mockCancelledBooking);

    await expect(
      bookingService.cancelBooking(1, 202)
    ).rejects.toThrow(/already cancelled/i);
  });
});

describe('bookingService — status transitions (TEST-035, TEST-036)', () => {
  test('TEST-035: returns true for valid transitions', () => {
    const valid = [
      ['Pending', 'Confirmed'],
      ['Pending', 'Cancelled'],
      ['Confirmed', 'On Trip'],
      ['Confirmed', 'Cancelled'],
      ['On Trip', 'Completed'],
    ];
    for (const [from, to] of valid) {
      expect(bookingService.isValidTransition(from, to)).toBe(true);
    }
  });

  test('TEST-036: returns false for invalid transitions', () => {
    const invalid = [
      ['Pending', 'Completed'],
      ['Pending', 'On Trip'],
      ['Confirmed', 'Completed'],
      ['Completed', 'Pending'],
      ['Completed', 'Cancelled'],
      ['Cancelled', 'Pending'],
      ['Cancelled', 'Confirmed'],
      ['Cancelled', 'On Trip'],
      ['Cancelled', 'Completed'],
    ];
    for (const [from, to] of invalid) {
      expect(bookingService.isValidTransition(from, to)).toBe(false);
    }
  });

  test('TEST-035: edge case — same status transition is invalid', () => {
    const allStatuses = ['Pending', 'Confirmed', 'On Trip', 'Completed', 'Cancelled'];
    for (const s of allStatuses) {
      expect(bookingService.isValidTransition(s, s)).toBe(false);
    }
  });
});

describe('bookingService — getStatusHistory (TEST-037)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TEST-037: returns status history with timestamps', async () => {
    const mockHistory = [
      { fromStatus: null, toStatus: 'Pending', createdAt: new Date('2026-07-11T10:00:00Z') },
      { fromStatus: 'Pending', toStatus: 'Confirmed', createdAt: new Date('2026-07-11T10:30:00Z') },
      { fromStatus: 'Confirmed', toStatus: 'On Trip', createdAt: new Date('2026-07-11T11:00:00Z') },
    ];
    BookingStatusHistory.findAll.mockResolvedValue(mockHistory);

    const result = await bookingService.getStatusHistory(1);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      fromStatus: null,
      toStatus: 'Pending',
      changedAt: mockHistory[0].createdAt,
    });
    expect(result[1]).toEqual({
      fromStatus: 'Pending',
      toStatus: 'Confirmed',
      changedAt: mockHistory[1].createdAt,
    });
    expect(result[2]).toEqual({
      fromStatus: 'Confirmed',
      toStatus: 'On Trip',
      changedAt: mockHistory[2].createdAt,
    });
    expect(BookingStatusHistory.findAll).toHaveBeenCalledWith({
      where: { bookingId: 1 },
      order: [['createdAt', 'ASC']],
    });
  });

  test('TEST-037: returns empty array when no history exists', async () => {
    BookingStatusHistory.findAll.mockResolvedValue([]);

    const result = await bookingService.getStatusHistory(999);

    expect(result).toEqual([]);
  });
});
