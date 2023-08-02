const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Delivery = sequelize.define("delivery", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});

module.exports = Delivery;
