import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🔧 Bootstrapping NestJS application...');

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  console.log('✅ NestJS application created');

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
    ? process.env.CORS_ORIGINS.split(',')
    : [
        'http://localhost:3000',  // Admin web (dev)
        'http://localhost:8081',  // Expo dev
        'genki-tcg://',           // Mobile app scheme
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list or matches a pattern
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed.endsWith('*')) {
          // Wildcard matching (e.g., "https://*.vercel.app")
          const pattern = allowed.replace('*', '.*');
          return new RegExp(pattern).test(origin);
        }
        return origin === allowed || origin.startsWith(allowed);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.API_PORT || process.env.PORT || 3001;
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
