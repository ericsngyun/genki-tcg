import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import {
  MatchesService,
  ReportMatchResultDto,
  PlayerReportResultDto,
  ConfirmMatchResultDto,
} from './matches.service';
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
    return this.matchesService.reportMatchResult(dto, user.id, user.orgId);
  }

  @Get(':id')
  async getMatch(@CurrentUser() user: any, @Param('id') id: string) {
    return this.matchesService.getMatch(id, user.orgId);
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
      user.orgId,
    );
  }

  /**
   * Player reports their match result (requires opponent confirmation)
   */
  @Post(':id/report-result')
  async playerReportResult(
    @Param('id') matchId: string,
    @CurrentUser() user: any,
    @Body() dto: PlayerReportResultDto,
  ) {
    return this.matchesService.playerReportResult(matchId, dto, user.id, user.orgId);
  }

  /**
   * Player confirms or disputes opponent's reported result
   */
  @Post(':id/confirm-result')
  async confirmResult(
    @Param('id') matchId: string,
    @CurrentUser() user: any,
    @Body() dto: ConfirmMatchResultDto,
  ) {
    return this.matchesService.confirmMatchResult(matchId, dto, user.id, user.orgId);
  }
}
