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
  provisional: boolean;
  matchesPlayed: number;
  winRate: string;
}

interface LeaderboardPodiumProps {
  topThree: LeaderEntry[];
  seasonName?: string;
  onPlayerClick?: (player: { userId: string; userName: string }) => void;
}

const PODIUM_STYLES = {
  1: {
    bg: 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/50',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    textGlow: 'text-yellow-400',
    icon: '🥇',
    height: 'h-40',
  },
  2: {
    bg: 'bg-gradient-to-br from-slate-400/20 to-slate-500/10',
    border: 'border-slate-400/50',
    glow: 'shadow-[0_0_25px_rgba(148,163,184,0.3)]',
    textGlow: 'text-slate-400',
    icon: '🥈',
    height: 'h-32',
  },
  3: {
    bg: 'bg-gradient-to-br from-orange-700/20 to-orange-800/10',
    border: 'border-orange-700/50',
    glow: 'shadow-[0_0_20px_rgba(194,65,12,0.3)]',
    textGlow: 'text-orange-700',
    icon: '🥉',
    height: 'h-28',
  },
};

function PodiumCard({ player, rank, onClick }: { player: LeaderEntry; rank: 1 | 2 | 3; onClick?: () => void }) {
  const style = PODIUM_STYLES[rank];

  return (
    <div className={`relative ${rank === 2 ? 'order-first md:order-none' : ''}`}>
      <div
        onClick={onClick}
        className={`
          relative rounded-2xl border-2 backdrop-blur-md p-6 transition-all
          hover:-translate-y-2 hover:scale-105
          ${style.bg} ${style.border} ${style.glow}
          ${onClick ? 'cursor-pointer' : ''}
        `}
      >
        {/* Rank Badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div
            className={`
              w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl
              bg-background/90 backdrop-blur-sm
              ${style.border} ${style.glow}
            `}
          >
            {style.icon}
          </div>
        </div>

        {/* Player Info */}
        <div className="mt-6 text-center space-y-3">
          {/* Name */}
          <div>
            <h3 className={`text-xl font-bold ${style.textGlow} tracking-tight`}>
              {player.userName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Rank #{player.rank}</p>
          </div>

          {/* Tier */}
          <div className="flex justify-center">
            <TierBadge tier={player.tier} size="lg" provisional={player.provisional} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <div className="text-2xl font-bold text-foreground">{player.winRate}%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Win Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{player.matchesPlayed}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Matches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Podium Base */}
      <div
        className={`
          mt-2 rounded-b-lg border-2 border-t-0 flex items-end justify-center
          ${style.bg} ${style.border} ${style.height}
        `}
      >
        <div className={`text-6xl font-black opacity-20 mb-4 ${style.textGlow}`}>
          {rank}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardPodium({ topThree, seasonName, onPlayerClick }: LeaderboardPodiumProps) {
  if (topThree.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-2xl p-12 text-center">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Rankings Yet</h3>
        <p className="text-muted-foreground">
          Complete tournaments to see the top players appear on the podium.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {seasonName && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Top Players
          </h2>
          <p className="text-muted-foreground">{seasonName}</p>
        </div>
      )}

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 2nd Place (Left on desktop) */}
        {topThree[1] && (
          <PodiumCard
            player={topThree[1]}
            rank={2}
            onClick={onPlayerClick ? () => onPlayerClick({ userId: topThree[1].userId, userName: topThree[1].userName }) : undefined}
          />
        )}

        {/* 1st Place (Center) */}
        {topThree[0] && (
          <PodiumCard
            player={topThree[0]}
            rank={1}
            onClick={onPlayerClick ? () => onPlayerClick({ userId: topThree[0].userId, userName: topThree[0].userName }) : undefined}
          />
        )}

        {/* 3rd Place (Right) */}
        {topThree[2] && (
          <PodiumCard
            player={topThree[2]}
            rank={3}
            onClick={onPlayerClick ? () => onPlayerClick({ userId: topThree[2].userId, userName: topThree[2].userName }) : undefined}
          />
        )}
      </div>
    </div>
  );
}
