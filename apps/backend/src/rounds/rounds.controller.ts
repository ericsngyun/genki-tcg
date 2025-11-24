import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('rounds')
@UseGuards(JwtAuthGuard)
export class RoundsController {
  constructor(private roundsService: RoundsService) {}

  @Post('events/:eventId/next')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async createNextRound(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.roundsService.createNextRound(eventId, user.orgId);
  }

  @Get(':roundId/pairings')
  async getPairings(@CurrentUser() user: any, @Param('roundId') roundId: string) {
    return this.roundsService.getPairings(roundId, user.orgId);
  }

  @Get(':roundId/matches')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getMatches(@CurrentUser() user: any, @Param('roundId') roundId: string) {
    return this.roundsService.getMatches(roundId, user.orgId);
  }

  /**
   * Start a round (PENDING -> ACTIVE)
   */
  @Post(':roundId/start')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async startRound(@CurrentUser() user: any, @Param('roundId') roundId: string) {
    return this.roundsService.startRound(roundId, user.orgId);
  }

  /**
   * Complete a round (ACTIVE -> COMPLETED)
   * Also checks if tournament should be marked complete
   */
  @Post(':roundId/complete')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async completeRound(@CurrentUser() user: any, @Param('roundId') roundId: string) {
    return this.roundsService.completeRound(roundId, user.orgId);
  }

  /**
   * Get tournament status including round info and completion detection
   */
  @Get('events/:eventId/status')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getTournamentStatus(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.roundsService.getTournamentStatus(eventId, user.orgId);
  }
}
