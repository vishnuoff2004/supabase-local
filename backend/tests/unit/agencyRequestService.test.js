const { Driver, Agency, DriverAgencyRequest } = require('../../src/models');

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
    Driver: { findOne: jest.fn() },
    Agency: { findOne: jest.fn(), findAll: jest.fn() },
    DriverAgencyRequest: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn(), update: jest.fn() },
    Sequelize: mockSequelize,
  };
});

const agencyRequestService = require('../../src/services/agencyRequestService');

const mockDriver = {
  id: 10,
  userId: 1,
  name: 'Test Driver',
  agencyId: null,
  save: jest.fn().mockResolvedValue(true),
  toJSON: function() { return { id: this.id, name: this.name }; },
};

const mockAgency = {
  id: 5,
  name: 'Test Agency',
  email: 'agency@test.com',
  phone: '1234567890',
  active: true,
};

const mockRequest = {
  id: 100,
  driverId: 10,
  agencyId: 5,
  status: 'Pending',
  createdAt: new Date(),
  save: jest.fn().mockResolvedValue(true),
};

describe('agencyRequestService.sendJoinRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(mockDriver);
    Agency.findOne.mockResolvedValue(mockAgency);
    DriverAgencyRequest.findOne.mockResolvedValue(null);
    DriverAgencyRequest.create.mockResolvedValue(mockRequest);
  });

  test('should create a join request', async () => {
    const result = await agencyRequestService.sendJoinRequest(1, 5);

    expect(DriverAgencyRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ driverId: 10, agencyId: 5, status: 'Pending' })
    );
    expect(result.status).toBe('Pending');
  });

  test('should throw 404 if driver has no profile', async () => {
    Driver.findOne.mockResolvedValue(null);

    await expect(
      agencyRequestService.sendJoinRequest(1, 5)
    ).rejects.toThrow('Driver profile not found');
  });

  test('should throw 409 if driver already in an agency', async () => {
    Driver.findOne.mockResolvedValue({ ...mockDriver, agencyId: 3 });

    await expect(
      agencyRequestService.sendJoinRequest(1, 5)
    ).rejects.toThrow('already part of an agency');
  });

  test('should throw 404 if agency inactive or not found', async () => {
    Agency.findOne.mockResolvedValue(null);

    await expect(
      agencyRequestService.sendJoinRequest(1, 5)
    ).rejects.toThrow('Agency not found or inactive');
  });

  test('should throw 409 if pending request already exists', async () => {
    DriverAgencyRequest.findOne.mockResolvedValue(mockRequest);

    await expect(
      agencyRequestService.sendJoinRequest(1, 5)
    ).rejects.toThrow('already have a pending request');
  });

  test('should cancel other pending requests before creating new one', async () => {
    await agencyRequestService.sendJoinRequest(1, 5);

    expect(DriverAgencyRequest.update).toHaveBeenCalledWith(
      { status: 'Denied' },
      expect.objectContaining({ where: { driverId: 10, status: 'Pending' } })
    );
  });
});

describe('agencyRequestService.respondToRequest', () => {
  const mockFetchedRequest = {
    id: 100,
    driverId: 10,
    agencyId: 5,
    status: 'Pending',
    save: jest.fn().mockResolvedValue(true),
    Driver: { id: 10, name: 'Test Driver', agencyId: null, save: jest.fn().mockResolvedValue(true) },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Agency.findOne.mockResolvedValue(mockAgency);
    DriverAgencyRequest.findOne.mockResolvedValue(mockFetchedRequest);
  });

  test('should accept request and assign driver to agency', async () => {
    const result = await agencyRequestService.respondToRequest(1, 100, 'accept');

    expect(mockFetchedRequest.status).toBe('Accepted');
    expect(mockFetchedRequest.Driver.agencyId).toBe(5);
    expect(mockFetchedRequest.Driver.save).toHaveBeenCalled();
    expect(result.message).toContain('added to your agency');
  });

  test('should deny request', async () => {
    const result = await agencyRequestService.respondToRequest(1, 100, 'deny');

    expect(mockFetchedRequest.status).toBe('Denied');
    expect(result.message).toContain('denied');
  });

  test('should throw 404 if agency not found', async () => {
    Agency.findOne.mockResolvedValue(null);

    await expect(
      agencyRequestService.respondToRequest(99, 100, 'accept')
    ).rejects.toThrow('Agency not found');
  });

  test('should throw 404 if request not found or already processed', async () => {
    DriverAgencyRequest.findOne.mockResolvedValue(null);

    await expect(
      agencyRequestService.respondToRequest(1, 999, 'accept')
    ).rejects.toThrow('Request not found or already processed');
  });
});

describe('agencyRequestService.cancelJoinRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue(mockDriver);
    DriverAgencyRequest.findOne.mockResolvedValue(mockRequest);
  });

  test('should cancel pending request', async () => {
    const result = await agencyRequestService.cancelJoinRequest(1);

    expect(mockRequest.status).toBe('Denied');
    expect(mockRequest.save).toHaveBeenCalled();
    expect(result.message).toContain('cancelled');
  });

  test('should throw 404 if no pending request', async () => {
    DriverAgencyRequest.findOne.mockResolvedValue(null);

    await expect(
      agencyRequestService.cancelJoinRequest(1)
    ).rejects.toThrow('No pending request found');
  });
});
