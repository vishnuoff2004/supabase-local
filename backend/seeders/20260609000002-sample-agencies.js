'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Agencies', [
      {
        name: 'City Travels Pvt Ltd',
        email: 'citytravels@example.com',
        phone: '8888888888',
        active: true,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Highway Express',
        email: 'highway@example.com',
        phone: '8888888887',
        active: true,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Agencies', null, {});
  },
};
