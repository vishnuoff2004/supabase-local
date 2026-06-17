const { Driver, User, Route, Booking, BookingStatusHistory, sequelize } = require('../../src/models');

const mockDriver = {
  id: 10,
  userId: 1,
  name: 'Test Driver',
  phone: '1234567890',
  vehicleType: 'SUV',
  vehicleReg: 'ABC123',
  licenseNo: 'DL12345',
  available: true,
  agencyId: null,
  save: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(true),
};

const mockRoute = {
  id: 100,
  driverId: 10,
  source: 'Mumbai',
  destination: 'Pune',
  departureTime: new Date(Date.now() + 86400000).toISOString(),
  arrivalTime: new Date(Date.now() + 90000000).toISOString(),
  fare: 500,
  capacity: 10,
  available: true,
  status: 'active',
  save: jest.fn().mockResolvedValue(true),
};

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
    Driver: { findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
    User: { findByPk: jest.fn() },
    Route: { findOne: jest.fn(), create: jest.fn() },
    Booking: { findOne: jest.fn(), findByPk: jest.fn(), count: jest.fn(), findAll: jest.fn() },
    BookingStatusHistory: { create: jest.fn() },
    Sequelize: mockSequelize,
    sequelize: { transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() })) },
  };
});

const driverService = require('../../src/services/driverService');

describe('driverService.createProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(null);
    Driver.create.mockResolvedValue(mockDriver);
  });

  test('should create driver profile', async () => {
    const result = await driverService.createProfile(1, {
      name: 'Test Driver',
      phone: '1234567890',
      vehicleType: 'SUV',
      vehicleReg: 'ABC123',
    });

    expect(Driver.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, vehicleReg: 'ABC123' })
    );
    expect(result.id).toBe(10);
  });

  test('should throw 409 if profile already exists', async () => {
    Driver.findOne.mockResolvedValue(mockDriver);

    await expect(
      driverService.createProfile(1, { vehicleReg: 'XYZ789' })
    ).rejects.toThrow('Driver profile already exists');
  });

  test('should throw 409 if vehicle registration already exists', async () => {
    Driver.findOne
      .mockResolvedValueOnce(null) // no existing profile
      .mockResolvedValueOnce(mockDriver); // existing reg found

    await expect(
      driverService.createProfile(1, { vehicleReg: 'ABC123' })
    ).rejects.toThrow('Vehicle registration number already exists');
  });
});

describe('driverService.updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(mockDriver);
  });

  test('should update driver profile with allowed fields', async () => {
    await driverService.updateProfile(1, { name: 'Updated Name', phone: '9999999999' });

    expect(mockDriver.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Name', phone: '9999999999' })
    );
  });

  test('should throw 404 if driver not found', async () => {
    Driver.findOne.mockResolvedValue(null);

    await expect(
      driverService.updateProfile(1, { name: 'New Name' })
    ).rejects.toThrow('Driver profile not found');
  });

  test('should not update non-allowed fields', async () => {
    await driverService.updateProfile(1, { name: 'Updated', available: false });

    expect(mockDriver.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ available: false })
    );
  });
});

