/**
 * Configuration Loader
 *
 * This file exports a function that loads and returns validated configuration.
 * Used by @nestjs/config ConfigModule.
 */

export default () => ({
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  port: parseInt(process.env.PORT || process.env.API_PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    testUrl: process.env.TEST_DATABASE_URL,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  // Discord OAuth
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    allowedRedirects: process.env.DISCORD_ALLOWED_REDIRECTS?.split(',').map(r => r.trim()) || [],
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [
      'http://localhost:3000',
      'http://localhost:8081',
      'genki-tcg://',
    ],
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    enabled: !!process.env.SENTRY_DSN,
  },

  // Organization
  organization: {
    defaultSlug: process.env.DEFAULT_ORG_SLUG || 'genki',
    defaultInviteCode: process.env.DEFAULT_INVITE_CODE || 'GENKI',
  },

  // Email
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@genkitcg.com',
    enabled: !!process.env.SENDGRID_API_KEY,
  },

  // Push Notifications
  notifications: {
    expoAccessToken: process.env.EXPO_ACCESS_TOKEN,
    enabled: !!process.env.EXPO_ACCESS_TOKEN,
  },
});
