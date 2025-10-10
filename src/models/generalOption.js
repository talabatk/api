const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const GeneralOption = sequelize.define("generalOption", {
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
});
module.exports = GeneralOption;
