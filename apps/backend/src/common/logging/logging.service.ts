import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get('LOG_LEVEL') || 'info';
    const logDir = this.configService.get('LOG_DIR') || 'logs';

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'devin-ai' },
      transports: [
        // Write all logs to console
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const ctx = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
              return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
            }),
          ),
        }),
        // Write all logs to file
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
        }),
        // Separate file for task execution logs
        new winston.transports.File({
          filename: path.join(logDir, 'tasks.log'),
          level: 'info',
        }),
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'exceptions.log'),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'rejections.log'),
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, {
      trace,
      context: context || this.context,
    });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  // Custom methods for structured logging
  logTaskEvent(taskId: string, event: string, metadata?: any) {
    this.logger.info('Task event', {
      taskId,
      event,
      ...metadata,
      context: 'TaskExecution',
    });
  }

  logPerformance(operation: string, duration: number, metadata?: any) {
    this.logger.info('Performance metric', {
      operation,
      duration,
      ...metadata,
      context: 'Performance',
    });
  }

  logSecurityEvent(event: string, metadata?: any) {
    this.logger.warn('Security event', {
      event,
      ...metadata,
      context: 'Security',
    });
  }

  logAPICall(method: string, path: string, statusCode: number, duration: number) {
    this.logger.info('API call', {
      method,
      path,
      statusCode,
      duration,
      context: 'API',
    });
  }
}
