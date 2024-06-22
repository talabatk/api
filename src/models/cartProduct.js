const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const CartProduct = sequelize.define("cart_product", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    notes: {
        type: Sequelize.STRING,
        allowNull: true
    },
    subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    ordered: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    vendorId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});
module.exports = CartProduct;
