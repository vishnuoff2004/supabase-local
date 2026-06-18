const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/authService');
jest.mock('../../src/services/bookingService');
jest.mock('../../src/services/adminService');
jest.mock('../../src/services/userService');
jest.mock('../../src/services/searchService');
jest.mock('../../src/services/driverService');

const app = require('../../src/app');
const authService = require('../../src/services/authService');
const bookingService = require('../../src/services/bookingService');
const adminService = require('../../src/services/adminService');
const userService = require('../../src/services/userService');
const searchService = require('../../src/services/searchService');
const driverService = require('../../src/services/driverService');

const validUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'traveler',
};

describe('TEST-005 to TEST-016 — Auth Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register — TEST-001', () => {
    test('should return 201 with user data on valid registration', async () => {
      authService.register.mockResolvedValue(validUser);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'john@example.com', password: 'Password1', phone: '+911234567890' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('email', 'john@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    test('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', password: 'Password1', phone: '+911234567890' });
      expect(res.status).toBe(400);
    });

    test('should return 409 on duplicate email — TEST-002', async () => {
      authService.register.mockRejectedValue({ status: 409, message: 'Email already exists' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane Doe', email: 'john@example.com', password: 'Password1', phone: '+911234567891' });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/email already exists/i);
    });
  });

  describe('POST /api/auth/login — TEST-005 to TEST-008', () => {
    test('should return 200 with token on valid login — TEST-005', async () => {
      const token = jwt.sign({ id: 1, role: 'traveler' }, 'test-secret');
      authService.login.mockResolvedValue({ token, user: validUser });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email');
      expect(res.body.user).toHaveProperty('role');
    });

    test('should return 401 on wrong password — TEST-006', async () => {
      authService.login.mockRejectedValue({ status: 401, message: 'Invalid email or password' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'WrongPass1' });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    test('should return 401 on non-existent email — TEST-007', async () => {
      authService.login.mockRejectedValue({ status: 401, message: 'Invalid email or password' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password1' });
      expect(res.status).toBe(401);
    });

    test('should return 429 on account lockout — TEST-008', async () => {
      authService.login.mockRejectedValue({ status: 429, message: 'Account locked. Try again after 15 minutes' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'WrongPass1' });
      expect(res.status).toBe(429);
      expect(res.body.message).toMatch(/account locked/i);
    });

    test('should return 400 when fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('JWT Authentication — TEST-009 to TEST-012', () => {
    test('should return 200 with valid JWT on protected route — TEST-009', async () => {
      const validJwt = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
      bookingService.getUserBookings.mockResolvedValue({ data: [], page: 1, limit: 10, totalPages: 0, totalItems: 0 });
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${validJwt}`);
      expect(res.status).toBe(200);
    });

    test('should return 401 with expired JWT — TEST-010', async () => {
      const expiredJwt = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev', { expiresIn: '0s' });
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${expiredJwt}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/token expired/i);
    });

    test('should return 401 with malformed JWT — TEST-011', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid token/i);
    });

    test('should return 401 without JWT — TEST-012', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/no token provided/i);
    });
  });

  describe('Role-Based Access — TEST-013 to TEST-016', () => {
    function makeToken(role) {
      return jwt.sign({ id: 1, role }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
    }

    test('traveler can access search endpoint — TEST-013', async () => {
      searchService.searchRoutes.mockResolvedValue({ data: [] });
      const res = await request(app).get('/api/routes/search');
      expect(res.status).toBe(200);
    });

    test('traveler cannot access admin endpoint — TEST-014', async () => {
      const token = makeToken('traveler');
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    test('driver can access driver endpoint — TEST-015', async () => {
      const token = makeToken('driver');
      driverService.createRoute.mockResolvedValue({ id: 1 });
      const res = await request(app)
        .post('/api/drivers/routes')
        .set('Authorization', `Bearer ${token}`)
        .send({ source: 'Mumbai', destination: 'Pune', departureTime: '2026-07-15T08:00:00Z', arrivalTime: '2026-07-15T12:00:00Z', fare: 500, capacity: 4 });
      expect(res.status).toBe(201);
    });

    test('admin can access admin endpoint — TEST-016', async () => {
      const token = makeToken('admin');
      adminService.getUsers.mockResolvedValue([]);
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
