'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface) => {
    const hash = await bcrypt.hash('Password@123', 10);
    const adminHash = await bcrypt.hash('Admin123', 10);

    await queryInterface.bulkInsert('Users', [
      {
        name: 'Admin User',
        email: 'admin123@gmail.com',
        password: adminHash,
        phone: '9999999999',
        role: 'admin',
        active: true,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Agency Admin',
        email: 'agency@example.com',
        password: hash,
        phone: '9999999998',
        role: 'agency_admin',
        active: true,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Driver User',
        email: 'driver@example.com',
        password: hash,
        phone: '9999999997',
        role: 'driver',
        active: true,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Traveler One',
        email: 'traveler@example.com',
        password: hash,
        phone: '9999999996',
        role: 'traveler',
        active: true,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Traveler Two',
        email: 'traveler2@example.com',
        password: hash,
        phone: '9999999995',
        role: 'traveler',
        active: true,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Ramesh Kumar',
        email: 'ramesh@example.com',
        password: hash,
        phone: '8888888881',
        role: 'driver',
        active: true,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
