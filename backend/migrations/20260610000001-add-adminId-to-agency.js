'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Agencies');
    if (!table.adminId) {
      await queryInterface.addColumn('Agencies', 'adminId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Agencies', 'adminId');
  },
};
