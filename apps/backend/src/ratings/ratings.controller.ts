import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import type { GameType } from '@prisma/client';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  /**
   * GET /ratings/leaderboard
   * Get leaderboard for current organization
   * Query params: gameType, limit, offset, includeProvisional
   */
  @Get('leaderboard')
  async getLeaderboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('gameType') gameType: GameType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('includeProvisional') includeProvisional?: string
  ) {
    return this.ratingsService.getLeaderboard(user.orgId, gameType, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      includeProvisional: includeProvisional === 'true',
    });
  }

  /**
   * GET /ratings/player/:userId
   * Get player rating for specific user
   * Query params: gameType
   */
  @Get('player/:userId')
  async getPlayerRating(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Query('gameType') gameType: GameType
  ) {
    return this.ratingsService.getPlayerRating(userId, user.orgId, gameType);
  }

  /**
   * GET /ratings/player/:userId/history
   * Get player rating history
   * Query params: gameType, limit, offset
   */
  @Get('player/:userId/history')
  async getPlayerHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Query('gameType') gameType: GameType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.ratingsService.getPlayerHistory(userId, user.orgId, gameType, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * GET /ratings/me
   * Get current user's rating
   * Query params: gameType
   */
  @Get('me')
  async getMyRating(
    @CurrentUser() user: AuthenticatedUser,
    @Query('gameType') gameType: GameType
  ) {
    return this.ratingsService.getPlayerRating(user.id, user.orgId, gameType);
  }

  /**
   * GET /ratings/me/history
   * Get current user's rating history
   * Query params: gameType, limit, offset
   */
  @Get('me/history')
  async getMyHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('gameType') gameType: GameType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.ratingsService.getPlayerHistory(user.id, user.orgId, gameType, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
