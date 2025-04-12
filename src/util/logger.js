const fs = require("fs");
const os = require("os");
const winston = require("winston");

const isWindows = os.platform() === "win32";

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
    // Use null stream only on non-Windows systems
    !isWindows
      ? new winston.transports.Stream({
          stream: fs.createWriteStream("/dev/null"),
        })
      : new winston.transports.Console(),
  ],
});

module.exports = Logger;
