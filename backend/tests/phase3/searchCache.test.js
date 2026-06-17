const { Route, Driver, Agency, Booking } = require('../../src/models');

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
    Route: { findAll: jest.fn(), findByPk: jest.fn() },
    Driver: {},
    Agency: {},
    Booking: { findOne: jest.fn() },
    Sequelize: mockSequelize,
    sequelize: { transaction: jest.fn() },
  };
});

jest.mock('../../src/config/algolia', () => ({
  getAlgoliaClient: jest.fn(() => null),
}));

const searchService = require('../../src/services/searchService');

describe('Phase 3 — Search Service (REQ-049)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('searchRoutes returns empty array and message when no routes found', async () => {
    Route.findAll.mockResolvedValue([]);

    const result = await searchService.searchRoutes('Mumbai', 'Pune');

    expect(Route.findAll).toHaveBeenCalled();
    expect(result).toEqual({ data: [], message: 'No routes found for this destination', facetCounts: null });
  });

  test('searchRoutes applies source and destination filters', async () => {
    Route.findAll.mockResolvedValue([]);

    await searchService.searchRoutes('Delhi', 'Agra');

    const callArgs = Route.findAll.mock.calls[0][0];
    expect(callArgs.where.source).toBeDefined();
    expect(callArgs.where.destination).toBeDefined();
    expect(callArgs.where.available).toBe(true);
    expect(callArgs.where.status).toBe('active');
  });

  test('searchRoutes applies price range filters', async () => {
    Route.findAll.mockResolvedValue([]);

    await searchService.searchRoutes('Mumbai', 'Pune', null, {
      priceMin: '100',
      priceMax: '500',
    });

    const callArgs = Route.findAll.mock.calls[0][0];
    expect(callArgs.where.fare).toBeDefined();
  });

  test('searchRoutes applies vehicle type filter', async () => {
    Route.findAll.mockResolvedValue([]);

    await searchService.searchRoutes('Mumbai', 'Pune', null, {
      vehicleTypes: 'SUV,Sedan',
    });

    const callArgs = Route.findAll.mock.calls[0][0];
    const driverInclude = callArgs.include[0];
    expect(driverInclude.where.vehicleType).toBeDefined();
  });

  test('searchRoutes applies seat capacity filter', async () => {
    Route.findAll.mockResolvedValue([]);

    await searchService.searchRoutes('Mumbai', 'Pune', null, {
      seats: '4',
    });

    const callArgs = Route.findAll.mock.calls[0][0];
    expect(callArgs.where.capacity).toBeDefined();
  });

  test('searchRoutes checks exclusive booking for other users', async () => {
    const mockRoute = {
      id: 1,
      source: 'Mumbai',
      destination: 'Pune',
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      fare: 500,
      capacity: 4,
      available: true,
      Driver: {
        id: 10,
        name: 'Test Driver',
        vehicleType: 'SUV',
        Agency: { id: 1, name: 'Test Agency' },
      },
    };
    Route.findAll.mockResolvedValue([mockRoute]);
    Booking.findOne.mockResolvedValue({ id: 99, userId: 999 });

    const result = await searchService.searchRoutes('Mumbai', 'Pune', 1);

    expect(result.data[0].exclusivelyBooked).toBe(true);
    expect(Booking.findOne).toHaveBeenCalled();
  });

  test('searchRoutes returns routes with driver and agency details', async () => {
    const mockRoute = {
      id: 1,
      source: 'Mumbai',
      destination: 'Pune',
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      fare: 500,
      capacity: 4,
      available: true,
      Driver: {
        id: 10,
        name: 'Test Driver',
        vehicleType: 'SUV',
        Agency: { id: 1, name: 'Test Agency' },
      },
    };
    Route.findAll.mockResolvedValue([mockRoute]);
    Booking.findOne.mockResolvedValue(null);

    const result = await searchService.searchRoutes('Mumbai', 'Pune');

    expect(result.data).toHaveLength(1);
    expect(result.data[0].driverName).toBe('Test Driver');
    expect(result.data[0].agencyName).toBe('Test Agency');
    expect(result.data[0].vehicleType).toBe('SUV');
  });
});
