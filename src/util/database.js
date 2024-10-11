const Sequelize = require("sequelize");
const { configDotenv } = require("dotenv");
const Logger = require("./logger");

configDotenv();

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialect: process.env.DB_DIALECT,
    timezone: process.env.DB_TIMEZONE,
    logging: (msg) => Logger.debug(msg)
});

module.exports = sequelize;
