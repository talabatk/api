const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const OrderTimeLine = sequelize.define("orderTimeLine", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  content: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastStatus: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
});
module.exports = OrderTimeLine;
