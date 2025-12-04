import { TierBadge } from './TierBadge';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { RankedAvatar } from './RankedAvatar';

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
      1: 'bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-l-yellow-500',
      2: 'bg-slate-400/5 hover:bg-slate-400/10 border-l-4 border-l-slate-400',
      3: 'bg-orange-700/5 hover:bg-orange-700/10 border-l-4 border-l-orange-700',
    };
    return colors[rank as 1 | 2 | 3];
  }
  if (rank <= 10) {
    return 'bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary/30';
  }
  return 'hover:bg-muted/50 border-l-2 border-l-transparent';
}

function getRankIcon(rank: number) {
  if (rank === 1) return <span className="text-2xl">👑</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-muted-foreground font-mono font-bold">#{rank}</span>;
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
      <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground font-medium">Loading leaderboard...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-xl p-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Rankings Yet</h3>
        <p className="text-muted-foreground">
          Complete tournaments to see the leaderboard populate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[800px] overflow-y-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm shadow-sm">
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-24">
                  Rank
                </th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Player
                </th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-40">
                  Tier
                </th>
                <th className="text-right py-4 px-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-32">
                  Rating
                </th>
                <th className="text-right py-4 px-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-48">
                  Win Rate
                </th>
                <th className="text-right py-4 px-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-32">
                  Matches
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {entries.map((entry, index) => (
                <tr
                  key={entry.userId}
                  onClick={onPlayerClick ? () => onPlayerClick({ userId: entry.userId, userName: entry.userName }) : undefined}
                  className={`
                    transition-all duration-200 group
                    ${getRankStyle(entry.rank)}
                    ${onPlayerClick ? 'cursor-pointer' : ''}
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Rank */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                    </div>
                  </td>

                  {/* Player */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <RankedAvatar
                        user={{ name: entry.userName, avatarUrl: entry.userAvatar }}
                        tier={entry.tier}
                        size="md"
                        showTierBadge={true}
                      />
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {entry.userName}
                      </div>
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="py-4 px-6">
                    <TierBadge tier={entry.tier} size="sm" provisional={entry.provisional} />
                  </td>

                  {/* Rating (Admin Only) */}
                  <td className="py-4 px-6 text-right">
                    <div className="font-mono font-bold text-foreground">
                      {Math.round(entry.lifetimeRating || entry.seasonalRatingHidden || 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">Internal</div>
                  </td>

                  {/* Win Rate */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${parseFloat(entry.winRate) >= 50 ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                          style={{ width: `${entry.winRate}%` }}
                        />
                      </div>
                      <span className="font-mono font-medium text-foreground w-12 text-right">
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
        <div className="flex items-center justify-between px-6 py-4 bg-card rounded-xl border border-border shadow-sm">
          <div className="text-sm text-muted-foreground font-medium">
            Page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-background border border-border text-foreground rounded-lg font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
