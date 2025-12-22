import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateStandings, MatchRecord } from '@genki-tcg/tournament-logic';

@Injectable()
export class StandingsService {
  constructor(private prisma: PrismaService) { }

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
                avatarUrl: true,
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

    const playerIds = event.entries.map((e: { userId: string }) => e.userId);
    const playerNames = new Map<string, string>(
      event.entries.map((e: { userId: string; user: { name: string } }) => [e.userId, e.user.name])
    );
    const playerAvatars = new Map<string, string | null>(
      event.entries.map((e: { userId: string; user: { avatarUrl: string | null } }) => [e.userId, e.user.avatarUrl])
    );

    // Define match type with result matching MatchRecord
    type MatchType = {
      result: MatchRecord['result'];
      overriddenBy: string | null;
      reportedBy: string | null;
      confirmedBy: string | null;
      playerAId: string;
      playerBId: string | null;
      gamesWonA: number | null;
      gamesWonB: number | null;
    };

    type RoundType = { matches: MatchType[] };

    // Filter matches to only include confirmed/admin-reported results
    // Exclude player-reported matches that haven't been confirmed yet
    const matches: MatchRecord[] = event.rounds.flatMap((r: RoundType) =>
      r.matches
        .filter((m: MatchType) => {
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
        .map((m: MatchType): MatchRecord => ({
          playerAId: m.playerAId,
          playerBId: m.playerBId,
          result: m.result,
          gamesWonA: m.gamesWonA || 0,
          gamesWonB: m.gamesWonB || 0,
        }))
    );

    const droppedPlayers = new Set<string>(
      event.entries
        .filter((e: { droppedAt: Date | null }) => e.droppedAt)
        .map((e: { userId: string }) => e.userId)
    );

    // Build map of dropped players to the round they dropped after
    const droppedAfterRound = new Map<string, number>(
      event.entries
        .filter((e: { droppedAt: Date | null; droppedAfterRound: number | null }) => e.droppedAt && e.droppedAfterRound !== null)
        .map((e: { userId: string; droppedAfterRound: number | null }) => [e.userId, e.droppedAfterRound || 0])
    );

    // Calculate total completed rounds (rounds with status COMPLETED)
    const totalCompletedRounds = event.rounds.filter(
      (r: { status: string }) => r.status === 'COMPLETED'
    ).length;

    const standings = calculateStandings({
      playerIds,
      playerNames,
      matches,
      droppedPlayers,
      totalCompletedRounds,
      droppedAfterRound,
    });

    // Enrich standings with avatar URLs
    return standings.map((standing) => ({
      ...standing,
      avatarUrl: playerAvatars.get(standing.userId) || null,
    }));
  }
}
