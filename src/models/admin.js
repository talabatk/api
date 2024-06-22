const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Admin = sequelize.define("admin", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    super_admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

module.exports = Admin;
