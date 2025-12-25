import { Logger as WinstonLogger } from 'winston';
import { createLogger, format, transports } from 'winston';

/**
 * iCrawler Logger
 * 基于Winston的日志系统，专门为浏览器自动化优化
 */
export class Logger {
  private static instance: WinstonLogger;

  static getInstance(): WinstonLogger {
    if (!Logger.instance) {
      Logger.instance = createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level}]: ${message}${stack ? `\n${stack}` : ''}`;
          })
        ),
        transports: [
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.simple()
            )
          }),
          new transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
          }),
          new transports.File({ 
            filename: 'logs/combined.log' 
          })
        ]
      });

      // 在生产环境中不输出到控制台
      if (process.env.NODE_ENV === 'production') {
        Logger.instance.remove(Logger.instance.transports[0]);
      }
    }

    return Logger.instance;
  }

  static info(message: string, meta?: any) {
    this.getInstance().info(message, meta);
  }

  static error(message: string, error?: any) {
    this.getInstance().error(message, error);
  }

  static warn(message: string, meta?: any) {
    this.getInstance().warn(message, meta);
  }

  static debug(message: string, meta?: any) {
    this.getInstance().debug(message, meta);
  }

  static verbose(message: string, meta?: any) {
    this.getInstance().verbose(message, meta);
  }
}