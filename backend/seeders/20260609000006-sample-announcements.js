'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Announcements', [
      {
        title: 'Welcome to Travel Agency Platform',
        body: 'We are excited to launch our new booking platform. Enjoy seamless travel booking!',
        type: 'info',
        active: true,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Holiday Schedule',
        body: 'Services will be limited during the upcoming holiday weekend. Please plan accordingly.',
        type: 'warning',
        active: true,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Announcements', null, {});
  },
};
