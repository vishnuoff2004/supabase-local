const request = require('supertest');

jest.mock('../../src/services/searchService');

const app = require('../../src/app');
const searchService = require('../../src/services/searchService');

describe('TEST-020 to TEST-025 — Search APIs (REQ-006, REQ-007)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return results for existing route — TEST-020', async () => {
    searchService.searchRoutes.mockResolvedValue({
      data: [{ id: 1, source: 'Mumbai', destination: 'Pune', fare: 500, driverName: 'Ravi', agencyName: 'City Travels', vehicleType: 'Sedan' }],
    });
    const res = await request(app).get('/api/routes/search?source=Mumbai&destination=Pune');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('should return empty array for non-existent route — TEST-022', async () => {
    searchService.searchRoutes.mockResolvedValue({ data: [], message: 'No routes found for this destination' });
    const res = await request(app).get('/api/routes/search?source=Tokyo&destination=Osaka');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('results should include agency and driver details — TEST-024', async () => {
    searchService.searchRoutes.mockResolvedValue({
      data: [{ id: 1, source: 'Mumbai', destination: 'Pune', fare: 500, driverName: 'Ravi', driverId: 1, agencyName: 'City Travels', agencyId: 1, vehicleType: 'Sedan' }],
    });
    const res = await request(app).get('/api/routes/search?source=Mumbai&destination=Pune');
    expect(res.body.data[0]).toHaveProperty('agencyName');
    expect(res.body.data[0]).toHaveProperty('driverName');
    expect(res.body.data[0]).toHaveProperty('vehicleType');
    expect(res.body.data[0]).toHaveProperty('fare');
  });

  test('search API responds within 2 seconds — TEST-023', async () => {
    searchService.searchRoutes.mockResolvedValue({
      data: [{ id: 1, source: 'Mumbai', destination: 'Pune', fare: 500.00, driverName: 'Ravi', agencyName: 'City Travels', vehicleType: 'Sedan' }],
    });
    const start = Date.now();
    const res = await request(app).get('/api/routes/search?source=Mumbai&destination=Pune');
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });

  test('search returns empty array for partial match with no results — TEST-021', async () => {
    searchService.searchRoutes.mockResolvedValue({ data: [] });
    const res = await request(app).get('/api/routes/search?source=Mum');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('fare is a number with up to 2 decimal places — TEST-025', async () => {
    searchService.searchRoutes.mockResolvedValue({
      data: [{ id: 1, source: 'Mumbai', destination: 'Pune', fare: 499.99, driverName: 'Ravi', agencyName: 'City Travels', vehicleType: 'Sedan' }],
    });
    const res = await request(app).get('/api/routes/search?source=Mumbai&destination=Pune');
    expect(res.status).toBe(200);
    const fare = res.body.data[0].fare;
    expect(typeof fare).toBe('number');
    expect(fare).toBe(499.99);
  });

  test('search API responds within 1 second — TEST-101', async () => {
    searchService.searchRoutes.mockResolvedValue({
      data: [{ id: 1, source: 'Mumbai', destination: 'Pune', fare: 500, driverName: 'Ravi', agencyName: 'City Travels', vehicleType: 'Sedan' }],
    });
    const start = Date.now();
    const res = await request(app).get('/api/routes/search?source=Mumbai&destination=Pune');
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(1000);
  });

  test('all core APIs should respond within 2 seconds — TEST-100', async () => {
    const jwtToken = require('jsonwebtoken').sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');
    searchService.searchRoutes.mockResolvedValue({ data: [] });

    const endpoints = [
      () => request(app).get('/api/routes/search?source=Mumbai&destination=Pune'),
      () => request(app).get('/api/health'),
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      await endpoint();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    }
  });
});
