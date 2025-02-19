const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Notification = sequelize.define("notification", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  seen: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  orderId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  topic: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
});

module.exports = Notification;
