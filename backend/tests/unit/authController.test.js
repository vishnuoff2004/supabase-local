jest.mock('../../src/services/authService');
jest.mock('../../src/validations/authValidation');

const authController = require('../../src/controllers/authController');
const authService = require('../../src/services/authService');
const { validateRegister, validateLogin } = require('../../src/validations/authValidation');

describe('authController.register', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {
        name: 'Test',
        email: 'test@example.com',
        password: 'Password123',
        phone: '1234567890',
      },
      licenseDocUrl: null,
      vehicleRcUrl: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('should return 201 on successful registration', async () => {
    validateRegister.mockReturnValue({ error: undefined });
    authService.register.mockResolvedValue({ message: 'OTP sent', email: 'test@example.com' });

    await authController.register(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'OTP sent', email: 'test@example.com' });
  });

  test('should return 400 if validation fails', async () => {
    validateRegister.mockReturnValue({
      error: { details: [{ message: 'Invalid email' }] },
    });

    await authController.register(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email' })
    );
  });

  test('should return 409 on duplicate email', async () => {
    validateRegister.mockReturnValue({ error: undefined });
    const err = new Error('Email already exists');
    err.status = 409;
    authService.register.mockRejectedValue(err);

    await authController.register(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
  });

  test('should pass unknown errors to next()', async () => {
    validateRegister.mockReturnValue({ error: undefined });
    authService.register.mockRejectedValue(new Error('Unexpected error'));

    await authController.register(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('authController.verifyOtp', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { body: { email: 'test@example.com', otp: '123456' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('should return 200 on successful OTP verification', async () => {
    authService.verifyOtp.mockResolvedValue({
      token: 'jwt-token',
      user: { id: 1, email: 'test@example.com' },
    });

    await authController.verifyOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      token: 'jwt-token',
      user: { id: 1, email: 'test@example.com' },
    });
  });

  test('should return 400 if email or OTP missing', async () => {
    mockReq.body = {};

    await authController.verifyOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test('should return 401 if OTP is invalid', async () => {
    const err = new Error('Invalid OTP');
    err.status = 401;
    authService.verifyOtp.mockRejectedValue(err);

    await authController.verifyOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});

describe('authController.resendOtp', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { body: { email: 'test@example.com' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('should return 200 on successful resend', async () => {
    authService.resendOtp.mockResolvedValue({ message: 'New OTP sent' });

    await authController.resendOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test('should return 400 if email missing', async () => {
    mockReq.body = {};

    await authController.resendOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test('should return 404 if user not found', async () => {
    const err = new Error('User not found');
    err.status = 404;
    authService.resendOtp.mockRejectedValue(err);

    await authController.resendOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });
});

describe('authController.login', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { body: { email: 'test@example.com', password: 'Password123' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('should return 200 on successful login', async () => {
    validateLogin.mockReturnValue({ error: undefined });
    authService.login.mockResolvedValue({
      token: 'jwt-token',
      user: { id: 1, email: 'test@example.com' },
    });

    await authController.login(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test('should return 400 if validation fails', async () => {
    validateLogin.mockReturnValue({
      error: { details: [{ message: 'Email is required' }] },
    });

    await authController.login(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test('should return 401 on wrong credentials', async () => {
    validateLogin.mockReturnValue({ error: undefined });
    const err = new Error('Invalid email or password');
    err.status = 401;
    authService.login.mockRejectedValue(err);

    await authController.login(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test('should return 403 on unverified account', async () => {
    validateLogin.mockReturnValue({ error: undefined });
    const err = new Error('Please verify your email');
    err.status = 403;
    authService.login.mockRejectedValue(err);

    await authController.login(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
  });

  test('should return 429 on locked account', async () => {
    validateLogin.mockReturnValue({ error: undefined });
    const err = new Error('Account locked');
    err.status = 429;
    authService.login.mockRejectedValue(err);

    await authController.login(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
  });
});
