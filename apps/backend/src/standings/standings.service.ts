import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateStandings } from '@genki-tcg/tournament-logic';

@Injectable()
export class StandingsService {
  constructor(private prisma: PrismaService) {}

  async calculateCurrentStandings(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: {
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
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const playerIds = event.entries.map((e) => e.userId);
    const playerNames = new Map(
      event.entries.map((e) => [e.userId, e.user.name])
    );

    const matches = event.rounds.flatMap((r) =>
      r.matches.map((m) => ({
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        result: m.result,
        gamesWonA: m.gamesWonA || 0,
        gamesWonB: m.gamesWonB || 0,
      }))
    );

    const droppedPlayers = new Set(
      event.entries.filter((e) => e.droppedAt).map((e) => e.userId)
    );

    return calculateStandings({
      playerIds,
      playerNames,
      matches,
      droppedPlayers,
    });
  }
}
