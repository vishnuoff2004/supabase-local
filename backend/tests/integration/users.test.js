const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/userService');
jest.mock('../../src/services/authService');

const app = require('../../src/app');
const userService = require('../../src/services/userService');

const testToken = jwt.sign(
  { id: 1, role: 'traveler' },
  process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev'
);

describe('TEST-017 to TEST-019 — User Profile APIs (REQ-005)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 with user profile on GET /api/users/profile', async () => {
    userService.getProfile.mockResolvedValue({ id: 1, name: 'John', email: 'john@example.com' });
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
  });

  test('should return 401 without auth on GET /api/users/profile', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });

  test('should return 200 on profile update with valid data — TEST-017', async () => {
    userService.updateProfile.mockResolvedValue({ id: 1, name: 'John Updated', phone: '+919876543210' });
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ name: 'John Updated', phone: '+919876543210' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'John Updated');
    expect(res.body).toHaveProperty('phone', '+919876543210');
  });

  test('should return 400 on profile update with invalid phone — TEST-018', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ phone: 'abc' });
    expect(res.status).toBe(400);
  });

  test('should return 403 on profile update changing email without re-auth — TEST-019', async () => {
    userService.updateProfile.mockRejectedValue({ status: 403, message: 'Re-authentication required to change email' });
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ email: 'newemail@example.com' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/re-authentication/i);
  });
});
