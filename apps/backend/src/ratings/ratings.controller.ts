import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { SeasonsService } from './seasons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import type { GameType } from '@prisma/client';
import { SeasonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(
    private ratingsService: RatingsService,
    private seasonsService: SeasonsService,
    private prisma: PrismaService
  ) { }

  // ===========================================================================
  // Tournament Processing
  // ===========================================================================

  @Post('tournaments/:id/process-ratings')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async processTournamentRatings(@Param('id') tournamentId: string) {
    await this.ratingsService.processTournamentRatings(tournamentId);
    return { success: true };
  }

  /**
   * Admin endpoint: Process ratings for the most recent unprocessed tournament of a specific game
   * Usage: POST /ratings/process-latest/:gameType
   * Example: POST /ratings/process-latest/AZUKI_TCG
   */
  @Post('process-latest/:gameType')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async processLatestUnprocessed(
    @Param('gameType') gameType: GameType,
    @CurrentUser() user: AuthenticatedUser
  ) {
    // Find the most recent unprocessed completed tournament for this game
    const tournament = await this.prisma.event.findFirst({
      where: {
        game: gameType,
        status: 'COMPLETED',
        ratingsProcessed: false,
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tournament) {
      throw new BadRequestException(
        `No unprocessed completed ${gameType} tournaments found`
      );
    }

    // Process the ratings
    await this.ratingsService.processTournamentRatings(tournament.id);

    // Get some sample updated ratings to show
    const ratingUpdates = await this.prisma.tournamentRatingUpdate.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { seasonalRatingAfter: 'desc' },
      take: 10,
    });

    // Get user names for the top rating changes
    const userIds = ratingUpdates.map(u => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    return {
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        game: tournament.game,
        playerCount: tournament._count.entries,
      },
      topRatingChanges: ratingUpdates.map((update) => ({
        playerName: userMap.get(update.userId) || 'Unknown',
        ratingBefore: Math.round(update.seasonalRatingBefore),
        ratingAfter: Math.round(update.seasonalRatingAfter),
        change: Math.round(update.seasonalRatingDelta),
        tierBefore: update.tierBefore,
        tierAfter: update.tierAfter,
      })),
      totalPlayersProcessed: ratingUpdates.length,
    };
  }

  /**
   * Admin endpoint: List all tournaments that need rating processing
   * Usage: GET /ratings/unprocessed-tournaments
   */
  @Get('unprocessed-tournaments')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getUnprocessedTournaments(@CurrentUser() user: AuthenticatedUser) {
    const tournaments = await this.prisma.event.findMany({
      where: {
        orgId: user.orgId,
        status: 'COMPLETED',
        ratingsProcessed: false,
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      count: tournaments.length,
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        game: t.game,
        playerCount: t._count.entries,
        completedAt: t.endAt,
      })),
    };
  }

  // ===========================================================================
  // Player Ranks & Tiers
  // ===========================================================================

  @Get('players/:id/ranks')
  async getPlayerRanks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') playerId: string
  ) {
    return this.ratingsService.getPlayerRanks(playerId, user.orgId);
  }

  @Get('me/ranks')
  async getMyRanks(@CurrentUser() user: AuthenticatedUser) {
    return this.ratingsService.getPlayerRanks(user.id, user.orgId);
  }

  @Get('me/lifetime')
  async getMyLifetimeRatings(@CurrentUser() user: AuthenticatedUser) {
    return this.ratingsService.getPlayerLifetimeRatings(user.id, user.orgId);
  }

  // ===========================================================================
  // Leaderboards
  // ===========================================================================

  @Get('seasons/:id/leaderboard')
  async getSeasonLeaderboard(
    @Param('id') seasonId: string,
    @Query('category') category: GameType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.ratingsService.getSeasonLeaderboard(seasonId, category, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('leaderboard')
  async getLifetimeLeaderboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category: GameType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string
  ) {
    return this.ratingsService.getLifetimeLeaderboard(user.orgId, category, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search,
    });
  }

  @Post('reset/:category')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async resetCategoryRatings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('category') category: GameType
  ) {
    return this.ratingsService.resetCategoryRatings(user.orgId, category);
  }

  @Get('players/:id/history')
  async getPlayerHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') playerId: string,
    @Query('category') category: GameType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.ratingsService.getPlayerRatingHistory(playerId, user.orgId, category, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // ===========================================================================
  // Season Management (Admin)
  // ===========================================================================

  @Post('seasons')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async createSeason(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: {
      name: string;
      startDate: string;
      endDate: string;
      autoActivate?: boolean;
    }
  ) {
    return this.seasonsService.createSeason({
      orgId: user.orgId,
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      autoActivate: body.autoActivate,
    });
  }

  @Get('seasons/active')
  async getActiveSeason(@CurrentUser() user: AuthenticatedUser) {
    return this.seasonsService.getActiveSeason(user.orgId);
  }

  @Get('seasons')
  async getSeasons(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: SeasonStatus
  ) {
    return this.seasonsService.getSeasons(user.orgId, status);
  }

  @Post('seasons/:id/initialize-ratings')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async initializeSeasonRatings(@Param('id') seasonId: string) {
    return this.seasonsService.initializeSeasonRatingsForAllPlayers(seasonId);
  }

  @Post('seasons/:id/status')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async updateSeasonStatus(
    @Param('id') seasonId: string,
    @Body('status') status: SeasonStatus
  ) {
    return this.seasonsService.updateSeasonStatus(seasonId, status);
  }
}
