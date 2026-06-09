'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 2);

    await queryInterface.bulkInsert('Bookings', [
      {
        userId: 4,
        routeId: 1,
        driverId: 1,
        seatCount: 2,
        travelDate: travelDate.toISOString().split('T')[0],
        status: 'Confirmed',
        cancelReason: null,
        cancelledBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 5,
        routeId: 1,
        driverId: 1,
        seatCount: 1,
        travelDate: travelDate.toISOString().split('T')[0],
        status: 'Pending',
        cancelReason: null,
        cancelledBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 4,
        routeId: 2,
        driverId: 1,
        seatCount: 3,
        travelDate: travelDate.toISOString().split('T')[0],
        status: 'Completed',
        cancelReason: null,
        cancelledBy: null,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        userId: 5,
        routeId: 3,
        driverId: 2,
        seatCount: 2,
        travelDate: travelDate.toISOString().split('T')[0],
        status: 'Cancelled',
        cancelReason: 'Change of plans',
        cancelledBy: 5,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Bookings', null, {});
  },
};
