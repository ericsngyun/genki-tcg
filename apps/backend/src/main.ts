import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // Admin web
      'http://localhost:8081', // Expo dev
    ],
    credentials: true,
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Genki TCG API running on http://localhost:${port}`);
}

bootstrap();
