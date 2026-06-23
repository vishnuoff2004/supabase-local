/**
 * Unit tests for authService — updated to reflect Supabase-based auth flow.
 *
 * Architecture:
 *  - register()           : validates inputs, checks for duplicate email via AuthUser
 *  - completeRegistration(): creates public.Users profile after OTP verification
 *  - getMe()              : fetches user by id with AuthUser association
 *  - setupRole()          : updates user profile fields
 *  - oauthSetup()         : creates/updates public.Users profile for OAuth users
 */

const mockUser = {
  id: 1,
  name: 'Test User',
  phone: '1234567890',
  role: 'traveler',
  isVerified: true,
  active: true,
  supabaseUid: 'uuid-test-123',
  save: jest.fn().mockResolvedValue(true),
  toJSON: jest.fn().mockReturnValue({
    id: 1, name: 'Test User', phone: '1234567890', role: 'traveler',
    isVerified: true, active: true, supabaseUid: 'uuid-test-123',
  }),
};

const mockAuthUser = {
  id: 'uuid-test-123',
  email: 'test@example.com',
};

jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn().mockResolvedValue({
      id: 1, name: 'Test User', phone: '1234567890', role: 'traveler',
      isVerified: true, active: true, supabaseUid: 'uuid-test-123',
      save: jest.fn().mockResolvedValue(true),
      toJSON: jest.fn().mockReturnValue({
        id: 1, name: 'Test User', phone: '1234567890', role: 'traveler', isVerified: true, active: true,
      }),
    }),
  },
  AuthUser: {
    findOne: jest.fn(),
  },
  Driver: {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
  },
  Agency: {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1, name: 'Test Agency' }),
  },
}));

jest.mock('../../src/config/supabase', () => ({
  auth: {
    getUser: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../src/services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendOtpEmail: jest.fn().mockResolvedValue(true),
}));

const authService = require('../../src/services/authService');
const { User, AuthUser, Driver, Agency } = require('../../src/models');
const supabaseAdmin = require('../../src/config/supabase');

// ──────────────────────────────────────────────────────────────────────────────
describe('authService.register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return OTP-sent message for a new email', async () => {
    AuthUser.findOne.mockResolvedValue(null);

    const result = await authService.register({
      name: 'Test User',
      email: 'new@example.com',
      phone: '1234567890',
      role: 'traveler',
    });

    expect(result.message).toContain('OTP');
    expect(result.email).toBe('new@example.com');
  });

  test('should throw 409 when email already exists and user is verified', async () => {
    AuthUser.findOne.mockResolvedValue(mockAuthUser);
    User.findOne.mockResolvedValue({ ...mockUser, isVerified: true });

    await expect(
      authService.register({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
      })
    ).rejects.toThrow('Email already exists');
  });

  test('should allow re-registration if user exists but is not verified', async () => {
    AuthUser.findOne.mockResolvedValue(mockAuthUser);
    User.findOne.mockResolvedValue({ ...mockUser, isVerified: false });

    const result = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      role: 'traveler',
    });

    expect(result.message).toContain('OTP');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('authService.completeRegistration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Re-establish mocks after clearAllMocks (which clears queued once-values)
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 1, name: 'Test User', phone: '1234567890', role: 'traveler',
      isVerified: true, active: true, supabaseUid: 'uuid-test-123',
      save: jest.fn().mockResolvedValue(true),
      toJSON: jest.fn().mockReturnValue({
        id: 1, name: 'Test User', phone: '1234567890', role: 'traveler', isVerified: true, active: true,
      }),
    });
    User.findByPk.mockResolvedValue({
      ...mockUser,
      toJSON: () => ({ id: 1, name: 'Test User', phone: '1234567890', role: 'traveler' }),
    });
    Driver.findOne.mockResolvedValue(null);
    Driver.create.mockResolvedValue({ id: 1, userId: 1 });
    Agency.findOne.mockResolvedValue(null);
    Agency.create.mockResolvedValue({ id: 1, name: 'Test Agency' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create user profile on successful OTP verification', async () => {
    const result = await authService.completeRegistration({
      accessToken: 'valid-token',
      name: 'Test User',
      phone: '1234567890',
      role: 'traveler',
    });

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test User', phone: '1234567890', role: 'traveler', isVerified: true })
    );
    expect(result.message).toContain('Registration complete');
  });

  test('should create Driver record when role is driver', async () => {
    const driverUser = {
      ...mockUser, id: 2, role: 'driver',
      save: jest.fn(),
      toJSON: () => ({ id: 2, role: 'driver' }),
    };
    // Override create + findByPk to return a driver-role user
    User.create.mockResolvedValueOnce(driverUser);
    User.findByPk.mockResolvedValueOnce(driverUser);

    await authService.completeRegistration({
      accessToken: 'valid-token',
      name: 'Driver User',
      phone: '1234567890',
      role: 'driver',
      vehicleType: 'SUV',
      vehicleReg: 'ABC123',
    });

    expect(Driver.create).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleType: 'SUV', vehicleReg: 'ABC123' })
    );
  });

  test('should create Agency record when role is agency_admin', async () => {
    const agencyUser = {
      ...mockUser, id: 3, role: 'agency_admin',
      save: jest.fn(),
      toJSON: () => ({ id: 3, role: 'agency_admin' }),
    };
    User.create.mockResolvedValueOnce(agencyUser);
    User.findByPk.mockResolvedValueOnce(agencyUser);

    await authService.completeRegistration({
      accessToken: 'valid-token',
      name: 'Agency Admin',
      phone: '1234567890',
      role: 'agency_admin',
    });

    expect(Agency.create).toHaveBeenCalled();
  });

  test('should throw 401 when getUser fails', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const promise = authService.completeRegistration({
      accessToken: 'invalid-token', name: 'X', phone: '0', role: 'traveler',
    });
    // Advance timers past the 3 × 2s retry delays
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow('OTP verification failed');
  });

  test('should throw 409 when account already verified', async () => {
    User.findOne.mockResolvedValue({ ...mockUser, isVerified: true });

    await expect(
      authService.completeRegistration({ accessToken: 'valid-token', name: 'X', phone: '0', role: 'traveler' })
    ).rejects.toThrow('Account already verified');
  });
});

// ──────────────────────────────────────────────────────────────────────────────

describe('authService.getMe', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return sanitized user object', async () => {
    User.findByPk.mockResolvedValue({
      ...mockUser,
      toJSON: () => ({
        id: 1, name: 'Test User', phone: '1234567890', role: 'traveler',
        isVerified: true, active: true,
        password: 'secret', otpCode: '123456',  // should be stripped
      }),
    });

    const result = await authService.getMe(1);

    expect(result).toHaveProperty('id', 1);
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('otpCode');
  });

  test('should throw 404 if user not found', async () => {
    User.findByPk.mockResolvedValue(null);

    await expect(authService.getMe(999)).rejects.toThrow('User not found');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('authService.setupRole', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should update user role and return profile', async () => {
    const user = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ id: 1, name: 'Test User', role: 'driver', phone: '1234567890' }),
    };
    User.findByPk.mockResolvedValue(user);
    Driver.findOne.mockResolvedValue(null);

    const result = await authService.setupRole(1, { role: 'driver', vehicleType: 'SUV' });

    expect(user.role).toBe('driver');
    expect(user.save).toHaveBeenCalled();
    expect(result.message).toContain('setup complete');
  });

  test('should throw 404 if user not found', async () => {
    User.findByPk.mockResolvedValue(null);

    await expect(authService.setupRole(999, { role: 'traveler' })).rejects.toThrow('User not found');
  });
});
