const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/adminService');

const app = require('../../src/app');
const adminService = require('../../src/services/adminService');

const adminToken = jwt.sign({ id: 99, role: 'admin' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');

describe('Admin APIs (REQ-019 to REQ-021)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/admin/users should return 200 — TEST-070', async () => {
    adminService.getUsers.mockResolvedValue([{ id: 1, name: 'User1' }]);
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('PUT /api/admin/users/5/deactivate should return 200 — TEST-071', async () => {
    adminService.toggleUserStatus.mockResolvedValue({ id: 5, active: false });
    const res = await request(app)
      .put('/api/admin/users/5/deactivate')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('POST /api/admin/agencies should return 201 — TEST-074', async () => {
    adminService.createAgency.mockResolvedValue({ id: 3, name: 'City Travels' });
    const res = await request(app)
      .post('/api/admin/agencies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'City Travels', email: 'city@travels.com', phone: '+911234567890' });
    expect(res.status).toBe(201);
  });

  test('PUT /api/admin/agencies/1/deactivate should return 200 — TEST-075', async () => {
    adminService.deactivateAgency.mockResolvedValue({ id: 1, active: false });
    const res = await request(app)
      .put('/api/admin/agencies/1/deactivate')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/admin/bookings should return 200 — TEST-079', async () => {
    adminService.getAllBookings.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('traveler cannot access admin endpoints — TEST-073', async () => {
    const travelerToken = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${travelerToken}`);
    expect(res.status).toBe(403);
  });

  test('non-admin cannot create agency — TEST-077', async () => {
    const travelerToken = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
    const res = await request(app)
      .post('/api/admin/agencies')
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({ name: 'Hack Agency', email: 'hack@example.com', phone: '+911234567890' });
    expect(res.status).toBe(403);
  });

  test('admin can cancel any booking — TEST-078', async () => {
    adminService.adminCancelBooking.mockResolvedValue({ id: 1, status: 'Cancelled', cancelledBy: 99 });
    const res = await request(app)
      .put('/api/admin/bookings/1/cancel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Policy violation' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Cancelled');
  });

  test('deactivated agency routes excluded after deactivation — TEST-076', async () => {
    adminService.deactivateAgency.mockResolvedValue({ id: 1, active: false });
    const res = await request(app)
      .put('/api/admin/agencies/1/deactivate')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });
});
