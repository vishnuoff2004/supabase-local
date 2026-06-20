const jwt = require('jsonwebtoken');

describe('Phase 2 Auth — Socket Authentication', () => {
  const secret = process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev';
  const validToken = jwt.sign({ id: 1, role: 'traveler' }, secret, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ id: 1, role: 'traveler' }, secret, { expiresIn: '0s' });
  const invalidToken = 'not-a-valid-token';

  function mockSocket(authToken) {
    const events = {};
    const socket = {
      handshake: { auth: { token: authToken }, query: {} },
      user: null,
      on: (event, handler) => { events[event] = handler; },
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    };
    socket._events = events;
    return socket;
  }

  test('authenticateSocket accepts valid token', (done) => {
    const { authenticateSocket } = require('../../src/socket/authenticateSocket');
    const socket = mockSocket(validToken);
    authenticateSocket(['traveler'])(socket, (err) => {
      expect(err).toBeUndefined();
      expect(socket.user).toBeDefined();
      expect(socket.user.id).toBe(1);
      expect(socket.user.role).toBe('traveler');
      done();
    });
  });

  test('authenticateSocket rejects expired token — TEST-153', (done) => {
    const { authenticateSocket } = require('../../src/socket/authenticateSocket');
    const socket = mockSocket(expiredToken);
    authenticateSocket(['traveler'])(socket, (err) => {
      expect(err).toBeDefined();
      expect(err.data.code).toBe(4001);
      done();
    });
  });

  test('authenticateSocket rejects malformed token — TEST-153', (done) => {
    const { authenticateSocket } = require('../../src/socket/authenticateSocket');
    const socket = mockSocket(invalidToken);
    authenticateSocket(['traveler'])(socket, (err) => {
      expect(err).toBeDefined();
      expect(err.data.code).toBe(4001);
      done();
    });
  });

  test('authenticateSocket rejects missing token — TEST-153', (done) => {
    const { authenticateSocket } = require('../../src/socket/authenticateSocket');
    const socket = mockSocket(undefined);
    authenticateSocket(['traveler'])(socket, (err) => {
      expect(err).toBeDefined();
      expect(err.data.code).toBe(4001);
      done();
    });
  });

  test('authenticateSocket rejects role mismatch — TEST-154', (done) => {
    const { authenticateSocket } = require('../../src/socket/authenticateSocket');
    const socket = mockSocket(validToken);
    authenticateSocket(['admin'])(socket, (err) => {
      expect(err).toBeDefined();
      expect(err.data.code).toBe(4003);
      done();
    });
  });

  test('authenticateSocket token from query string', (done) => {
    const { authenticateSocket } = require('../../src/socket/authenticateSocket');
    const socket = {
      handshake: { auth: {}, query: { token: validToken } },
      user: null,
      on: () => {},
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    };
    authenticateSocket(['traveler'])(socket, (err) => {
      expect(err).toBeUndefined();
      expect(socket.user.id).toBe(1);
      done();
    });
  });
});
