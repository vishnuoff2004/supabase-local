'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing FK constraint dynamically by looking up its name
    const constraints = await queryInterface.getForeignKeyReferencesForTable('Drivers');
    const agencyFk = constraints.find(c => c.columnName === 'agencyId');
    if (agencyFk) {
      await queryInterface.removeConstraint('Drivers', agencyFk.constraintName);
    }

    await queryInterface.changeColumn('Drivers', 'agencyId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('Drivers', {
      fields: ['agencyId'],
      type: 'foreign key',
      name: 'drivers_agencyId_fkey',
      references: { table: 'Agencies', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    const constraints = await queryInterface.getForeignKeyReferencesForTable('Drivers');
    const agencyFk = constraints.find(c => c.columnName === 'agencyId');
    if (agencyFk) {
      await queryInterface.removeConstraint('Drivers', agencyFk.constraintName);
    }

    await queryInterface.changeColumn('Drivers', 'agencyId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addConstraint('Drivers', {
      fields: ['agencyId'],
      type: 'foreign key',
      name: 'drivers_agencyId_fkey',
      references: { table: 'Agencies', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};
