const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingStatusHistory extends Model {
    static associate(models) {
      BookingStatusHistory.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  BookingStatusHistory.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      bookingId: { type: DataTypes.INTEGER, allowNull: false },
      fromStatus: { type: DataTypes.STRING, allowNull: true },
      toStatus: { type: DataTypes.STRING, allowNull: false },
      changedBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { sequelize, modelName: 'BookingStatusHistory', timestamps: true }
  );

  return BookingStatusHistory;
};
