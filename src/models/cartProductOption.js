const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const CartProductOption = sequelize.define("cart_product_option", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});
module.exports = CartProductOption;
