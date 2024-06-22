const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const ProductImage = sequelize.define("productImage", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    image: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = ProductImage;
