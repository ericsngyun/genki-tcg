'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Tournament {
  id: string;
  name: string;
  game: string;
  playerCount: number;
  completedAt: string | null;
}

interface RatingChange {
  playerName: string;
  ratingBefore: number;
  ratingAfter: number;
  change: number;
  tierBefore: string;
  tierAfter: string;
}

export default function RatingsPage() {
  const [loading, setLoading] = useState(false);
  const [unprocessedLoading, setUnprocessedLoading] = useState(false);
  const [unprocessedTournaments, setUnprocessedTournaments] = useState<Tournament[]>([]);
  const [result, setResult] = useState<{
    tournament: Tournament;
    topRatingChanges: RatingChange[];
    totalPlayersProcessed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkUnprocessed = async () => {
    setUnprocessedLoading(true);
    setError(null);
    try {
      const response = await api.fetch('/ratings/unprocessed-tournaments');
      setUnprocessedTournaments(response.tournaments);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load unprocessed tournaments');
    } finally {
      setUnprocessedLoading(false);
    }
  };

  const processLatest = async (gameType: string) => {
    if (!confirm(`Process ratings for the latest ${gameType} tournament?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.fetch(`/ratings/process-latest/${gameType}`, {
        method: 'POST',
      });
      setResult(response);
      // Refresh unprocessed list
      checkUnprocessed();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process ratings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Rating Management</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Process player ratings for completed tournaments
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <button
          onClick={() => processLatest('AZUKI_TCG')}
          disabled={loading}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-6 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="text-4xl mb-3">🎴</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Azuki TCG</h3>
            <p className="text-sm text-muted-foreground">
              Process latest completed tournament
            </p>
          </div>
        </button>

        <button
          onClick={() => processLatest('ONE_PIECE_TCG')}
          disabled={loading}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-6 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="text-4xl mb-3">🏴‍☠️</div>
            <h3 className="text-xl font-bold text-foreground mb-2">One Piece TCG</h3>
            <p className="text-sm text-muted-foreground">
              Process latest completed tournament
            </p>
          </div>
        </button>

        <button
          onClick={() => processLatest('RIFTBOUND')}
          disabled={loading}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-6 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="text-4xl mb-3">⚔️</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Riftbound</h3>
            <p className="text-sm text-muted-foreground">
              Process latest completed tournament
            </p>
          </div>
        </button>
      </div>

      {/* Check Unprocessed Button */}
      <div className="mb-6">
        <button
          onClick={checkUnprocessed}
          disabled={unprocessedLoading}
          className="bg-card border border-border px-6 py-3 rounded-xl font-semibold hover:bg-card/80 transition-all disabled:opacity-50"
        >
          {unprocessedLoading ? 'Checking...' : '🔍 Check Unprocessed Tournaments'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-8 text-center backdrop-blur-sm mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-blue-400 font-medium">Processing tournament ratings...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="text-lg font-bold text-destructive mb-1">Error</h3>
              <p className="text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Unprocessed Tournaments List */}
      {unprocessedTournaments.length > 0 && (
        <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Unprocessed Tournaments</h2>
          <div className="space-y-3">
            {unprocessedTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-background/50 rounded-lg border border-border p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-foreground">{tournament.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tournament.game} • {tournament.playerCount} players
                    {tournament.completedAt && ` • ${new Date(tournament.completedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => processLatest(tournament.game)}
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Process
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {unprocessedTournaments.length === 0 && !unprocessedLoading && unprocessedTournaments !== null && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center backdrop-blur-sm mb-6">
          <span className="text-4xl mb-3 block">✅</span>
          <h3 className="text-lg font-bold text-green-400 mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No tournaments need rating processing</p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start gap-3 mb-6">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-1">Ratings Processed Successfully!</h3>
              <p className="text-foreground">
                {result.tournament.name} • {result.totalPlayersProcessed} players updated
              </p>
            </div>
          </div>

          {result.topRatingChanges.length > 0 && (
            <>
              <h4 className="text-lg font-bold text-foreground mb-4">Top Rating Changes:</h4>
              <div className="space-y-2">
                {result.topRatingChanges.map((change, index) => (
                  <div
                    key={index}
                    className="bg-background/30 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-foreground">{change.playerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {change.tierBefore} → {change.tierAfter}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">
                        {change.ratingBefore} → {change.ratingAfter}
                      </div>
                      <div className={`text-sm font-bold ${change.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change.change >= 0 ? '+' : ''}{change.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-10 bg-card/30 backdrop-blur-sm rounded-xl border border-border border-dashed p-6">
        <h3 className="text-lg font-bold text-foreground mb-2">ℹ️ About Rating Processing</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Ratings are calculated using the Glicko-2 algorithm</li>
          <li>• Both lifetime and seasonal ratings are updated</li>
          <li>• Future tournaments will process ratings automatically when completed</li>
          <li>• This tool is only needed for tournaments completed before auto-processing was enabled</li>
        </ul>
      </div>
    </div>
  );
}
