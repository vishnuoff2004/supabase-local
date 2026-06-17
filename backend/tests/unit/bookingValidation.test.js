const { validateCreateBooking } = require('../../src/validations/bookingValidation');

describe('validateCreateBooking', () => {
  test('should pass with valid data', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split('T')[0];

    const result = validateCreateBooking({
      routeId: 1,
      driverId: 1,
      seatCount: 2,
      travelDate: dateStr,
    });

    expect(result.error).toBeUndefined();
  });

  test('should fail if routeId is missing', () => {
    const result = validateCreateBooking({
      driverId: 1,
      seatCount: 2,
      travelDate: '2026-07-15',
    });

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toMatch(/route/i);
  });

  test('should fail if driverId is missing', () => {
    const result = validateCreateBooking({
      routeId: 1,
      seatCount: 2,
      travelDate: '2026-07-15',
    });

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toMatch(/driver/i);
  });

  test('should fail if seatCount is less than 1', () => {
    const result = validateCreateBooking({
      routeId: 1,
      driverId: 1,
      seatCount: 0,
      travelDate: '2026-07-15',
    });

    expect(result.error).toBeDefined();
  });

  test('should fail if seatCount is not an integer', () => {
    const result = validateCreateBooking({
      routeId: 1,
      driverId: 1,
      seatCount: 1.5,
      travelDate: '2026-07-15',
    });

    expect(result.error).toBeDefined();
  });

  test('should fail if travelDate is in the past', () => {
    const result = validateCreateBooking({
      routeId: 1,
      driverId: 1,
      seatCount: 2,
      travelDate: '2020-01-01',
    });

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toMatch(/past/i);
  });
});
