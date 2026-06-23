const path = require('path');
const fs = require('fs');

describe('REQ-031, REQ-033 — Database Structure (TEST-104, TEST-107, TEST-108)', () => {
  const modelsDir = path.join(__dirname, '../../src/models');
  const configDir = path.join(__dirname, '../../src/config');

  test('should have config directory', () => {
    expect(fs.existsSync(configDir)).toBe(true);
  });

  test('should have database config file (config/database.js)', () => {
    expect(fs.existsSync(path.join(configDir, 'database.js'))).toBe(true);
  });

  test('should have models directory', () => {
    expect(fs.existsSync(modelsDir)).toBe(true);
  });

  const expectedModels = ['User', 'Agency', 'Driver', 'Route', 'Booking', 'BookingStatusHistory'];

  expectedModels.forEach(modelName => {
    test(`should have ${modelName} model file`, () => {
      expect(fs.existsSync(path.join(modelsDir, `${modelName}.js`))).toBe(true);
    });
  });

  test('should have index file that exports all models', () => {
    expect(fs.existsSync(path.join(modelsDir, 'index.js'))).toBe(true);
  });

  test('models index should export named models (User, Agency, Driver, Route, Booking, BookingStatusHistory)', () => {
    const indexPath = path.join(modelsDir, 'index.js');
    expect(fs.existsSync(indexPath)).toBe(true);
    const db = require(indexPath);
    expect(db.User).toBeDefined();
    expect(db.Agency).toBeDefined();
    expect(db.Driver).toBeDefined();
    expect(db.Route).toBeDefined();
    expect(db.Booking).toBeDefined();
    expect(db.BookingStatusHistory).toBeDefined();
  });

  test('models index should export sequelize instance', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.sequelize).toBeDefined();
    expect(db.Sequelize).toBeDefined();
  });

  test('User model should have email virtual field and role enum', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    const User = db.User;
    expect(User.rawAttributes.email.type.key).toBe('VIRTUAL');
    expect(User.rawAttributes.role.type.values).toContain('traveler');
    expect(User.rawAttributes.role.type.values).toContain('admin');
  });

  test('Agency model should have email unique constraint and createdBy FK', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    const Agency = db.Agency;
    expect(Agency.rawAttributes.email.unique).toBe(true);
    expect(Agency.rawAttributes.createdBy).toBeDefined();
  });

  test('Driver model should have unique constraints on userId and vehicleReg', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    const Driver = db.Driver;
    expect(Driver.rawAttributes.userId.unique).toBe(true);
    expect(Driver.rawAttributes.vehicleReg.unique).toBe(true);
  });

  test('Route model should have fare (DECIMAL) and capacity fields', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    const Route = db.Route;
    expect(Route.rawAttributes.fare.type.key).toBe('DECIMAL');
    expect(Route.rawAttributes.capacity).toBeDefined();
  });

  test('Booking model should have status enum with all valid states', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    const Booking = db.Booking;
    expect(Booking.rawAttributes.status.type.values).toEqual(
      expect.arrayContaining(['Pending', 'Confirmed', 'On Trip', 'Completed', 'Cancelled'])
    );
  });

  test('BookingStatusHistory model should track fromStatus, toStatus, and changedBy', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    const BSH = db.BookingStatusHistory;
    expect(BSH.rawAttributes.fromStatus).toBeDefined();
    expect(BSH.rawAttributes.toStatus).toBeDefined();
    expect(BSH.rawAttributes.changedBy).toBeDefined();
  });

  test('User hasOne Driver association', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.User.associations.Driver).toBeDefined();
    expect(db.User.associations.Driver.associationType).toBe('HasOne');
  });

  test('Agency hasMany Drivers association', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.Agency.associations.Drivers).toBeDefined();
    expect(db.Agency.associations.Drivers.associationType).toBe('HasMany');
  });

  test('Driver belongsTo User and Agency', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.Driver.associations.User).toBeDefined();
    expect(db.Driver.associations.User.associationType).toBe('BelongsTo');
    expect(db.Driver.associations.Agency).toBeDefined();
  });

  test('Driver hasMany Routes and Bookings', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.Driver.associations.Routes).toBeDefined();
    expect(db.Driver.associations.Routes.associationType).toBe('HasMany');
    expect(db.Driver.associations.Bookings).toBeDefined();
  });

  test('Route belongsTo Driver', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.Route.associations.Driver).toBeDefined();
  });

  test('Booking belongsTo User, Route, and Driver', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.Booking.associations.User).toBeDefined();
    expect(db.Booking.associations.Route).toBeDefined();
    expect(db.Booking.associations.Driver).toBeDefined();
    expect(db.Booking.associations.BookingStatusHistories).toBeDefined();
  });

  test('BookingStatusHistory belongsTo Booking', () => {
    const db = require(path.join(modelsDir, 'index.js'));
    expect(db.BookingStatusHistory.associations.Booking).toBeDefined();
  });
});
