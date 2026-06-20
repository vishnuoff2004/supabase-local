const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/searchService');
jest.mock('../../src/services/bookingService');

const app = require('../../src/app');
const searchService = require('../../src/services/searchService');
const bookingService = require('../../src/services/bookingService');

const travelerToken = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');

// Increase default timeout for load/concurrency tests
jest.setTimeout(60000);

describe('Concurrency Load Tests (TEST-102 & TEST-103)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1000 concurrent search requests — TEST-102', async () => {
    searchService.searchRoutes.mockResolvedValue({
      data: [{ id: 1, source: 'Mumbai', destination: 'Pune', fare: 500, driverName: 'Ravi', agencyName: 'City Travels', vehicleType: 'Sedan' }],
    });

    const requests = Array.from({ length: 1000 }, () =>
      request(app).get('/api/routes/search?source=Mumbai&destination=Pune')
    );

    const start = Date.now();
    const responses = await Promise.all(requests);
    const elapsed = Date.now() - start;

    console.log(`TEST-102 completed 1000 requests in ${elapsed}ms`);

    responses.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
    
    // Concurrency load check
    expect(elapsed).toBeLessThan(60000);
  });

  test('1000 concurrent booking requests — TEST-103', async () => {
    bookingService.createBooking.mockResolvedValue({ id: 1, status: 'Pending', userId: 1, routeId: 1, seatCount: 2, travelDate: '2026-07-15' });

    const requests = Array.from({ length: 1000 }, () =>
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${travelerToken}`)
        .send({ routeId: 1, driverId: 1, seatCount: 2, travelDate: '2026-07-15' })
    );

    const start = Date.now();
    const responses = await Promise.all(requests);
    const elapsed = Date.now() - start;

    console.log(`TEST-103 completed 1000 requests in ${elapsed}ms`);

    responses.forEach(res => {
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('status', 'Pending');
    });

    // Concurrency load check
    expect(elapsed).toBeLessThan(60000);
  });
});
