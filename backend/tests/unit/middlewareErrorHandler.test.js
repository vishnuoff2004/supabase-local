const { errorHandler } = require('../../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('should respond with error status and message', () => {
    const err = new Error('Not found');
    err.status = 404;

    errorHandler(err, mockReq, mockRes, jest.fn());

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not found' });
  });

  test('should default to 500 if no status on error', () => {
    const err = new Error('Something broke');

    errorHandler(err, mockReq, mockRes, jest.fn());

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Something broke' });
  });

  test('should include validation errors if present', () => {
    const err = new Error('Validation failed');
    err.status = 400;
    err.errors = ['Field required', 'Invalid format'];

    errorHandler(err, mockReq, mockRes, jest.fn());

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: ['Field required', 'Invalid format'],
    });
  });

  test('should default message to Internal server error', () => {
    const err = new Error();
    err.status = 500;

    errorHandler(err, mockReq, mockRes, jest.fn());

    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
