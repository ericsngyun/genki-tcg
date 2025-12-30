import { TierBadge } from './TierBadge';
import { TIER_COLORS } from './TierEmblem';

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
    bg: 'bg-gradient-to-b from-yellow-500/20 via-yellow-600/10 to-transparent',
    border: 'border-yellow-500/50',
    glow: 'shadow-[0_0_60px_-15px_rgba(234,179,8,0.5)]',
    textGlow: 'text-yellow-400',
    ringColor: 'ring-yellow-500/30',
    icon: '1',
    height: 'h-56',
    delay: 'delay-200',
    avatarSize: '2xl' as const,
  },
  2: {
    bg: 'bg-gradient-to-b from-slate-300/20 via-slate-400/10 to-transparent',
    border: 'border-slate-400/50',
    glow: 'shadow-[0_0_50px_-15px_rgba(148,163,184,0.4)]',
    textGlow: 'text-slate-300',
    ringColor: 'ring-slate-400/30',
    icon: '2',
    height: 'h-40',
    delay: 'delay-300',
    avatarSize: 'xl' as const,
  },
  3: {
    bg: 'bg-gradient-to-b from-orange-700/20 via-orange-800/10 to-transparent',
    border: 'border-orange-700/50',
    glow: 'shadow-[0_0_50px_-15px_rgba(194,65,12,0.4)]',
    textGlow: 'text-orange-400',
    ringColor: 'ring-orange-600/30',
    icon: '3',
    height: 'h-36',
    delay: 'delay-500',
    avatarSize: 'xl' as const,
  },
};

function PodiumCard({ player, rank, onClick }: { player: LeaderEntry; rank: 1 | 2 | 3; onClick?: () => void }) {
  const style = PODIUM_STYLES[rank];
  const tierColor = TIER_COLORS[player.tier];

  return (
    <div className={`relative flex flex-col justify-end ${rank === 2 ? 'order-2 md:order-none' : rank === 1 ? 'order-1 md:order-none' : 'order-3 md:order-none'}`}>
      <div
        className={`
          animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both
          ${style.delay}
        `}
      >
        {/* Glow effect behind card */}
        <div
          className="absolute inset-0 blur-2xl opacity-30 rounded-3xl"
          style={{ backgroundColor: tierColor?.glow || 'transparent' }}
        />

        <div
          onClick={onClick}
          className={`
            relative rounded-2xl border-2 backdrop-blur-sm p-6 transition-all duration-300
            hover:-translate-y-3 hover:scale-[1.03] group
            ${style.bg} ${style.border} ${style.glow}
            ${onClick ? 'cursor-pointer' : ''}
            mb-4 ring-2 ${style.ringColor}
          `}
        >
          {/* Rank Badge */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2">
            <div
              className={`
                w-14 h-14 rounded-full border-3 flex items-center justify-center text-2xl font-bold
                bg-background shadow-xl ring-2 ${style.ringColor}
                ${style.border} transition-transform group-hover:scale-110 group-hover:rotate-6
                ${style.textGlow}
              `}
            >
              {style.icon}
            </div>
          </div>

          {/* Player Info */}
          <div className="mt-8 text-center space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className={`${style.avatarSize === '2xl' ? 'w-24 h-24' : 'w-20 h-20'} rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ${style.ringColor}`}>
                {player.userAvatar ? (
                  <img src={player.userAvatar} alt={player.userName} className="w-full h-full object-cover" />
                ) : (
                  <span className={`${style.avatarSize === '2xl' ? 'text-3xl' : 'text-2xl'} font-bold text-muted-foreground`}>
                    {player.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <h3 className={`text-lg font-bold ${style.textGlow} tracking-tight truncate px-2 drop-shadow-sm`}>
                {player.userName}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Rank #{player.rank}</p>
            </div>

            {/* Tier */}
            <div className="flex justify-center">
              <TierBadge tier={player.tier} size="lg" provisional={player.provisional} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{player.winRate}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{player.matchesPlayed}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Matches</div>
              </div>
            </div>
          </div>
        </div>

        {/* Podium Base */}
        <div
          className={`
            rounded-t-xl border-x-2 border-t-2 flex items-end justify-center
            bg-gradient-to-b from-background/90 to-background/30 backdrop-blur-sm
            ${style.border} ${style.height} transition-all duration-300 group-hover:opacity-80
            hidden md:flex
          `}
        >
          <div className={`text-9xl font-black opacity-10 mb-4 ${style.textGlow}`}>
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
        <h3 className="text-xl font-bold text-foreground mb-2">No Rankings Yet</h3>
        <p className="text-muted-foreground">
          Complete tournaments to see the top players appear on the podium.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      {seasonName && (
        <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-4xl font-bold text-foreground tracking-tight mb-2">
            Top Players
          </h2>
          <p className="text-muted-foreground font-medium text-lg">{seasonName}</p>
        </div>
      )}

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto px-4">
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
