import * as Sentry from '@sentry/react-native';
import { logger } from './logger';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';

export function initSentry() {
  if (!SENTRY_DSN) {
    logger.warn('SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  if (ENVIRONMENT === 'development') {
    logger.info('Sentry disabled in development environment');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      // Performance Monitoring
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
      // Sessions tracking
      enableAutoSessionTracking: true,
      // Breadcrumbs
      maxBreadcrumbs: 50,
      // Filter out common non-errors
      beforeSend(event, hint) {
        const error = hint.originalException as any;

        // Don't send network errors that are expected
        if (error?.message?.includes('Network request failed')) {
          return null;
        }

        // Don't send 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return null;
        }

        return event;
      },
    });

    logger.info(`Sentry initialized for ${ENVIRONMENT} environment`);
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
}

export { Sentry };
