const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const VendorCategory = sequelize.define("vendor_category", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  products_number: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = VendorCategory;
