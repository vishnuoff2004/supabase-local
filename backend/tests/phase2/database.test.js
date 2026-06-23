const path = require('path');
const fs = require('fs');

describe('Phase 2 Database — Notification Model', () => {
  test('Notification model file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '../../src/models/Notification.js'))).toBe(true);
  });

  test('models/index.js exports Notification', () => {
    const models = require('../../src/models');
    expect(models.Notification).toBeDefined();
  });

  test('Notification model has expected fields', () => {
    const Sequelize = require('sequelize');
    const sequelize = new Sequelize({ dialect: 'postgres', logging: false });
    const Notification = require('../../src/models/Notification')(sequelize, Sequelize.DataTypes);
    expect(Notification.rawAttributes).toHaveProperty('id');
    expect(Notification.rawAttributes).toHaveProperty('userId');
    expect(Notification.rawAttributes).toHaveProperty('type');
    expect(Notification.rawAttributes).toHaveProperty('title');
    expect(Notification.rawAttributes).toHaveProperty('body');
    expect(Notification.rawAttributes).toHaveProperty('data');
    expect(Notification.rawAttributes).toHaveProperty('isRead');
  });

  test('Notification type field is ENUM with info/booking/alert', () => {
    const Sequelize = require('sequelize');
    const sequelize = new Sequelize({ dialect: 'postgres', logging: false });
    const Notification = require('../../src/models/Notification')(sequelize, Sequelize.DataTypes);
    const typeAttr = Notification.rawAttributes.type;
    expect(typeAttr.type).toBeInstanceOf(Sequelize.ENUM);
    expect(typeAttr.type.values).toEqual(['info', 'booking', 'alert']);
  });

  test('Notification model has tableName notifications', () => {
    const Sequelize = require('sequelize');
    const sequelize = new Sequelize({ dialect: 'postgres', logging: false });
    const Notification = require('../../src/models/Notification')(sequelize, Sequelize.DataTypes);
    expect(Notification.tableName).toBe('notifications');
  });

  test('Notification model has associate method', () => {
    const Sequelize = require('sequelize');
    const sequelize = new Sequelize({ dialect: 'postgres', logging: false });
    const Notification = require('../../src/models/Notification')(sequelize, Sequelize.DataTypes);
    expect(Notification.associate).toBeDefined();
    expect(typeof Notification.associate).toBe('function');
  });
});
