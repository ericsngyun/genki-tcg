/**
 * Production-ready logging utility for mobile app
 * Automatically disabled in production builds
 */

const IS_DEV = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const config: LoggerConfig = {
  enabled: IS_DEV,
  minLevel: 'debug',
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!config.enabled) return false;
    return levelPriority[level] >= levelPriority[config.minLevel];
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log('[INFO]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
      // In production, could send to error tracking service (Sentry)
    }
  }

  // Special case for API errors
  apiError(endpoint: string, error: any) {
    this.error(`API Error [${endpoint}]:`, error);
  }

  // Special case for navigation errors
  navError(screen: string, error: any) {
    this.error(`Navigation Error [${screen}]:`, error);
  }
}

export const logger = new Logger();

// Export individual methods for convenience
export const { debug, info, warn, error } = logger;
