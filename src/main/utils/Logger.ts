// ============================================================================
// BigDeck - Logger
// Centralized logging with file output and console formatting
// ============================================================================

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { CONFIG_DIR_NAME, LOGS_DIR_NAME } from '../../shared/constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private logger: winston.Logger;
  private logDir: string;

  constructor(level: LogLevel = 'info') {
    // Setup log directory
    const userDataPath = app?.getPath?.('userData') || process.env.HOME || '/tmp';
    this.logDir = path.join(userDataPath, CONFIG_DIR_NAME, LOGS_DIR_NAME);
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Create Winston logger
    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
          return stack ? `${base}\n${stack}` : base;
        })
      ),
      transports: [
        // Console output with colors
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `[${timestamp}] ${level}: ${message}`;
            })
          ),
        }),
        // File output
        new winston.transports.File({
          filename: path.join(this.logDir, 'bigdeck.log'),
          maxsize: 5 * 1024 * 1024, // 5MB
          maxFiles: 5,
          tailable: true,
        }),
        // Error-only file
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          maxsize: 5 * 1024 * 1024,
          maxFiles: 3,
        }),
      ],
    });
  }

  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(message, ...meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      this.logger.error(message, { stack: error.stack });
    } else if (error) {
      this.logger.error(`${message} - ${String(error)}`);
    } else {
      this.logger.error(message);
    }
  }

  setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  getLogPath(): string {
    return this.logDir;
  }
}
