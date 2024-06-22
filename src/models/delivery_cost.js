const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const DeliveryCost = sequelize.define("delivery_cost", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    }
});
module.exports = DeliveryCost;
