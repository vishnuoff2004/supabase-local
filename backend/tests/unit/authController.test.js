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
