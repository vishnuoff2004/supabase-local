'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dep1 = new Date(tomorrow);
    dep1.setHours(8, 0, 0, 0);
    const arr1 = new Date(tomorrow);
    arr1.setHours(12, 0, 0, 0);

    const dep2 = new Date(tomorrow);
    dep2.setHours(14, 0, 0, 0);
    const arr2 = new Date(tomorrow);
    arr2.setHours(18, 0, 0, 0);

    await queryInterface.bulkInsert('Routes', [
      {
        driverId: 1,
        source: 'Bangalore',
        destination: 'Mysore',
        departureTime: dep1,
        arrivalTime: arr1,
        fare: 500.00,
        capacity: 4,
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        driverId: 1,
        source: 'Bangalore',
        destination: 'Chennai',
        departureTime: dep2,
        arrivalTime: arr2,
        fare: 1200.00,
        capacity: 4,
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        driverId: 2,
        source: 'Mumbai',
        destination: 'Pune',
        departureTime: dep1,
        arrivalTime: arr1,
        fare: 800.00,
        capacity: 6,
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Routes', null, {});
  },
};
