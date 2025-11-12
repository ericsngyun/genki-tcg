import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { MatchResult } from '@prisma/client';

export interface ReportMatchResultDto {
  matchId: string;
  result: MatchResult;
  gamesWonA: number;
  gamesWonB: number;
}

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway
  ) {}

  async reportMatchResult(dto: ReportMatchResultDto, reportedBy: string) {
    const { matchId, result, gamesWonA, gamesWonB } = dto;

    // Get match with round info
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        round: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!match) {
      throw new BadRequestException('Match not found');
    }

    // Update match result
    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        result,
        gamesWonA,
        gamesWonB,
        reportedBy,
        reportedAt: new Date(),
      },
    });

    // Emit real-time event
    this.realtimeGateway.emitMatchResultReported(
      match.round.eventId,
      matchId,
      match.tableNumber
    );

    // Also emit standings updated (since results affect standings)
    this.realtimeGateway.emitStandingsUpdated(match.round.eventId);

    return updatedMatch;
  }

  async getMatch(matchId: string) {
    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        playerA: true,
        playerB: true,
        round: true,
      },
    });
  }
}
