import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';
import { GameType } from '@prisma/client';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  private readonly logger = new Logger(LeaderboardController.name);

  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('lifetime')
  async getLifetimeLeaderboard(
    @Query('gameType') gameType: GameType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    this.logger.log(`Fetching lifetime leaderboard for ${gameType}, limit: ${parsedLimit}, offset: ${parsedOffset}`);

    const ratings = await this.leaderboardService.getLifetimeLeaderboard(
      gameType,
      parsedLimit,
      parsedOffset,
    );

    return {
      gameType,
      ratings,
      limit: parsedLimit,
      offset: parsedOffset,
    };
  }
}
