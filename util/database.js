const Sequelize = require("sequelize");

const sequelize = new Sequelize({
  host: "talabatekdb.cataddxqm8fj.eu-north-1.rds.amazonaws.com",
  port: "3306",
  database: "talabatek",
  username: "admin",
  password: "talabatek",
  dialect: "mysql",
  timezone: "Asia/Gaza",
});

module.exports = sequelize;
