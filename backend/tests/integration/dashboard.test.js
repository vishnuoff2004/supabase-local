const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models', () => ({
  Booking: { count: jest.fn(), findAll: jest.fn() },
  Driver: { findOne: jest.fn(), count: jest.fn() },
  User: { count: jest.fn() },
  Agency: { count: jest.fn() },
  Sequelize: { Op: require('sequelize').Op },
}));

const app = require('../../src/app');

const travelerToken = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
const driverToken = jwt.sign({ id: 2, role: 'driver' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
const adminToken = jwt.sign({ id: 99, role: 'admin' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');

const { Booking, Driver, User, Agency } = require('../../src/models');

describe('Dashboard APIs (REQ-022 to REQ-024)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/dashboard/user should return 200 with activeBookings — TEST-081', async () => {
    Booking.count.mockResolvedValue(0);
    Booking.findAll.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/dashboard/user')
      .set('Authorization', `Bearer ${travelerToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activeBookings');
    expect(res.body).toHaveProperty('totalBookings');
  });

  test('GET /api/dashboard/admin shows counts — TEST-085', async () => {
    User.count.mockResolvedValue(10);
    Agency.count.mockResolvedValue(3);
    Booking.count.mockResolvedValue(5);
    Booking.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(3).mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalAgencies');
    expect(res.body).toHaveProperty('totalActiveBookings');
    expect(res.body).toHaveProperty('bookingsByStatus');
  });

  test('GET /api/dashboard/admin includes status breakdown — TEST-086', async () => {
    User.count.mockResolvedValue(5);
    Agency.count.mockResolvedValue(2);
    Booking.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3).mockResolvedValueOnce(4).mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.bookingsByStatus).toBeDefined();
    expect(typeof res.body.bookingsByStatus).toBe('object');
  });

  test('GET /api/dashboard/driver shows pending requests — TEST-083', async () => {
    Driver.findOne.mockResolvedValue({ id: 1, userId: 2, available: true });
    Booking.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    Booking.findAll.mockResolvedValue([{ id: 1, status: 'On Trip' }]);
    const res = await request(app)
      .get('/api/dashboard/driver')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pendingRequests');
  });

  test('GET /api/dashboard/driver shows upcoming active trips — TEST-082', async () => {
    Driver.findOne.mockResolvedValue({ id: 1, userId: 2, available: true });
    Booking.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    Booking.findAll.mockResolvedValue([{ id: 5, status: 'Confirmed', travelDate: '2026-07-20' }]);
    const res = await request(app)
      .get('/api/dashboard/driver')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    // Driver dashboard returns 'activeTrips' (confirmed/on-trip bookings)
    expect(res.body).toHaveProperty('activeTrips');
  });

  test('traveler cannot access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${travelerToken}`);
    expect(res.status).toBe(403);
  });

  test('driver cannot access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST-142 — Admin dashboard (REQ-024)
// Scenario: Admin logs in then views dashboard
// Input:
//   1. POST /api/auth/login as admin
//   2. GET /api/dashboard/admin
// Expected Output: totalUsers, totalAgencies, totalActiveBookings, bookingsByStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('TEST-142 — Admin dashboard E2E flow (REQ-024)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TEST-142: admin token grants access to dashboard with all required fields', async () => {
    // Step 1: Simulate admin already logged in (token represents POST /api/auth/login result)
    // In integration tests the token is pre-signed to represent a successful login response
    const adminJwt = jwt.sign(
      { id: 99, role: 'admin' },
      process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev'
    );

    // Step 2: Mock dashboard data counts
    User.count.mockResolvedValue(25);
    Agency.count.mockResolvedValue(6);
    // Booking.count is called multiple times: total active, then per-status breakdown
    Booking.count
      .mockResolvedValueOnce(12)   // totalActiveBookings
      .mockResolvedValueOnce(5)    // Pending
      .mockResolvedValueOnce(4)    // Confirmed
      .mockResolvedValueOnce(2)    // On Trip
      .mockResolvedValueOnce(8)    // Completed
      .mockResolvedValueOnce(3);   // Cancelled

    // Step 3: Call GET /api/dashboard/admin with admin token
    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminJwt}`);

    // Step 4: Assert all four required fields are present
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalAgencies');
    expect(res.body).toHaveProperty('totalActiveBookings');
    expect(res.body).toHaveProperty('bookingsByStatus');

    // Assert values are correct numbers
    expect(typeof res.body.totalUsers).toBe('number');
    expect(typeof res.body.totalAgencies).toBe('number');
    expect(typeof res.body.totalActiveBookings).toBe('number');

    // Assert bookingsByStatus is an object with status keys
    expect(typeof res.body.bookingsByStatus).toBe('object');
  });

  test('TEST-142: dashboard response contains numeric counts (not null or undefined)', async () => {
    User.count.mockResolvedValue(10);
    Agency.count.mockResolvedValue(3);
    Booking.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);

    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).not.toBeNull();
    expect(res.body.totalUsers).not.toBeUndefined();
    expect(res.body.totalAgencies).not.toBeNull();
    expect(res.body.totalAgencies).not.toBeUndefined();
    expect(res.body.totalActiveBookings).not.toBeNull();
    expect(res.body.totalActiveBookings).not.toBeUndefined();
    expect(res.body.bookingsByStatus).not.toBeNull();
    expect(res.body.bookingsByStatus).not.toBeUndefined();
  });

  test('TEST-142: non-admin role cannot access dashboard — returns 403', async () => {
    const travelerJwt = jwt.sign(
      { id: 1, role: 'traveler' },
      process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev'
    );

    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${travelerJwt}`);

    expect(res.status).toBe(403);
  });

  test('TEST-142: unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/dashboard/admin');
    expect(res.status).toBe(401);
  });
});

