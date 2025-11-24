import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🔧 Bootstrapping NestJS application...');

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  console.log('✅ NestJS application created');

  // SECURITY: Add Helmet for HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false, // Required for mobile apps
  }));

  // Performance: Enable compression
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Request size limits (prevent large payloads)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:3000',  // Admin web (dev)
        'http://localhost:8081',  // Expo dev
        'genki-tcg://',           // Mobile app scheme
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list or matches a pattern
      const isAllowed = allowedOrigins.some(allowed => {
        // Exact match
        if (origin === allowed) return true;

        // Custom scheme handler (mobile apps)
        if (allowed.endsWith('://') && origin.startsWith(allowed)) return true;

        // Subdomain wildcard (e.g., "https://*.vercel.app")
        // SECURITY: Properly validate wildcard to prevent bypass attacks
        if (allowed.includes('*')) {
          // Split into protocol and domain parts
          const protocolMatch = allowed.match(/^(https?:\/\/)/);
          if (!protocolMatch) return false;

          const protocol = protocolMatch[1];
          const domainPattern = allowed.slice(protocol.length);

          // Ensure origin uses same protocol
          if (!origin.startsWith(protocol)) return false;

          const originDomain = origin.slice(protocol.length);

          // Replace * with regex that matches subdomains (alphanumeric and hyphens only)
          // [a-zA-Z0-9-]+ ensures only valid subdomain characters
          const escapedPattern = domainPattern
            .replace(/\./g, '\\.')
            .replace('*', '[a-zA-Z0-9-]+');

          const regex = new RegExp(`^${escapedPattern}$`);
          return regex.test(originDomain);
        }

        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  });

  // Railway provides PORT, prefer it over API_PORT for cloud deployments
  const port = process.env.PORT || process.env.API_PORT || 3001;
  const host = '0.0.0.0';

  console.log('🌐 Starting server...');
  console.log(`📍 Host: ${host}`);
  console.log(`📍 Port: ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // In Docker, we need to bind to 0.0.0.0 to accept external connections
  await app.listen(port, host);

  console.log('');
  console.log('='.repeat(60));
  console.log(`🚀 Genki TCG API running on http://localhost:${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`✅ Server is ready to accept connections`);
  console.log('='.repeat(60));
  console.log('');
}

bootstrap();
