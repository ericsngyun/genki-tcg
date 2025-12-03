// Import this file FIRST in main.ts before any other imports
import * as Sentry from '@sentry/nestjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Only initialize Sentry in production or staging
if (SENTRY_DSN && ENVIRONMENT !== 'development') {
  // Dynamically import profiling integration to avoid requiring the package in development
  let integrations: any[] = [];

  try {
    // Optional: Profiling integration (requires @sentry/profiling-node package)
    // Install with: npm install --save @sentry/profiling-node
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');
    integrations.push(nodeProfilingIntegration());
  } catch (error) {
    // Profiling package not installed - continue without it
    console.log('Sentry profiling not available (optional)');
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    integrations,
    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    // Error filtering
    beforeSend(event, hint) {
      // Don't send validation errors (400) to Sentry
      const error = hint.originalException as any;
      if (error?.statusCode === 400 || error?.status === 400) {
        return null;
      }
      return event;
    },
  });
}
