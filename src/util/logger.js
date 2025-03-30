const winston = require("winston");

const Logger = winston.createLogger({
  level: "error", // Only log errors in production
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.Stream({
      stream: require("fs").createWriteStream("/dev/null"),
    }),
  ],
});

module.exports = Logger;
