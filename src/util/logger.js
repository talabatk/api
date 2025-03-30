const winston = require("winston");

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    let message = `${info.timestamp} ${info.level}: ${info.message}`;
    if (info.stack) {
      message += `\n\n------------------------------\n\n${info.stack}`;
    }
    message +=
      "\n\n------------------------------------------------------------------------------------------\n";
    return message;
  })
);

// Only Console Transport (No File Logging)
const transports = [new winston.transports.Console()];

const Logger = winston.createLogger({
  level: "debug",
  levels,
  format,
  transports,
});

module.exports = Logger;
