import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async reportMatchResult(dto: ReportMatchResultDto, reportedBy: string, userOrgId: string) {
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
      throw new NotFoundException('Match not found');
    }

    // Validate organization
    if (match.round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this match');
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

  async getMatch(matchId: string, userOrgId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        playerA: {
          select: {
            id: true,
            name: true,
          },
        },
        playerB: {
          select: {
            id: true,
            name: true,
          },
        },
        round: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Validate organization
    if (match.round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this match');
    }

    return match;
  }

  async overrideMatchResult(
    matchId: string,
    result: MatchResult,
    gamesWonA: number,
    gamesWonB: number,
    overriddenBy: string,
    userOrgId: string,
  ) {
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
      throw new NotFoundException('Match not found');
    }

    // Validate organization
    if (match.round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this match');
    }

    // Update match result with override tracking
    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        result,
        gamesWonA,
        gamesWonB,
        overriddenBy,
        overriddenAt: new Date(),
      },
    });

    // Emit real-time event
    this.realtimeGateway.emitMatchResultReported(
      match.round.eventId,
      matchId,
      match.tableNumber,
    );

    // Also emit standings updated
    this.realtimeGateway.emitStandingsUpdated(match.round.eventId);

    return updatedMatch;
  }
}
