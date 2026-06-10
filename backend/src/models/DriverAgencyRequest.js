const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DriverAgencyRequest extends Model {
    static associate(models) {
      DriverAgencyRequest.belongsTo(models.Driver, { foreignKey: 'driverId' });
      DriverAgencyRequest.belongsTo(models.Agency, { foreignKey: 'agencyId' });
    }
  }

  DriverAgencyRequest.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      driverId: { type: DataTypes.INTEGER, allowNull: false },
      agencyId: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('Pending', 'Accepted', 'Denied'),
        defaultValue: 'Pending',
      },
      message: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'DriverAgencyRequest', timestamps: true }
  );

  return DriverAgencyRequest;
};
