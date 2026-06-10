const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Driver, { foreignKey: 'userId' });
      User.hasMany(models.Booking, { foreignKey: 'userId' });
      User.hasOne(models.Agency, { foreignKey: 'adminId', as: 'managedAgency' });
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM('traveler', 'driver', 'agency_admin', 'admin'),
        defaultValue: 'traveler',
      },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
      lockedUntil: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'User', timestamps: true }
  );

  return User;
};
