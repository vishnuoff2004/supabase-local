'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await queryInterface.bulkInsert('Events', [
      {
        title: 'Travel Expo 2026',
        description: 'Annual travel exhibition with special discounts on bookings.',
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        location: 'Bangalore Convention Center',
        organizerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Safety Workshop',
        description: 'Mandatory safety training for all drivers and agency staff.',
        startDate: nextMonth,
        endDate: new Date(nextMonth.getTime() + 1 * 24 * 60 * 60 * 1000),
        location: 'City Travels Office, Bangalore',
        organizerId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Events', null, {});
  },
};
