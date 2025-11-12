import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rounds')
@UseGuards(JwtAuthGuard)
export class RoundsController {
  constructor(private roundsService: RoundsService) {}

  @Post('events/:eventId/next')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async createNextRound(@Param('eventId') eventId: string) {
    return this.roundsService.createNextRound(eventId);
  }

  @Get(':roundId/pairings')
  async getPairings(@Param('roundId') roundId: string) {
    return this.roundsService.getPairings(roundId);
  }
}
