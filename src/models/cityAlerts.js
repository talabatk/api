const Sequelize = require("sequelize");

const sequelize = require("../util/database");
// define a new model for the junction table

const CityAlerts = sequelize.define("city_alerts", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
});

module.exports = CityAlerts;
