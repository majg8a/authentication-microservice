"use strict";
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../scripts/sequilize");
class credentialsModel extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
}

credentialsModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user: {
      type: DataTypes.STRING,
      length: 25,
      allowNull: false,
      unique: true,
    },
    token: {
      type: DataTypes.STRING,
      unique: true,
    },
    tokenBirth: {
      type: DataTypes.DATE,
    },
    password: {
      type: DataTypes.STRING,
      length: 25,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "credentialModel",
    paranoid: true,
  }
);
module.exports = credentialsModel;
