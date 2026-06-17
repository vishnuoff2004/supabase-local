const bcrypt = require('bcrypt');

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedPassword123',
  phone: '1234567890',
  role: 'traveler',
  isVerified: false,
  active: false,
  otpCode: '123456',
  otpExpiry: new Date(Date.now() + 600000),
  loginAttempts: 0,
  lockedUntil: null,
  save: jest.fn().mockResolvedValue(true),
  toJSON: jest.fn().mockReturnValue({
    id: 1, name: 'Test User', email: 'test@example.com',
    phone: '1234567890', role: 'traveler', isVerified: true, active: true,
  }),
};

jest.mock('bcrypt');
jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn().mockResolvedValue(mockUser),
  },
  Driver: {
    create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
  },
  Agency: {
    create: jest.fn().mockResolvedValue({ id: 1, name: 'Test Agency' }),
  },
}));

jest.mock('../../src/utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-jwt-token'),
}));

jest.mock('../../src/services/emailService', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true),
}));

const authService = require('../../src/services/authService');
const { User } = require('../../src/models');
const { generateToken } = require('../../src/utils/jwt');
const { sendOtpEmail } = require('../../src/services/emailService');

describe('authService.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue('hashedPassword123');
  });

  test('should create user and send OTP on valid registration', async () => {
    User.findOne.mockResolvedValue(null);

    const result = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phone: '1234567890',
      role: 'traveler',
    });

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', role: 'traveler' })
    );
    expect(sendOtpEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    );
    expect(result.message).toContain('OTP sent');
  });

  test('should throw 409 when email already exists', async () => {
    User.findOne.mockResolvedValue({ id: 99, email: 'test@example.com' });

    await expect(
      authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: '1234567890',
      })
    ).rejects.toThrow('Email already exists');
  });

  test('should create Driver record when role is driver', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      ...mockUser, id: 2, role: 'driver',
      toJSON: () => ({ id: 2, role: 'driver' }),
    });

    const { Driver } = require('../../src/models');

    await authService.register({
      name: 'Driver User',
      email: 'driver@example.com',
      password: 'Password123',
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
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      ...mockUser, id: 3, role: 'agency_admin',
      toJSON: () => ({ id: 3, role: 'agency_admin' }),
    });

    const { Agency } = require('../../src/models');

    await authService.register({
      name: 'Agency Admin',
      email: 'agency@example.com',
      password: 'Password123',
      phone: '1234567890',
      role: 'agency_admin',
    });

    expect(Agency.create).toHaveBeenCalled();
  });
});

describe('authService.verifyOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockUser, {
      isVerified: false,
      active: false,
      otpCode: '123456',
      otpExpiry: new Date(Date.now() + 600000),
      save: jest.fn().mockResolvedValue(true),
      toJSON: jest.fn().mockReturnValue({
        id: 1, name: 'Test', email: 'test@example.com', role: 'traveler',
        isVerified: true, active: true,
      }),
    });
    User.findOne.mockResolvedValue(mockUser);
  });

  test('should verify OTP and activate account', async () => {
    const result = await authService.verifyOtp('test@example.com', '123456');

    expect(mockUser.isVerified).toBe(true);
    expect(mockUser.active).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
    expect(generateToken).toHaveBeenCalledWith(mockUser);
    expect(result.token).toBe('mock-jwt-token');
  });

  test('should throw 404 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      authService.verifyOtp('nonexistent@example.com', '123456')
    ).rejects.toThrow('User not found');
  });

  test('should throw 400 if already verified', async () => {
    mockUser.isVerified = true;

    await expect(
      authService.verifyOtp('test@example.com', '123456')
    ).rejects.toThrow('Account is already verified');
  });

  test('should throw 410 if OTP expired', async () => {
    mockUser.otpExpiry = new Date(Date.now() - 600000);

    await expect(
      authService.verifyOtp('test@example.com', '123456')
    ).rejects.toThrow('OTP has expired');
  });

  test('should throw 401 if OTP is incorrect', async () => {
    await expect(
      authService.verifyOtp('test@example.com', 'wrong-otp')
    ).rejects.toThrow('Invalid OTP');
  });
});

describe('authService.resendOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockUser, {
      isVerified: false,
      otpCode: 'old-otp',
      otpExpiry: new Date(Date.now() + 600000),
      save: jest.fn().mockResolvedValue(true),
    });
    User.findOne.mockResolvedValue(mockUser);
  });

  test('should regenerate OTP and resend email', async () => {
    const result = await authService.resendOtp('test@example.com');

    expect(mockUser.save).toHaveBeenCalled();
    expect(sendOtpEmail).toHaveBeenCalled();
    expect(result.message).toContain('new OTP');
  });

  test('should throw 404 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      authService.resendOtp('nonexistent@example.com')
    ).rejects.toThrow('User not found');
  });

  test('should throw 400 if already verified', async () => {
    mockUser.isVerified = true;

    await expect(
      authService.resendOtp('test@example.com')
    ).rejects.toThrow('Account is already verified');
  });
});

describe('authService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockUser, {
      isVerified: true,
      active: true,
      loginAttempts: 0,
      lockedUntil: null,
      password: 'hashedPassword123',
      save: jest.fn().mockResolvedValue(true),
      toJSON: jest.fn().mockReturnValue({
        id: 1, name: 'Test', email: 'test@example.com', role: 'traveler',
      }),
    });
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
  });

  test('should login successfully with valid credentials', async () => {
    const result = await authService.login('test@example.com', 'Password123');

    expect(generateToken).toHaveBeenCalled();
    expect(result.token).toBe('mock-jwt-token');
    expect(mockUser.loginAttempts).toBe(0);
  });

  test('should throw 401 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      authService.login('nonexistent@example.com', 'Password123')
    ).rejects.toThrow('Invalid email or password');
  });

  test('should throw 403 if email not verified', async () => {
    mockUser.isVerified = false;

    await expect(
      authService.login('unverified@example.com', 'Password123')
    ).rejects.toThrow('Please verify your email');
  });

  test('should throw 403 if account deactivated', async () => {
    mockUser.active = false;

    await expect(
      authService.login('test@example.com', 'Password123')
    ).rejects.toThrow('Account deactivated');
  });

  test('should throw 429 if account locked', async () => {
    mockUser.lockedUntil = new Date(Date.now() + 15000);

    await expect(
      authService.login('test@example.com', 'Password123')
    ).rejects.toThrow('Account locked');
  });

  test('should throw 401 on wrong password and increment attempts', async () => {
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login('test@example.com', 'WrongPassword')
    ).rejects.toThrow('Invalid email or password');

    expect(mockUser.loginAttempts).toBe(1);
    expect(mockUser.save).toHaveBeenCalled();
  });

  test('should lock account after 5 failed attempts', async () => {
    bcrypt.compare.mockResolvedValue(false);
    mockUser.loginAttempts = 4;

    await expect(
      authService.login('test@example.com', 'WrongPassword')
    ).rejects.toThrow('Invalid email or password');

    expect(mockUser.lockedUntil).toBeDefined();
  });

  test('should allow demo accounts without verification', async () => {
    mockUser.isVerified = false;
    mockUser.email = 'admin123@gmail.com';

    const result = await authService.login('admin123@gmail.com', 'Password123');

    expect(result.token).toBe('mock-jwt-token');
  });
});
