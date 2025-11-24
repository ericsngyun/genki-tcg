import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  generateSwissPairings,
  getPlayerRecordsForPairing,
  calculateStandings,
  calculateRecommendedRounds,
  getTournamentStatus,
  areAllMatchesReported,
} from '@genki-tcg/tournament-logic';

@Injectable()
export class RoundsService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway
  ) {}

  /**
   * Generate next round with Swiss pairings using actual standings
   */
  async createNextRound(eventId: string, userOrgId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          where: {
            checkedInAt: { not: null },
            droppedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        rounds: {
          include: {
            matches: true,
          },
          orderBy: {
            roundNumber: 'asc',
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Check if previous round is complete
    const currentRound = event.rounds[event.rounds.length - 1];
    if (currentRound && currentRound.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Previous round must be completed before creating a new round'
      );
    }

    const nextRoundNumber = event.rounds.length + 1;
    const playerCount = event.entries.length;

    // Check if tournament should be complete
    const recommendedRounds = calculateRecommendedRounds(playerCount);
    const totalRoundsPlanned = event.roundsPlanned ?? recommendedRounds;

    if (nextRoundNumber > totalRoundsPlanned) {
      throw new BadRequestException(
        `Tournament is complete. All ${totalRoundsPlanned} rounds have been played.`
      );
    }

    // Get player records from actual match history
    const playerIds = event.entries.map((e) => e.userId);
    const playerNames = new Map(
      event.entries.map((e) => [e.userId, e.user.name])
    );

    const allMatches = event.rounds.flatMap((r) =>
      r.matches.map((m) => ({
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        result: m.result,
        gamesWonA: m.gamesWonA ?? 0,
        gamesWonB: m.gamesWonB ?? 0,
      }))
    );

    // Get player records with calculated standings for proper Swiss pairing
    const players = getPlayerRecordsForPairing({
      playerIds,
      playerNames,
      matches: allMatches,
    });

    const pairingResult = generateSwissPairings({
      players,
      avoidRematches: true,
    });

    // Create round and matches in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update event status to IN_PROGRESS when first round is created
      if (nextRoundNumber === 1) {
        await tx.event.update({
          where: { id: eventId },
          data: {
            status: 'IN_PROGRESS',
            roundsPlanned: totalRoundsPlanned,
          },
        });
      }

      // Update event current round
      await tx.event.update({
        where: { id: eventId },
        data: { currentRound: nextRoundNumber },
      });

      const round = await tx.round.create({
        data: {
          eventId,
          roundNumber: nextRoundNumber,
          status: 'PENDING',
          timerSeconds: 3000, // 50 minutes
        },
      });

      const matches = await Promise.all(
        pairingResult.pairings.map((pairing) =>
          tx.match.create({
            data: {
              roundId: round.id,
              tableNumber: pairing.tableNumber,
              playerAId: pairing.playerAId,
              playerBId: pairing.playerBId,
              // Auto-report bye matches
              ...(pairing.playerBId === null && {
                result: 'PLAYER_A_WIN',
                gamesWonA: 2,
                gamesWonB: 0,
                reportedAt: new Date(),
              }),
            },
          })
        )
      );

      return { round, matches, byePlayerId: pairingResult.byePlayerId };
    });

    // Emit real-time event
    this.realtimeGateway.emitPairingsPosted(eventId, nextRoundNumber);

    return result;
  }

  /**
   * Start a round (change status from PENDING to ACTIVE)
   */
  async startRound(roundId: string, userOrgId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: { event: true },
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    if (round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this round');
    }

    if (round.status !== 'PENDING') {
      throw new BadRequestException('Round is not in PENDING status');
    }

    const updatedRound = await this.prisma.round.update({
      where: { id: roundId },
      data: {
        status: 'ACTIVE',
        startAt: new Date(),
      },
    });

    this.realtimeGateway.emitRoundStarted(round.eventId, round.roundNumber);

    return updatedRound;
  }

  /**
   * Complete a round (change status from ACTIVE to COMPLETED)
   * Also checks if tournament should be marked complete
   */
  async completeRound(roundId: string, userOrgId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: {
        event: {
          include: {
            entries: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            rounds: {
              include: { matches: true },
              orderBy: { roundNumber: 'asc' },
            },
          },
        },
        matches: true,
      },
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    if (round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this round');
    }

    if (round.status === 'COMPLETED') {
      throw new BadRequestException('Round is already completed');
    }

    // Check if all matches have results
    const allReported = areAllMatchesReported(
      round.matches.map((m) => ({
        result: m.result,
        playerBId: m.playerBId,
      }))
    );

    if (!allReported) {
      throw new BadRequestException(
        'All matches must be reported before completing the round'
      );
    }

    // Calculate current standings
    const playerIds = round.event.entries.map((e) => e.userId);
    const playerNames = new Map(
      round.event.entries.map((e) => [e.userId, e.user.name])
    );
    const droppedPlayers = new Set(
      round.event.entries.filter((e) => e.droppedAt).map((e) => e.userId)
    );

    const allMatches = round.event.rounds.flatMap((r) =>
      r.matches.map((m) => ({
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        result: m.result,
        gamesWonA: m.gamesWonA ?? 0,
        gamesWonB: m.gamesWonB ?? 0,
      }))
    );

    const standings = calculateStandings({
      playerIds,
      playerNames,
      matches: allMatches,
      droppedPlayers,
    });

    // Check if tournament should be complete
    const totalPlayerCount = round.event.entries.filter(
      (e) => e.checkedInAt
    ).length;
    const recommendedRounds = calculateRecommendedRounds(totalPlayerCount);
    const totalRoundsPlanned = round.event.roundsPlanned ?? recommendedRounds;

    const tournamentStatus = getTournamentStatus({
      playerCount: totalPlayerCount,
      currentRound: round.roundNumber,
      totalRoundsPlanned,
      standings,
      allMatchesReported: true,
    });

    // Update round and potentially event status
    const result = await this.prisma.$transaction(async (tx) => {
      const completedRound = await tx.round.update({
        where: { id: roundId },
        data: {
          status: 'COMPLETED',
          endAt: new Date(),
        },
      });

      let eventUpdate = {};
      if (tournamentStatus.isComplete) {
        eventUpdate = {
          status: 'COMPLETED',
          endAt: new Date(),
        };
      }

      const updatedEvent = await tx.event.update({
        where: { id: round.eventId },
        data: eventUpdate,
      });

      return {
        round: completedRound,
        event: updatedEvent,
        tournamentComplete: tournamentStatus.isComplete,
        reason: tournamentStatus.reason,
        standings,
      };
    });

    // Emit real-time events
    this.realtimeGateway.emitStandingsUpdated(round.eventId);

    if (result.tournamentComplete) {
      // Could add a specific event for tournament completion
      this.realtimeGateway.emitStandingsUpdated(round.eventId);
    }

    return result;
  }

  /**
   * Get tournament status including whether more rounds can be created
   */
  async getTournamentStatus(eventId: string, userOrgId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        rounds: {
          include: { matches: true },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    const checkedInEntries = event.entries.filter((e) => e.checkedInAt);
    const playerCount = checkedInEntries.length;
    const currentRound = event.rounds.length;

    // Calculate standings
    const playerIds = event.entries.map((e) => e.userId);
    const playerNames = new Map(
      event.entries.map((e) => [e.userId, e.user.name])
    );
    const droppedPlayers = new Set(
      event.entries.filter((e) => e.droppedAt).map((e) => e.userId)
    );

    const allMatches = event.rounds.flatMap((r) =>
      r.matches.map((m) => ({
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        result: m.result,
        gamesWonA: m.gamesWonA ?? 0,
        gamesWonB: m.gamesWonB ?? 0,
      }))
    );

    const standings = calculateStandings({
      playerIds,
      playerNames,
      matches: allMatches,
      droppedPlayers,
    });

    // Check current round status
    const latestRound = event.rounds[event.rounds.length - 1];
    const allMatchesReportedInLatest = latestRound
      ? areAllMatchesReported(
          latestRound.matches.map((m) => ({
            result: m.result,
            playerBId: m.playerBId,
          }))
        )
      : true;

    const recommendedRounds = calculateRecommendedRounds(playerCount);
    const totalRoundsPlanned = event.roundsPlanned ?? recommendedRounds;

    const status = getTournamentStatus({
      playerCount,
      currentRound,
      totalRoundsPlanned,
      standings,
      allMatchesReported: allMatchesReportedInLatest,
    });

    return {
      ...status,
      totalRoundsPlanned,
      latestRoundStatus: latestRound?.status ?? null,
      allMatchesReportedInLatest,
    };
  }

  async getPairings(roundId: string, userOrgId: string) {
    // Fetch round with event to validate organization
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: {
        event: true,
      },
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    // Validate organization
    if (round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this round');
    }

    return this.prisma.match.findMany({
      where: { roundId },
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
      },
      orderBy: {
        tableNumber: 'asc',
      },
    });
  }

  /**
   * Get all matches for a round with full details (admin use)
   */
  async getMatches(roundId: string, userOrgId: string) {
    // Fetch round with event to validate organization
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: {
        event: true,
        matches: {
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
          },
          orderBy: {
            tableNumber: 'asc',
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    // Validate organization
    if (round.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this round');
    }

    // Add status indicators to each match
    const matchesWithStatus = round.matches.map((match) => {
      let status: 'pending' | 'reported' | 'confirmed' | 'admin_override' = 'pending';

      if (match.overriddenBy) {
        status = 'admin_override';
      } else if (match.confirmedBy) {
        status = 'confirmed';
      } else if (match.reportedBy) {
        status = 'reported';
      }

      return {
        ...match,
        status,
      };
    });

    return {
      round: {
        id: round.id,
        roundNumber: round.roundNumber,
        status: round.status,
        startAt: round.startAt,
        endAt: round.endAt,
      },
      matches: matchesWithStatus,
    };
  }
}
