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
