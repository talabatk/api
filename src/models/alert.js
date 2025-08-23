const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Alert = sequelize.define("alert", {
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
  content: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  discription: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  image: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  status: {
    type: Sequelize.ENUM,
    values: ["disabled", "optional", "required"],
    defaultValue: "disabled",
  },
});
module.exports = Alert;
