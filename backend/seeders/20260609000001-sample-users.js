'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [
      { id: 1, name: 'Admin User', email: 'admin123@gmail.com', phone: '9999999999', role: 'admin', active: true, isVerified: true, password: '', otpCode: null, otpExpiry: null, loginAttempts: 0, lockedUntil: null, supabaseUid: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Agency Admin', email: 'agency@example.com', phone: '9999999998', role: 'agency_admin', active: true, isVerified: true, password: '', otpCode: null, otpExpiry: null, loginAttempts: 0, lockedUntil: null, supabaseUid: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Driver User', email: 'driver@example.com', phone: '9999999997', role: 'driver', active: true, isVerified: true, password: '', otpCode: null, otpExpiry: null, loginAttempts: 0, lockedUntil: null, supabaseUid: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Traveler One', email: 'traveler@example.com', phone: '9999999996', role: 'traveler', active: true, isVerified: true, password: '', otpCode: null, otpExpiry: null, loginAttempts: 0, lockedUntil: null, supabaseUid: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: 'Traveler Two', email: 'traveler2@example.com', phone: '9999999995', role: 'traveler', active: true, isVerified: true, password: '', otpCode: null, otpExpiry: null, loginAttempts: 0, lockedUntil: null, supabaseUid: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: 'Ramesh Kumar', email: 'ramesh@example.com', phone: '8888888881', role: 'driver', active: true, isVerified: true, password: '', otpCode: null, otpExpiry: null, loginAttempts: 0, lockedUntil: null, supabaseUid: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
