const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Banner = sequelize.define("adsBanner", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  discription: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM,
    values: ["disabled", "optional", "required"],
    defaultValue: "disabled",
  },
  image: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});
module.exports = Banner;
