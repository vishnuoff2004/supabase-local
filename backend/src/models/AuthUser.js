const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuthUser extends Model {
    static associate(models) {
      AuthUser.hasOne(models.User, { foreignKey: 'supabaseUid', sourceKey: 'id' });
    }
  }

  AuthUser.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'AuthUser',
      tableName: 'users',
      schema: 'auth',
      timestamps: false,
    }
  );

  return AuthUser;
};
