'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Drivers', [
      {
        userId: 3,
        agencyId: 1,
        name: 'Driver User',
        phone: '9999999997',
        vehicleType: 'Sedan',
        vehicleReg: 'KA-01-AB-1234',
        licenseNo: 'DL-123456789',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 6,
        agencyId: 2,
        name: 'Ramesh Kumar',
        phone: '8888888881',
        vehicleType: 'SUV',
        vehicleReg: 'KA-02-CD-5678',
        licenseNo: 'DL-987654321',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Drivers', null, {});
  },
};
