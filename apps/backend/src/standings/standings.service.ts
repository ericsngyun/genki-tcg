import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateStandings } from '@genki-tcg/tournament-logic';

@Injectable()
export class StandingsService {
  constructor(private prisma: PrismaService) {}

  async calculateCurrentStandings(eventId: string, userOrgId: string) {
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
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    const playerIds = event.entries.map((e) => e.userId);
    const playerNames = new Map(
      event.entries.map((e) => [e.userId, e.user.name])
    );

    // Filter matches to only include confirmed/admin-reported results
    // Exclude player-reported matches that haven't been confirmed yet
    const matches = event.rounds.flatMap((r) =>
      r.matches
        .filter((m) => {
          // No result = not reported yet
          if (m.result === null) return false;
          
          // Admin override is always valid
          if (m.overriddenBy) return true;
          
          // Player-reported matches need confirmation
          // If reportedBy exists but confirmedBy doesn't, exclude from standings
          if (m.reportedBy && !m.confirmedBy) {
            return false; // Unconfirmed player report
          }
          
          // Staff-reported (no confirmedBy needed) or confirmed matches
          return true;
        })
        .map((m) => ({
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
