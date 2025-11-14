import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    // Basic liveness check - always returns 200
    const response: {
      status: string;
      timestamp: string;
      uptime: number;
      memory: { used: number; total: number };
      database: string;
      databaseError?: string;
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      database: 'unknown',
    };

    // Try to check database connection, but don't fail if it's down
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      response.database = 'connected';
    } catch (error) {
      response.database = 'disconnected';
      response.databaseError = (error as Error)?.message || 'Unknown error';
    }

    return response;
  }

  @Get('ready')
  async ready() {
    // Readiness check - more thorough than liveness
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch {
      return { ready: false };
    }
  }

  @Get('live')
  async live() {
    // Liveness check - simple ping, no dependencies
    return { alive: true, timestamp: new Date().toISOString() };
  }
}
