interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
}

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: string | null;
  onSeasonChange: (seasonId: string) => void;
  onCreateSeason?: () => void;
}

export function SeasonSelector({
  seasons,
  selectedSeasonId,
  onSeasonChange,
  onCreateSeason,
}: SeasonSelectorProps) {
  const activeSeason = seasons.find((s) => s.status === 'ACTIVE');
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Season</h3>
          {activeSeason && selectedSeasonId === activeSeason.id && (
            <p className="text-sm text-green-400 flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Active Season
            </p>
          )}
        </div>
        {onCreateSeason && (
          <button
            onClick={onCreateSeason}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition text-sm"
          >
            + Create Season
          </button>
        )}
      </div>

      <div className="space-y-3">
        <select
          value={selectedSeasonId || ''}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
        >
          <option value="" disabled>
            Select a season...
          </option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
              {season.status === 'ACTIVE' && ' (Active)'}
              {season.status === 'COMPLETED' && ' (Completed)'}
            </option>
          ))}
        </select>

        {selectedSeason && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
            <div>
              <span className="font-medium">Start:</span>{' '}
              {new Date(selectedSeason.startDate).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">End:</span>{' '}
              {new Date(selectedSeason.endDate).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
