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
    bg: 'bg-gradient-to-b from-yellow-500/20 to-yellow-600/5',
    border: 'border-yellow-500/40',
    glow: 'shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)]',
    textGlow: 'text-yellow-500',
    icon: '👑',
    height: 'h-48',
    delay: 'delay-200',
  },
  2: {
    bg: 'bg-gradient-to-b from-slate-300/20 to-slate-400/5',
    border: 'border-slate-400/40',
    glow: 'shadow-[0_0_40px_-10px_rgba(148,163,184,0.3)]',
    textGlow: 'text-slate-400',
    icon: '🥈',
    height: 'h-36',
    delay: 'delay-300',
  },
  3: {
    bg: 'bg-gradient-to-b from-orange-700/20 to-orange-800/5',
    border: 'border-orange-700/40',
    glow: 'shadow-[0_0_40px_-10px_rgba(194,65,12,0.3)]',
    textGlow: 'text-orange-700',
    icon: '🥉',
    height: 'h-32',
    delay: 'delay-500',
  },
};

function PodiumCard({ player, rank, onClick }: { player: LeaderEntry; rank: 1 | 2 | 3; onClick?: () => void }) {
  const style = PODIUM_STYLES[rank];

  return (
    <div className={`relative flex flex-col justify-end ${rank === 2 ? 'order-first md:order-none' : ''}`}>
      <div
        className={`
          animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both
          ${style.delay}
        `}
      >
        <div
          onClick={onClick}
          className={`
            relative rounded-2xl border backdrop-blur-sm p-6 transition-all duration-300
            hover:-translate-y-2 hover:scale-[1.02] group
            ${style.bg} ${style.border} ${style.glow}
            ${onClick ? 'cursor-pointer' : ''}
            mb-4
          `}
        >
          {/* Rank Badge */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div
              className={`
                w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl
                bg-background shadow-lg
                ${style.border}
              `}
            >
              {style.icon}
            </div>
          </div>

          {/* Player Info */}
          <div className="mt-6 text-center space-y-3">
            {/* Name */}
            <div>
              <h3 className={`text-lg font-bold ${style.textGlow} tracking-tight truncate px-2`}>
                {player.userName}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Rank #{player.rank}</p>
            </div>

            {/* Tier */}
            <div className="flex justify-center scale-90">
              <TierBadge tier={player.tier} size="lg" provisional={player.provisional} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/50">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{player.winRate}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{player.matchesPlayed}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Matches</div>
              </div>
            </div>
          </div>
        </div>

        {/* Podium Base */}
        <div
          className={`
            rounded-t-lg border-x border-t flex items-end justify-center
            bg-gradient-to-b from-background/80 to-background/20 backdrop-blur-sm
            ${style.border} ${style.height}
          `}
        >
          <div className={`text-8xl font-black opacity-10 mb-4 ${style.textGlow}`}>
            {rank}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardPodium({ topThree, seasonName, onPlayerClick }: LeaderboardPodiumProps) {
  if (topThree.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-2xl p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Rankings Yet</h3>
        <p className="text-muted-foreground">
          Complete tournaments to see the top players appear on the podium.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {seasonName && (
        <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Top Players
          </h2>
          <p className="text-muted-foreground font-medium">{seasonName}</p>
        </div>
      )}

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto px-4">
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
