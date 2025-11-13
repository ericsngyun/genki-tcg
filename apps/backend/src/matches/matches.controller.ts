import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { MatchesService, ReportMatchResultDto } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post('report')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async reportResult(@CurrentUser() user: any, @Body() dto: ReportMatchResultDto) {
    return this.matchesService.reportMatchResult(dto, user.id);
  }

  @Get(':id')
  async getMatch(@Param('id') id: string) {
    return this.matchesService.getMatch(id);
  }

  @Post(':id/override')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async overrideResult(
    @Param('id') matchId: string,
    @CurrentUser() user: any,
    @Body() dto: { result: any; gamesWonA: number; gamesWonB: number },
  ) {
    return this.matchesService.overrideMatchResult(
      matchId,
      dto.result,
      dto.gamesWonA,
      dto.gamesWonB,
      user.id,
    );
  }
}
