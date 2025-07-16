const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Otp = sequelize.define("otp", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true, // تأكد أن رقم الهاتف فريد لتحديثه بدلاً من التكرار
  },
  otp: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});
module.exports = Otp;
