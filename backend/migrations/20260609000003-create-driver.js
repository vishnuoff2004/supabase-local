'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Drivers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      agencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Agencies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicleType: {
        type: Sequelize.ENUM('Sedan', 'SUV', 'Hatchback', 'Van', 'Bus'),
        allowNull: false,
      },
      vehicleReg: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      licenseNo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Drivers');
  },
};
