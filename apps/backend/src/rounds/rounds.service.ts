import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { generateSwissPairings } from '@genki-tcg/tournament-logic';

@Injectable()
export class RoundsService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway
  ) {}

  /**
   * Generate next round with Swiss pairings
   * TODO: Implement full logic with standings calculation
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
        rounds: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    const nextRoundNumber = event.rounds.length + 1;

    // TODO: Get player records from previous matches and calculate standings
    // For now, simple pairing based on registration order
    const players = event.entries.map((e) => ({
      userId: e.userId,
      userName: e.user.name,
      points: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      gameWins: 0,
      gameLosses: 0,
      omwPercent: 0.33,
      gwPercent: 0,
      ogwPercent: 0,
      receivedBye: false,
      opponentIds: [],
    }));

    const pairingResult = generateSwissPairings({
      players,
      avoidRematches: true,
    });

    // Create round and matches in transaction
    const result = await this.prisma.$transaction(async (tx) => {
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
            },
          })
        )
      );

      return { round, matches };
    });

    // Emit real-time event
    this.realtimeGateway.emitPairingsPosted(eventId, nextRoundNumber);

    return result;
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
}
