/**
 * Production-ready logging utility for backend
 * Integrates with NestJS Logger and can send to external services
 */

import { Logger as NestLogger } from '@nestjs/common';

type LogLevel = 'debug' | 'log' | 'warn' | 'error';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

class ApplicationLogger {
  private nestLogger: NestLogger;

  constructor(context?: string) {
    this.nestLogger = new NestLogger(context || 'Application');
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

    // In production, send to Sentry or similar
    if (IS_PRODUCTION) {
      // TODO: Send to Sentry when configured
    }
  }

  /**
   * Create a child logger with specific context
   */
  withContext(context: string): ApplicationLogger {
    return new ApplicationLogger(context);
  }
}

// Export singleton instance
export const logger = new ApplicationLogger();

// Export class for creating contextual loggers
export { ApplicationLogger };
