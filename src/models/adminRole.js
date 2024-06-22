const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const AdminRole = sequelize.define("adminRole", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    manage_orders: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    manage_products: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    manage_admins: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    manage_deliveries: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    manage_vendors: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

module.exports = AdminRole;
