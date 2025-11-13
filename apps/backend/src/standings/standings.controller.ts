import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { StandingsService } from './standings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('standings')
@UseGuards(JwtAuthGuard)
export class StandingsController {
  constructor(private standingsService: StandingsService) {}

  @Get('events/:eventId')
  async getStandings(@Param('eventId') eventId: string) {
    return this.standingsService.calculateCurrentStandings(eventId);
  }

  @Get('events/:eventId/export')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async exportStandings(@Param('eventId') eventId: string, @Res() res: Response) {
    const standings = await this.standingsService.calculateCurrentStandings(eventId);

    // Generate CSV
    const headers = ['Rank', 'Player', 'Points', 'Match Record', 'OMW%', 'GW%', 'OGW%', 'OOMW%'];
    const csvRows = [headers.join(',')];

    for (const standing of standings) {
      const row = [
        standing.rank,
        `"${standing.userName}"`, // Quote name in case it contains commas
        standing.points,
        `"${standing.matchWins}-${standing.matchLosses}-${standing.matchDraws}"`,
        (standing.omwPercent * 100).toFixed(2),
        (standing.gwPercent * 100).toFixed(2),
        (standing.ogwPercent * 100).toFixed(2),
        (standing.oomwPercent * 100).toFixed(2),
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="standings-${eventId}.csv"`);

    return res.send(csv);
  }
}
