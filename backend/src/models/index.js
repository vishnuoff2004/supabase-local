const Sequelize = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging,
  pool: config.pool,
});

sequelize
  .authenticate()
  .then(() => console.log('MySQL connected successfully'))
  .catch((err) => console.error('MySQL connection failed:', err.message));

const db = {};

db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Agency = require('./Agency')(sequelize, Sequelize.DataTypes);
db.Driver = require('./Driver')(sequelize, Sequelize.DataTypes);
db.Route = require('./Route')(sequelize, Sequelize.DataTypes);
db.Booking = require('./Booking')(sequelize, Sequelize.DataTypes);
db.BookingStatusHistory = require('./BookingStatusHistory')(sequelize, Sequelize.DataTypes);
db.Notification = require('./Notification')(sequelize, Sequelize.DataTypes);
db.Announcement = require('./Announcement')(sequelize, Sequelize.DataTypes);
db.Event = require('./Event')(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
