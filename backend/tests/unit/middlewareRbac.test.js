const { authorize } = require('../../src/middleware/rbac');

describe('authorize middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { user: null };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('should call next() when user has allowed role', () => {
    mockReq.user = { id: 1, role: 'admin' };
    const middleware = authorize('admin');

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next() when user has one of allowed roles', () => {
    mockReq.user = { id: 1, role: 'driver' };
    const middleware = authorize('admin', 'driver');

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should return 401 if no user', () => {
    const middleware = authorize('admin');

    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 403 if user role not allowed', () => {
    mockReq.user = { id: 1, role: 'traveler' };
    const middleware = authorize('admin', 'agency_admin');

    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
