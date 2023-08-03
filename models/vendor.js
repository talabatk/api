const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Vendor = sequelize.define("vendor", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  open: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

module.exports = Vendor;
