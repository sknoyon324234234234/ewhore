import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`
  )
);

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({ filename: path.join(process.cwd(), 'logs', 'error.log'), level: 'error' }),
    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: path.join(process.cwd(), 'logs', 'combined.log') }),
  ],
});

// If we're not in production then log to the `console` with the format:
if (process.env.NODE_ENV !== 'production' || true) { // Always log to console for Hostinger logs
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

export default logger;
