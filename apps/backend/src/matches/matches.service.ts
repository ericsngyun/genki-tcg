import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RatingsService } from '../ratings/ratings.service';
import type { MatchResult } from '@prisma/client';

export interface ReportMatchResultDto {
  matchId: string;
  result: MatchResult;
  gamesWonA: number;
  gamesWonB: number;
}

export interface PlayerReportResultDto {
  result: MatchResult;
  gamesWonA: number;
  gamesWonB: number;
}

export interface ConfirmMatchResultDto {
  confirm: boolean;
  counterResult?: MatchResult;
  counterGamesWonA?: number;
  counterGamesWonB?: number;
}

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
    private ratingsService: RatingsService
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

    // Update player ratings
    await this.updatePlayerRatings(match, updatedMatch, userOrgId);

    return updatedMatch;
  }

  /**
   * Update player ratings based on match result
   */
  private async updatePlayerRatings(
    match: any,
    updatedMatch: any,
    orgId: string
  ) {
    try {
      // Only update ratings if both players exist (not a bye)
      if (!match.playerBId) {
        return;
      }

      const gameType = match.round.event.game;

      // Get current ratings for both players
      const [playerARating, playerBRating] = await Promise.all([
        this.prisma.playerRating.findUnique({
          where: {
            userId_orgId_gameType: {
              userId: match.playerAId,
              orgId,
              gameType,
            },
          },
        }),
        this.prisma.playerRating.findUnique({
          where: {
            userId_orgId_gameType: {
              userId: match.playerBId,
              orgId,
              gameType,
            },
          },
        }),
      ]);

      // Use default rating if player doesn't have a rating yet
      const playerARatingValue = playerARating?.rating || 1500;
      const playerARD = playerARating?.ratingDeviation || 350;
      const playerBRatingValue = playerBRating?.rating || 1500;
      const playerBRD = playerBRating?.ratingDeviation || 350;

      // Update both players' ratings
      await Promise.all([
        this.ratingsService.updateRating(
          match.playerAId,
          orgId,
          gameType,
          [
            {
              opponentId: match.playerBId,
              opponentRating: playerBRatingValue,
              opponentRD: playerBRD,
              result: updatedMatch.result,
              eventId: match.round.eventId,
              matchId: match.id,
            },
          ]
        ),
        this.ratingsService.updateRating(
          match.playerBId,
          orgId,
          gameType,
          [
            {
              opponentId: match.playerAId,
              opponentRating: playerARatingValue,
              opponentRD: playerARD,
              result: updatedMatch.result,
              eventId: match.round.eventId,
              matchId: match.id,
            },
          ]
        ),
      ]);
    } catch (error) {
      // Log error but don't fail the match result
      console.error('Failed to update player ratings:', error);
    }
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

    // Update player ratings
    await this.updatePlayerRatings(match, updatedMatch, userOrgId);

    return updatedMatch;
  }

  /**
   * Player self-reports match result
   * Sets reportedBy but not confirmedBy - requires opponent confirmation
   */
  async playerReportResult(
    matchId: string,
    dto: PlayerReportResultDto,
    userId: string,
    userOrgId: string,
  ) {
    // Get match with round and event info
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        round: {
          include: {
            event: true,
          },
        },
        playerA: true,
        playerB: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Validate organization
    if (match.round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this match');
    }

    // Validate user is a participant in this match
    const isPlayerA = match.playerAId === userId;
    const isPlayerB = match.playerBId === userId;

    if (!isPlayerA && !isPlayerB) {
      throw new ForbiddenException('You are not a participant in this match');
    }

    // Validate round is active
    if (match.round.status !== 'ACTIVE') {
      throw new BadRequestException('Can only report results for active rounds');
    }

    // Check if match was already confirmed
    if (match.confirmedBy) {
      throw new BadRequestException('Match result has already been confirmed');
    }

    // Update match result
    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        result: dto.result,
        gamesWonA: dto.gamesWonA,
        gamesWonB: dto.gamesWonB,
        reportedBy: userId,
        reportedAt: new Date(),
        // Clear confirmedBy in case this is a re-report
        confirmedBy: null,
      },
      include: {
        playerA: {
          select: { id: true, name: true },
        },
        playerB: {
          select: { id: true, name: true },
        },
        round: true,
      },
    });

    // Emit real-time event for result reported (awaiting confirmation)
    this.realtimeGateway.emitMatchResultReported(
      match.round.eventId,
      matchId,
      match.tableNumber,
    );

    return {
      match: updatedMatch,
      requiresConfirmation: true,
      reportedBy: userId,
    };
  }

  /**
   * Opponent confirms or disputes the reported match result
   */
  async confirmMatchResult(
    matchId: string,
    dto: ConfirmMatchResultDto,
    userId: string,
    userOrgId: string,
  ) {
    // Get match with round and event info
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        round: {
          include: {
            event: true,
          },
        },
        playerA: true,
        playerB: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Validate organization
    if (match.round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this match');
    }

    // Validate user is a participant in this match
    const isPlayerA = match.playerAId === userId;
    const isPlayerB = match.playerBId === userId;

    if (!isPlayerA && !isPlayerB) {
      throw new ForbiddenException('You are not a participant in this match');
    }

    // Validate user is NOT the reporter (must be the opponent)
    if (match.reportedBy === userId) {
      throw new BadRequestException('Cannot confirm your own report. Wait for opponent confirmation.');
    }

    // Validate there is a result to confirm
    if (!match.reportedBy || !match.result) {
      throw new BadRequestException('No result has been reported yet');
    }

    // Already confirmed
    if (match.confirmedBy) {
      throw new BadRequestException('Match result has already been confirmed');
    }

    if (dto.confirm) {
      // Opponent confirms the result
      const updatedMatch = await this.prisma.match.update({
        where: { id: matchId },
        data: {
          confirmedBy: userId,
        },
        include: {
          playerA: {
            select: { id: true, name: true },
          },
          playerB: {
            select: { id: true, name: true },
          },
          round: true,
        },
      });

      // Emit real-time event for confirmed result
      this.realtimeGateway.emitMatchResultReported(
        match.round.eventId,
        matchId,
        match.tableNumber,
      );

      // Emit standings updated since confirmed result affects standings
      this.realtimeGateway.emitStandingsUpdated(match.round.eventId);

      // Update player ratings
      await this.updatePlayerRatings(match, updatedMatch, userOrgId);

      return {
        match: updatedMatch,
        status: 'confirmed',
      };
    } else {
      // Opponent disputes the result
      // In a real system, you might want to flag this for admin review
      // For now, we'll allow the disputing player to submit their counter-result

      if (!dto.counterResult) {
        throw new BadRequestException('Must provide counter-result when disputing');
      }

      // Clear the previous report and let the disputing player report their version
      const updatedMatch = await this.prisma.match.update({
        where: { id: matchId },
        data: {
          result: dto.counterResult,
          gamesWonA: dto.counterGamesWonA ?? 0,
          gamesWonB: dto.counterGamesWonB ?? 0,
          reportedBy: userId,
          reportedAt: new Date(),
          confirmedBy: null,
        },
        include: {
          playerA: {
            select: { id: true, name: true },
          },
          playerB: {
            select: { id: true, name: true },
          },
          round: true,
        },
      });

      // Emit disputed event
      this.realtimeGateway.emitMatchResultReported(
        match.round.eventId,
        matchId,
        match.tableNumber,
      );

      return {
        match: updatedMatch,
        status: 'disputed',
        message: 'Result disputed. Original reporter must now confirm or admin must intervene.',
      };
    }
  }
}
