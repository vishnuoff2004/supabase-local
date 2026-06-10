'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Drivers', 'agencyId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Agencies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.changeColumn('Drivers', 'vehicleType', {
      type: Sequelize.ENUM('Sedan', 'SUV', 'Hatchback', 'Van', 'Bus'),
      allowNull: true,
    });
    await queryInterface.changeColumn('Drivers', 'vehicleReg', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('Drivers', 'licenseNo', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Drivers', 'agencyId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Agencies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.changeColumn('Drivers', 'vehicleType', {
      type: Sequelize.ENUM('Sedan', 'SUV', 'Hatchback', 'Van', 'Bus'),
      allowNull: false,
    });
    await queryInterface.changeColumn('Drivers', 'vehicleReg', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('Drivers', 'licenseNo', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
