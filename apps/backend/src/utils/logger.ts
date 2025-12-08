/**
 * Production-ready logging utility for backend
 * Integrates with NestJS Logger and can send to external services
 */

import { Logger as NestLogger } from '@nestjs/common';

type LogLevel = 'debug' | 'log' | 'warn' | 'error';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

class ApplicationLogger {
  private nestLogger: NestLogger;
  private context: string;

  constructor(context?: string) {
    this.context = context || 'Application';
    this.nestLogger = new NestLogger(this.context);
  }

  /**
   * Debug-level logging (disabled in production)
   */
  debug(message: string, context?: string) {
    if (!IS_PRODUCTION) {
      this.nestLogger.debug(message, context);
    }
  }

  /**
   * Info-level logging
   */
  log(message: string, context?: string) {
    this.nestLogger.log(message, context);
  }

  /**
   * Warning-level logging
   */
  warn(message: string, context?: string) {
    this.nestLogger.warn(message, context);
  }

  /**
   * Error-level logging
   * Always logged, can integrate with error tracking
   */
  error(message: string, trace?: string, context?: string) {
    this.nestLogger.error(message, trace, context);

    // In production, send to Sentry
    if (IS_PRODUCTION) {
      try {
        // Lazy-load Sentry to avoid errors if not configured
        const Sentry = require('@sentry/nestjs');

        // Create error object with stack trace
        const error = new Error(message);
        if (trace) {
          error.stack = trace;
        }

        // Capture to Sentry with context
        Sentry.captureException(error, {
          tags: {
            context: context || this.context,
          },
          level: 'error',
        });
      } catch (err) {
        // Sentry not available - fail gracefully
        this.nestLogger.warn('Sentry not available for error tracking');
      }
    }
  }

  /**
   * Create a child logger with specific context
   */
  withContext(context: string): ApplicationLogger {
    return new ApplicationLogger(context);
  }

  /**
   * Capture exception with full error object
   * Use this when you have an actual Error instance
   */
  captureException(exception: Error, context?: string, extra?: Record<string, any>) {
    this.nestLogger.error(exception.message, exception.stack, context);

    if (IS_PRODUCTION) {
      try {
        const Sentry = require('@sentry/nestjs');
        Sentry.captureException(exception, {
          tags: {
            context: context || this.context,
          },
          extra,
        });
      } catch (err) {
        // Sentry not available - fail gracefully
      }
    }
  }

  /**
   * Capture a critical message that needs attention
   * These will be sent to Sentry even if not errors
   */
  critical(message: string, context?: string, extra?: Record<string, any>) {
    this.nestLogger.error(`[CRITICAL] ${message}`, '', context);

    if (IS_PRODUCTION) {
      try {
        const Sentry = require('@sentry/nestjs');
        Sentry.captureMessage(message, {
          level: 'fatal',
          tags: {
            context: context || this.context,
          },
          extra,
        });
      } catch (err) {
        // Sentry not available - fail gracefully
      }
    }
  }
}

// Export singleton instance
export const logger = new ApplicationLogger();

// Export class for creating contextual loggers
export { ApplicationLogger };
