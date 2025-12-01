import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RatingsService } from '../ratings/ratings.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { MatchResult } from '@prisma/client';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { validateMatchResult, isBo3Format } from './match-validation';
import { areAllMatchesReported } from '@genki-tcg/tournament-logic';
import {
  ReportMatchResultDto,
  PlayerReportResultDto,
  ConfirmMatchResultDto,
} from './dto';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
    private ratingsService: RatingsService,
    private notificationsService: NotificationsService
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

    // Notify both players about match result being reported by admin (non-blocking)
    if (match.playerAId) {
      this.notificationsService.createAndSend({
        userId: match.playerAId,
        orgId: userOrgId,
        type: NotificationType.MATCH_RESULT_REPORTED,
        priority: NotificationPriority.NORMAL,
        title: 'Match Result Reported',
        body: `Result reported for your match at Table ${match.tableNumber}`,
        eventId: match.round.eventId,
        matchId: match.id,
      }).catch(err => console.error('Failed to send match reported notification:', err));
    }
    if (match.playerBId) {
      this.notificationsService.createAndSend({
        userId: match.playerBId,
        orgId: userOrgId,
        type: NotificationType.MATCH_RESULT_REPORTED,
        priority: NotificationPriority.NORMAL,
        title: 'Match Result Reported',
        body: `Result reported for your match at Table ${match.tableNumber}`,
        eventId: match.round.eventId,
        matchId: match.id,
      }).catch(err => console.error('Failed to send match reported notification:', err));
    }

    return updatedMatch;
  }

  /**
   * Update player ratings based on match result
   * NOTE: Ratings are now processed at the tournament level when the event completes.
   * This method is kept as a no-op for backward compatibility.
   * See RatingsService.processTournamentRatings() and RoundsService.completeRound()
   */
  private async updatePlayerRatings(
    match: any,
    updatedMatch: any,
    orgId: string
  ) {
    // Ratings are now processed at tournament completion, not per-match
    // This prevents rating churn and ensures proper Glicko-2 calculations
    return;
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
   * Result is immediately confirmed - no opponent confirmation needed
   * Opponent can dispute if they disagree, which will require admin resolution
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
            matches: true,
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

    // Validate match result consistency
    const isBo3 = isBo3Format(match.round.event.game);
    validateMatchResult(dto.result, dto.gamesWonA, dto.gamesWonB, isBo3);

    // Use transaction to prevent race conditions
    const updatedMatch = await this.prisma.$transaction(async (tx) => {
      // Re-fetch match within transaction to check for concurrent updates
      const currentMatch = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          round: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!currentMatch) {
        throw new NotFoundException('Match not found');
      }

      // Double-check conditions within transaction
      if (currentMatch.confirmedBy) {
        throw new BadRequestException('Match result has already been confirmed');
      }

      if (currentMatch.round.status !== 'ACTIVE') {
        throw new BadRequestException('Can only report results for active rounds');
      }

      // Update match result atomically with immediate confirmation
      return await tx.match.update({
        where: { id: matchId },
        data: {
          result: dto.result,
          gamesWonA: dto.gamesWonA,
          gamesWonB: dto.gamesWonB,
          reportedBy: userId,
          reportedAt: new Date(),
          // Auto-confirm immediately - no opponent confirmation needed
          confirmedBy: userId,
        },
        include: {
          playerA: {
            select: { id: true, name: true },
          },
          playerB: {
            select: { id: true, name: true },
          },
          round: {
            include: {
              event: true,
            },
          },
        },
      });
    });

    // Emit real-time event for confirmed result
    this.realtimeGateway.emitMatchResultReported(
      match.round.eventId,
      matchId,
      match.tableNumber,
    );

    // Emit standings updated since confirmed result affects standings
    this.realtimeGateway.emitStandingsUpdated(match.round.eventId);

    // Update player ratings (non-blocking)
    this.updatePlayerRatings(updatedMatch, updatedMatch, userOrgId).catch(
      (error) => {
        console.error('Failed to update player ratings:', error);
      }
    );

    // Check if round can be completed now
    await this.checkAndNotifyRoundCompletion(match.round);

    // Notify both players that match result was confirmed (non-blocking)
    const opponentId = isPlayerA ? updatedMatch.playerBId : updatedMatch.playerAId;
    if (opponentId) {
      this.notificationsService.createAndSend({
        userId: opponentId,
        orgId: userOrgId,
        type: NotificationType.MATCH_RESULT_CONFIRMED,
        priority: NotificationPriority.NORMAL,
        title: 'Match Result Confirmed',
        body: `Your match result for Table ${match.tableNumber} has been confirmed`,
        eventId: match.round.eventId,
        matchId: match.id,
      }).catch(err => console.error('Failed to send match confirmed notification:', err));
    }

    return {
      match: updatedMatch,
      requiresConfirmation: false,
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
      // Opponent confirms the result - use transaction for atomicity
      const updatedMatch = await this.prisma.$transaction(async (tx) => {
        // Re-fetch match within transaction
        const currentMatch = await tx.match.findUnique({
          where: { id: matchId },
          include: {
            round: {
              include: {
                event: true,
              },
            },
          },
        });

        if (!currentMatch) {
          throw new NotFoundException('Match not found');
        }

        // Double-check within transaction
        if (currentMatch.confirmedBy) {
          throw new BadRequestException('Match result has already been confirmed');
        }

        if (!currentMatch.reportedBy || !currentMatch.result) {
          throw new BadRequestException('No result has been reported yet');
        }

        // Update match with confirmation
        return await tx.match.update({
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
            round: {
              include: {
                event: true,
                matches: true,
              },
            },
          },
        });
      });

      // Emit real-time event for confirmed result
      this.realtimeGateway.emitMatchResultReported(
        updatedMatch.round.eventId,
        matchId,
        updatedMatch.tableNumber,
      );

      // Emit standings updated since confirmed result affects standings
      this.realtimeGateway.emitStandingsUpdated(updatedMatch.round.eventId);

      // Update player ratings (non-blocking)
      this.updatePlayerRatings(updatedMatch, updatedMatch, userOrgId).catch(
        (error) => {
          console.error('Failed to update player ratings:', error);
          // Don't fail the confirmation if ratings fail
        }
      );

      // Check if round can be completed now
      await this.checkAndNotifyRoundCompletion(updatedMatch.round);

      // Notify both players that match result was confirmed (non-blocking)
      const reporterId = updatedMatch.reportedBy;
      if (reporterId) {
        this.notificationsService.createAndSend({
          userId: reporterId,
          orgId: userOrgId,
          type: NotificationType.MATCH_RESULT_CONFIRMED,
          priority: NotificationPriority.NORMAL,
          title: 'Match Result Confirmed',
          body: `Your opponent confirmed the match result for Table ${updatedMatch.tableNumber}`,
          eventId: updatedMatch.round.eventId,
          matchId: matchId,
        }).catch(err => console.error('Failed to send match confirmed notification:', err));
      }

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

  /**
   * Check if round can be completed and notify if ready
   * Called after match confirmation to check if all matches are done
   */
  private async checkAndNotifyRoundCompletion(round: any): Promise<void> {
    try {
      // Re-fetch round with all matches to ensure we have latest state
      const fullRound = await this.prisma.round.findUnique({
        where: { id: round.id },
        include: { matches: true, event: true },
      });

      if (!fullRound || fullRound.status !== 'ACTIVE') {
        return; // Round already completed or not active
      }

      // Check if all matches are reported and confirmed
      const allReported = areAllMatchesReported(
        fullRound.matches.map((m) => ({
          result: m.result,
          playerBId: m.playerBId,
          reportedBy: m.reportedBy,
          confirmedBy: m.confirmedBy,
          overriddenBy: m.overriddenBy,
        }))
      );

      if (allReported) {
        // Emit event that round is ready for completion
        // This allows admin UI to show notification/button to complete round
        // In future, could auto-complete here if configured
        this.realtimeGateway.emitStandingsUpdated(fullRound.eventId);
        
        // Could also emit specific event for round ready to complete
        // this.realtimeGateway.emitRoundReadyToComplete(fullRound.eventId, fullRound.id, fullRound.roundNumber);
      }
    } catch (error) {
      // Don't fail match confirmation if this check fails
      console.error('Error checking round completion:', error);
    }
  }
}
