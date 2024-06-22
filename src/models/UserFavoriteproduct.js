const Sequelize = require("sequelize");

const sequelize = require("../util/database");
// define a new model for the junction table

const UserFavoriteProduct = sequelize.define("user_favorite_product", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

module.exports = UserFavoriteProduct;