describe('driverService.createRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(mockDriver);
    Route.create.mockResolvedValue(mockRoute);
  });

  test('should create route with valid data', async () => {
    const result = await driverService.createRoute(1, {
      source: 'Mumbai',
      destination: 'Pune',
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      fare: 500,
      capacity: 4,
    });

    expect(Route.create).toHaveBeenCalled();
    expect(result.id).toBe(100);
  });

  test('should auto-create driver profile if missing', async () => {
    Driver.findOne.mockResolvedValue(null);
    User.findByPk.mockResolvedValue({ id: 1, name: 'Test User', phone: '1234567890' });

    await driverService.createRoute(1, {
      source: 'Mumbai',
      destination: 'Pune',
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      fare: 500,
      capacity: 4,
    });

    expect(Driver.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1 })
    );
  });

  test('should throw 400 if source equals destination', async () => {
    await expect(
      driverService.createRoute(1, {
        source: 'Mumbai',
        destination: 'Mumbai',
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        arrivalTime: new Date(Date.now() + 90000000).toISOString(),
        fare: 500,
        capacity: 4,
      })
    ).rejects.toThrow('Source and destination cannot be the same');
  });

  test('should throw 400 if departure time is in the past', async () => {
    await expect(
      driverService.createRoute(1, {
        source: 'Mumbai',
        destination: 'Pune',
        departureTime: new Date(Date.now() - 86400000).toISOString(),
        arrivalTime: new Date(Date.now() + 90000000).toISOString(),
        fare: 500,
        capacity: 4,
      })
    ).rejects.toThrow('Departure time cannot be in the past');
  });

  test('should throw 400 if arrival is before departure', async () => {
    await expect(
      driverService.createRoute(1, {
        source: 'Mumbai',
        destination: 'Pune',
        departureTime: new Date(Date.now() + 90000000).toISOString(),
        arrivalTime: new Date(Date.now() + 86400000).toISOString(),
        fare: 500,
        capacity: 4,
      })
    ).rejects.toThrow('Arrival time must be after departure time');
  });

  test('should throw 400 if capacity out of range', async () => {
    await expect(
      driverService.createRoute(1, {
        source: 'Mumbai',
        destination: 'Pune',
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        arrivalTime: new Date(Date.now() + 90000000).toISOString(),
        fare: 500,
        capacity: 0,
      })
    ).rejects.toThrow('Capacity must be between 1 and 60');
  });

  test('should throw 400 if fare is not positive', async () => {
    await expect(
      driverService.createRoute(1, {
        source: 'Mumbai',
        destination: 'Pune',
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        arrivalTime: new Date(Date.now() + 90000000).toISOString(),
        fare: 0,
        capacity: 4,
      })
    ).rejects.toThrow('Fare must be greater than 0');
  });
});

describe('driverService.acceptBooking', () => {
  const mockBooking = {
    id: 200,
    driverId: 10,
    userId: 5,
    routeId: 100,
    seatCount: 2,
    status: 'Pending',
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(mockDriver);
    Booking.findByPk.mockResolvedValue(mockBooking);
    mockBooking.status = 'Pending';
  });

  test('should accept a pending booking', async () => {
    const result = await driverService.acceptBooking(1, 200);

    expect(result.status).toBe('Confirmed');
    expect(BookingStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 200, toStatus: 'Confirmed' })
    );
  });

  test('should throw 403 if booking not assigned to driver', async () => {
    Booking.findByPk.mockResolvedValue({ ...mockBooking, driverId: 99 });

    await expect(
      driverService.acceptBooking(1, 200)
    ).rejects.toThrow('This booking is not assigned to you');
  });

  test('should throw 400 if booking is not pending', async () => {
    mockBooking.status = 'Cancelled';

    await expect(
      driverService.acceptBooking(1, 200)
    ).rejects.toThrow('Cannot accept booking with status Cancelled');
  });
});

describe('driverService.updateTripStatus', () => {
  const mockBooking = {
    id: 200,
    driverId: 10,
    userId: 5,
    routeId: 100,
    seatCount: 2,
    status: 'Confirmed',
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(mockDriver);
    Booking.findByPk.mockResolvedValue(mockBooking);
    Booking.findOne.mockResolvedValue(null);
    mockBooking.status = 'Confirmed';
    sequelize.transaction.mockResolvedValue({
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    });
  });

  test('should transition from Confirmed to On Trip', async () => {
    mockBooking.save.mockResolvedValue(true);
    mockDriver.save.mockResolvedValue(true);
    const t = await sequelize.transaction();

    const result = await driverService.updateTripStatus(1, 200, 'On Trip');

    expect(result.status).toBe('On Trip');
    expect(mockDriver.available).toBe(false);
    expect(t.commit).toHaveBeenCalled();
  });

  test('should throw 409 if driver already has an active trip', async () => {
    Booking.findOne.mockResolvedValue({ id: 201, status: 'On Trip' });

    await expect(
      driverService.updateTripStatus(1, 200, 'On Trip')
    ).rejects.toThrow('You already have an active trip in progress');
  });

  test('should throw 400 for invalid transition', async () => {
    await expect(
      driverService.updateTripStatus(1, 200, 'Cancelled')
    ).rejects.toThrow('Cannot transition to Cancelled from Confirmed');
  });
});

describe('driverService.setOverallAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(mockDriver);
  });

  test('should toggle driver availability', async () => {
    const result = await driverService.setOverallAvailability(1, false);

    expect(mockDriver.available).toBe(false);
    expect(mockDriver.save).toHaveBeenCalled();
  });

  test('should throw 404 if driver not found', async () => {
    Driver.findOne.mockResolvedValue(null);

    await expect(
      driverService.setOverallAvailability(1, true)
    ).rejects.toThrow('Driver profile not found');
  });
});
