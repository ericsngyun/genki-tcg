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

const gameCards = [
  { game: 'AZUKI_TCG', label: 'Azuki TCG', icon: '🎴' },
  { game: 'ONE_PIECE_TCG', label: 'One Piece TCG', icon: '🏴‍☠️' },
  { game: 'RIFTBOUND', label: 'Riftbound', icon: '⚔️' },
];

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
      checkUnprocessed();
    } catch (err: any) {
      console.error('Rating processing error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process ratings';

      if (errorMessage.includes('No unprocessed')) {
        setError(`No unprocessed ${gameType} tournaments found. All ratings are up to date!`);
      } else if (errorMessage.includes('already processed')) {
        setError(`This tournament's ratings have already been processed.`);
      } else {
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Rating Management</h1>
        <p className="text-white/40 mt-1">
          Process player ratings for completed tournaments
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gameCards.map((card) => (
          <button
            key={card.game}
            onClick={() => processLatest(card.game)}
            disabled={loading}
            className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-left transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.1] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">
              {card.label}
            </h3>
            <p className="text-sm text-white/40">
              Process latest tournament
            </p>
          </button>
        ))}
      </div>

      {/* Check Unprocessed Button */}
      <button
        onClick={checkUnprocessed}
        disabled={unprocessedLoading}
        className="px-6 py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.04] transition-all disabled:opacity-50"
      >
        {unprocessedLoading ? 'Checking...' : 'Check Unprocessed Tournaments'}
      </button>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-400 font-medium">Processing tournament ratings...</p>
          <p className="text-sm text-white/40 mt-1">This may take a few moments</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Unprocessed Tournaments List */}
      {unprocessedTournaments.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Unprocessed Tournaments</h2>
          <div className="space-y-2">
            {unprocessedTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium text-white">{tournament.name}</h3>
                  <p className="text-sm text-white/40">
                    {tournament.game} • {tournament.playerCount} players
                    {tournament.completedAt && ` • ${new Date(tournament.completedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => processLatest(tournament.game)}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Process
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All caught up state */}
      {unprocessedTournaments.length === 0 && !unprocessedLoading && unprocessedTournaments !== null && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-emerald-400 mb-1">All caught up!</h3>
          <p className="text-white/40 text-sm">No tournaments need rating processing</p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-1">Ratings Processed Successfully!</h3>
            <p className="text-white/60">
              {result.tournament.name} • {result.totalPlayersProcessed} players updated
            </p>
          </div>

          {result.topRatingChanges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">Top Rating Changes</h4>
              <div className="space-y-2">
                {result.topRatingChanges.map((change, index) => (
                  <div
                    key={index}
                    className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-white">{change.playerName}</div>
                      <div className="text-sm text-white/40">
                        {change.tierBefore} → {change.tierAfter}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">
                        {change.ratingBefore} → {change.ratingAfter}
                      </div>
                      <div className={`text-sm font-medium ${change.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change.change >= 0 ? '+' : ''}{change.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-white/[0.01] border border-white/[0.04] border-dashed rounded-xl p-6">
        <h3 className="text-sm font-medium text-white/60 mb-3">About Rating Processing</h3>
        <ul className="text-sm text-white/40 space-y-1.5">
          <li>• Ratings are calculated using the Glicko-2 algorithm</li>
          <li>• Both lifetime and seasonal ratings are updated</li>
          <li>• Future tournaments process ratings automatically</li>
          <li>• This tool is for tournaments completed before auto-processing</li>
        </ul>
      </div>
    </div>
  );
}
