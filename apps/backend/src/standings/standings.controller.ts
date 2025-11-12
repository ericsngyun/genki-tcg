import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StandingsService } from './standings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('standings')
@UseGuards(JwtAuthGuard)
export class StandingsController {
  constructor(private standingsService: StandingsService) {}

  @Get('events/:eventId')
  async getStandings(@Param('eventId') eventId: string) {
    return this.standingsService.calculateCurrentStandings(eventId);
  }
}
