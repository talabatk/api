const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Category = sequelize.define("category", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  image: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  order: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});
module.exports = Category;
