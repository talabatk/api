const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const VendorCategories = sequelize.define("vendorCategories", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});
module.exports = VendorCategories;
