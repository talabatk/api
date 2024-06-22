const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Vendor = sequelize.define("vendor", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  status: {
    type: Sequelize.ENUM,
    values: ["open", "close", "busy", "soon"],
    allowNull: false,
    defaultValue: "open",
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  cover: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  delivery_time: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  direction: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  free_delivery_limit: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  distance: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

module.exports = Vendor;
