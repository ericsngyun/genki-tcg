import { Controller, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SeedService } from './seed.service';

/**
 * DEVELOPMENT ONLY - Seed Controller
 * Provides an HTTP endpoint to seed the database
 * Protected with authentication and only works in development
 */
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Throttle({ default: { limit: 1, ttl: 86400000 } }) // 1 per day
  async seed() {
    // SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seeding is disabled in production');
    }

    try {
      const result = await this.seedService.seed();
      return {
        success: true,
        message: 'Database seeded successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Seeding failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
