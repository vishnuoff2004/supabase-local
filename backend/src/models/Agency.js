const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Agency extends Model {
    static associate(models) {
      Agency.hasMany(models.Driver, { foreignKey: 'agencyId' });
      Agency.belongsTo(models.User, { foreignKey: 'adminId', as: 'admin' });
    }
  }

  Agency.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      phone: { type: DataTypes.STRING, allowNull: false },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      adminId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { sequelize, modelName: 'Agency', timestamps: true }
  );

  return Agency;
};
