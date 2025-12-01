import { TierBadge } from './TierBadge';

type PlayerTier =
  | 'SPROUT'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'GENKI';

interface LeaderEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  tier: PlayerTier;
  lifetimeRating?: number;
  seasonalRatingHidden?: number;
  provisional: boolean;
  matchesPlayed: number;
  winRate: string;
}

interface LeaderboardTableProps {
  entries: LeaderEntry[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  onPlayerClick?: (player: { userId: string; userName: string }) => void;
}

function getRankStyle(rank: number): string {
  if (rank <= 3) {
    const colors = {
      1: 'bg-yellow-500/10 border-l-4 border-l-yellow-500',
      2: 'bg-slate-400/10 border-l-4 border-l-slate-400',
      3: 'bg-orange-700/10 border-l-4 border-l-orange-700',
    };
    return colors[rank as 1 | 2 | 3];
  }
  if (rank <= 10) {
    return 'bg-primary/5 border-l-2 border-l-primary/30';
  }
  return 'hover:bg-muted/50';
}

function getRankText(rank: number): string {
  if (rank <= 3) {
    const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return icons[rank as 1 | 2 | 3];
  }
  return `#${rank}`;
}

export function LeaderboardTable({
  entries,
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  onPlayerClick,
}: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Rankings Yet</h3>
        <p className="text-muted-foreground">
          Complete tournaments to see the leaderboard populate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                  Rank
                </th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                  Player
                </th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-right py-4 px-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                  Rating
                </th>
                <th className="text-right py-4 px-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="text-right py-4 px-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                  Matches
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.userId}
                  onClick={onPlayerClick ? () => onPlayerClick({ userId: entry.userId, userName: entry.userName }) : undefined}
                  className={`
                    border-b border-border/50 transition-colors
                    ${getRankStyle(entry.rank)}
                    ${onPlayerClick ? 'cursor-pointer hover:bg-muted/30' : ''}
                  `}
                >
                  {/* Rank */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-foreground w-16">
                        {getRankText(entry.rank)}
                      </span>
                      {entry.rank <= 10 && (
                        <div className="w-1 h-8 bg-primary/20 rounded-full"></div>
                      )}
                    </div>
                  </td>

                  {/* Player */}
                  <td className="py-4 px-6">
                    <div className="font-semibold text-foreground">
                      {entry.userName}
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="py-4 px-6">
                    <TierBadge tier={entry.tier} size="sm" provisional={entry.provisional} />
                  </td>

                  {/* Rating (Admin Only) */}
                  <td className="py-4 px-6 text-right">
                    <div className="font-mono font-bold text-foreground">
                      {entry.lifetimeRating || entry.seasonalRatingHidden}
                    </div>
                    <div className="text-xs text-muted-foreground">Internal</div>
                  </td>

                  {/* Win Rate */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                          style={{ width: `${entry.winRate}%` }}
                        />
                      </div>
                      <span className="font-semibold text-foreground w-12 text-right">
                        {entry.winRate}%
                      </span>
                    </div>
                  </td>

                  {/* Matches */}
                  <td className="py-4 px-6 text-right">
                    <div className="font-semibold text-foreground">{entry.matchesPlayed}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-card rounded-xl border border-border">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
