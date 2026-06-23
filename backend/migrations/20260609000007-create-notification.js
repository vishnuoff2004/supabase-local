'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const exists = tableInfo[0].exists;

    if (!exists) {
      await queryInterface.createTable('notifications', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        type: {
          type: Sequelize.ENUM('info', 'booking', 'alert'),
          defaultValue: 'info',
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        data: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        is_read: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      await queryInterface.addIndex('notifications', ['user_id', 'created_at'], {
        name: 'idx_notifications_user_created',
      });
      await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
        name: 'idx_notifications_user_read',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
  },
};
