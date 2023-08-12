const Sequelize = require("sequelize");

const sequelize = new Sequelize({
  host: "talabatek.cataddxqm8fj.eu-north-1.rds.amazonaws.com",
  port: "3306",
  database: "talabatek",
  username: "admin",
  password: "talabatek",
  dialect: "mysql",
});

module.exports = sequelize;
