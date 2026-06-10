'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Drivers', 'drivers_ibfk_2');
    await queryInterface.changeColumn('Drivers', 'agencyId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addConstraint('Drivers', {
      fields: ['agencyId'],
      type: 'foreign key',
      name: 'drivers_ibfk_2',
      references: { table: 'Agencies', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Drivers', 'drivers_ibfk_2');
    await queryInterface.changeColumn('Drivers', 'agencyId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.addConstraint('Drivers', {
      fields: ['agencyId'],
      type: 'foreign key',
      name: 'drivers_ibfk_2',
      references: { table: 'Agencies', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};
