import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SeedService } from './seed.service';

/**
 * DEVELOPMENT ONLY - Seed Controller
 * Provides an HTTP endpoint to seed the database
 * Remove this in production or protect with strict authentication
 */
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  // Uncomment these lines to require authentication:
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('OWNER')
  async seed() {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        message: 'Seeding is disabled in production. Use the CLI instead.',
      };
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
        error: error.message,
      };
    }
  }
}
