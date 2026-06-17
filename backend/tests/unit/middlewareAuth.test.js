const { verifyToken } = require('../../src/utils/jwt');

jest.mock('../../src/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

const { authenticate, optionalAuthenticate } = require('../../src/middleware/auth');

describe('authenticate middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('should call next() with valid token', () => {
    mockReq.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue({ id: 1, role: 'traveler' });

    authenticate(mockReq, mockRes, mockNext);

    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(mockReq.user).toEqual({ id: 1, role: 'traveler' });
    expect(mockNext).toHaveBeenCalled();
  });

  test('should return 401 if no authorization header', () => {
    authenticate(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 401 if auth header does not start with Bearer', () => {
    mockReq.headers.authorization = 'Basic token';

    authenticate(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test('should return 401 if token is expired', () => {
    mockReq.headers.authorization = 'Bearer expired-token';
    verifyToken.mockImplementation(() => { throw new Error('Token expired'); });

    authenticate(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token expired' });
  });

  test('should return 401 if token is malformed', () => {
    mockReq.headers.authorization = 'Bearer bad-token';
    verifyToken.mockImplementation(() => { throw new Error('Invalid token'); });

    authenticate(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });
});

describe('optionalAuthenticate middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  test('should set user and call next() with valid token', () => {
    mockReq.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue({ id: 1, role: 'traveler' });

    optionalAuthenticate(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual({ id: 1, role: 'traveler' });
    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next() without user when no token', () => {
    optionalAuthenticate(mockReq, mockRes, mockNext);

    expect(mockReq.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next() without user when token is invalid', () => {
    mockReq.headers.authorization = 'Bearer invalid';
    verifyToken.mockImplementation(() => { throw new Error('Invalid token'); });

    optionalAuthenticate(mockReq, mockRes, mockNext);

    expect(mockReq.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
