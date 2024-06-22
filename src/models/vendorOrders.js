const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const VendorOrder = sequelize.define("vendor_order", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    status: {
        type: Sequelize.ENUM,
        values: ["not started", "started", "preparing", "in the way", "complete"],
        defaultValue: "not started"
    }
});
module.exports = VendorOrder;
