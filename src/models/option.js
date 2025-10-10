const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Option = sequelize.define("option", {
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
  value: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  generalOption: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  image: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue:
      "https://talabatk-bucket.fra1.digitaloceanspaces.com/uploads/images/image-1753454792684-542321227.png",
  },
});
module.exports = Option;
