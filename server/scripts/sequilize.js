const Sequelize = require("sequelize");
const config = require("../config");

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.user,
  password: config.db.pass,
})

module.exports = sequelize;
