const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const OptionGroup = sequelize.define("options_group", {
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
});
module.exports = OptionGroup;
