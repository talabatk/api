const fs = require("fs");
const os = require("os");
const winston = require("winston");

const isWindows = os.platform() === "win32";

// Create a safe logs directory if you want file logs
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

const Logger = winston.createLogger({
  level: "error", // ✅ only log errors
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
  transports: [
    // ✅ Always log errors to console
    new winston.transports.Console({ level: "error" }),

    // ✅ Also log to file if not in Windows (optional)
    !isWindows &&
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
      }),
  ].filter(Boolean),
});

module.exports = Logger;

// const fs = require("fs");
// const os = require("os");
// const winston = require("winston");

// const isWindows = os.platform() === "win32";

// const Logger = winston.createLogger({
//   level: "silly", // log everything (silly < debug < verbose < info < warn < error)
//   format: winston.format.combine(
//     winston.format.errors({ stack: true }), // capture stack trace for errors
//     winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
//     winston.format.colorize({ all: true }),
//     winston.format.printf((info) => {
//       // Include stack trace if present
//       if (info.stack) {
//         return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
//       }
//       return `${info.timestamp} ${info.level}: ${info.message}`;
//     })
//   ),
//   transports: [
//     // Always log to console
//     new winston.transports.Console(),
//     // Also log to a file for persistent records
//     new winston.transports.File({
//       filename: "app.log",
//       level: "silly", // log everything to file
//     }),
//   ],
// });

// module.exports = Logger;
