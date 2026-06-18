const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/agencyService');

const app = require('../../src/app');
const agencyService = require('../../src/services/agencyService');

const agencyToken = jwt.sign({ id: 3, role: 'agency_admin' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');

describe('Agency APIs (REQ-017, REQ-018)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/agency/drivers should return 201 — TEST-063', async () => {
    agencyService.addDriver.mockResolvedValue({ id: 3, agencyId: 1 });
    const res = await request(app)
      .post('/api/agency/drivers')
      .set('Authorization', `Bearer ${agencyToken}`)
      .send({ driverId: 3 });
    expect(res.status).toBe(201);
  });

  test('DELETE /api/agency/drivers/3 should return 200 — TEST-064', async () => {
    agencyService.removeDriver.mockResolvedValue({ message: 'Driver removed from agency' });
    const res = await request(app)
      .delete('/api/agency/drivers/3')
      .set('Authorization', `Bearer ${agencyToken}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/agency/bookings should return 200 — TEST-067', async () => {
    agencyService.getBookings.mockResolvedValue({ data: [] });
    const res = await request(app)
      .get('/api/agency/bookings')
      .set('Authorization', `Bearer ${agencyToken}`);
    expect(res.status).toBe(200);
  });

  test('traveler cannot access agency endpoints — RBAC', async () => {
    const travelerToken = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
    const res = await request(app)
      .get('/api/agency/bookings')
      .set('Authorization', `Bearer ${travelerToken}`);
    expect(res.status).toBe(403);
  });

  test('adding driver already in another agency returns 409 — TEST-065', async () => {
    agencyService.addDriver.mockRejectedValue({ status: 409, message: 'Driver already belongs to another agency' });
    const res = await request(app)
      .post('/api/agency/drivers')
      .set('Authorization', `Bearer ${agencyToken}`)
      .send({ driverId: 5 });
    expect(res.status).toBe(409);
  });

  test('removing driver with active bookings returns 409 — TEST-066', async () => {
    agencyService.removeDriver.mockRejectedValue({ status: 409, message: 'Driver has active bookings' });
    const res = await request(app)
      .delete('/api/agency/drivers/3')
      .set('Authorization', `Bearer ${agencyToken}`);
    expect(res.status).toBe(409);
  });

  test('GET /api/agency/bookings filtered by status — TEST-068', async () => {
    agencyService.getBookings.mockResolvedValue({
      data: [{ id: 1, status: 'Confirmed' }], page: 1, totalItems: 1,
    });
    const res = await request(app)
      .get('/api/agency/bookings?status=Confirmed')
      .set('Authorization', `Bearer ${agencyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('Confirmed');
  });

  test('GET /api/agency/bookings filtered by date range — TEST-069', async () => {
    agencyService.getBookings.mockResolvedValue({
      data: [{ id: 2, status: 'Pending', travelDate: '2026-07-10' }], page: 1, totalItems: 1,
    });
    const res = await request(app)
      .get('/api/agency/bookings?from=2026-07-01&to=2026-07-31')
      .set('Authorization', `Bearer ${agencyToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
