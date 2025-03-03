const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Product = sequelize.define("product", {
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
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
  show_price: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  available: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  featured: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  orders: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  offerPrice: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  isOffer: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});
module.exports = Product;
