const Sequelize = require("sequelize");

const sequelize = require("../util/database");
// define a new model for the junction table

const UserNotification = sequelize.define("user_notification", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    }
});

module.exports = UserNotification;
