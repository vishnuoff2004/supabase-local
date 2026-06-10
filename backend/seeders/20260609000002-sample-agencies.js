'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Agencies', [
      {
        id: 1,
        name: 'City Travels Pvt Ltd',
        email: 'citytravels@example.com',
        phone: '8888888888',
        active: true,
        createdBy: 1,
        adminId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Highway Express',
        email: 'highway@example.com',
        phone: '8888888887',
        active: true,
        createdBy: 1,
        adminId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Agencies', null, {});
  },
};
