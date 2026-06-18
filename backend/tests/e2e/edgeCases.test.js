const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/authService');
jest.mock('../../src/services/bookingService');
jest.mock('../../src/services/searchService');

const app = require('../../src/app');
const authService = require('../../src/services/authService');
const bookingService = require('../../src/services/bookingService');
const searchService = require('../../src/services/searchService');

const travelerToken = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');

describe('TEST-072, TEST-129, TEST-143, TEST-145, TEST-148, TEST-149 — Edge Cases', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('Last seat booking — first succeeds, second gets 409 — TEST-145', async () => {
    bookingService.createBooking.mockResolvedValueOnce({ id: 1, status: 'Pending' });
    bookingService.createBooking.mockRejectedValueOnce({ status: 409, message: 'Insufficient capacity' });

    const first = await request(app).post('/api/bookings').set('Authorization', `Bearer ${travelerToken}`).send({ routeId: 1, driverId: 1, seatCount: 1, travelDate: '2026-07-15' });
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/bookings').set('Authorization', `Bearer ${travelerToken}`).send({ routeId: 1, driverId: 1, seatCount: 1, travelDate: '2026-07-15' });
    expect(second.status).toBe(409);
  });

  test('Deactivated user login returns 403 — TEST-072', async () => {
    authService.login.mockRejectedValue({ status: 403, message: 'Account deactivated. Contact administrator' });
    const res = await request(app).post('/api/auth/login').send({ email: 'deactivated@test.com', password: 'Password1' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('Past date booking returns 400 — TEST-030', async () => {
    bookingService.createBooking.mockRejectedValue({ status: 400, message: 'Travel date cannot be in the past' });
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${travelerToken}`).send({ routeId: 1, driverId: 1, seatCount: 1, travelDate: '2020-01-01' });
    expect(res.status).toBe(400);
  });

  test('Excess seats returns 400 — TEST-115', async () => {
    bookingService.createBooking.mockRejectedValue({ status: 400, message: 'Seat count exceeds vehicle capacity' });
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${travelerToken}`).send({ routeId: 1, driverId: 1, seatCount: 100, travelDate: '2026-07-15' });
    expect(res.status).toBe(400);
  });

  test('Search with special characters returns 200 with empty data — TEST-143', async () => {
    searchService.searchRoutes.mockResolvedValue({ data: [] });
    const res = await request(app).get('/api/routes/search?source=<script>&destination=Pune');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('Deactivated agency routes excluded from search results — TEST-129 / TEST-148', async () => {
    // After agency deactivation, search returns empty (agency routes not included)
    searchService.searchRoutes.mockResolvedValue({ data: [] });
    const res = await request(app).get('/api/routes/search?source=Mumbai&destination=Pune');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('Password strength enforcement — weak password rejected — TEST-149', async () => {
    authService.register.mockRejectedValue({ status: 400, message: 'Password must contain uppercase, lowercase, and digit' });
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'test@test.com', password: 'weakpassword', phone: '+911234567890' });
    expect(res.status).toBe(400);
  });
});
