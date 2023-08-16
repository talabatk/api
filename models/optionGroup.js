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
  type: {
    type: Sequelize.ENUM,
    values: ["single", "multi"],
    allowNull: false,
    defaultValue: "single",
  },
});
module.exports = OptionGroup;
