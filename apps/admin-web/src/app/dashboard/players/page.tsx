'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatGameName } from '@/lib/formatters';
import { LeaderboardPodium } from '@/components/LeaderboardPodium';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { PlayerHistoryModal } from '@/components/PlayerHistoryModal';
import { Search, Download, RotateCcw, AlertTriangle } from 'lucide-react';

type GameType = 'ONE_PIECE_TCG' | 'AZUKI_TCG' | 'RIFTBOUND';

const GAME_TYPES: { value: GameType; label: string }[] = [
  { value: 'ONE_PIECE_TCG', label: 'One Piece TCG' },
  { value: 'AZUKI_TCG', label: 'Azuki TCG' },
  { value: 'RIFTBOUND', label: 'Riftbound' },
];

export default function PlayersPage() {
  const [selectedGame, setSelectedGame] = useState<GameType>('ONE_PIECE_TCG');
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load leaderboard when game or search changes
  useEffect(() => {
    loadLeaderboard(currentPage);
  }, [selectedGame, currentPage, searchDebounce]);

  const loadLeaderboard = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const pageSize = 50;
      const offset = (page - 1) * pageSize;
      const data = await api.getLifetimeLeaderboard(selectedGame, {
        limit: pageSize,
        offset,
        search: searchDebounce || undefined,
      });
      setLeaderboardData(data);
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      setError(error.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExport = async () => {
    try {
      await api.exportLeaderboard(selectedGame);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to export leaderboard');
    }
  };

  const handleResetRatings = async () => {
    setResetting(true);
    try {
      const result = await api.resetCategoryRatings(selectedGame);
      alert(
        `Ratings reset successfully!\n\n` +
        `Deleted ${result.deletedLifetimeRatings} lifetime ratings\n` +
        `Deleted ${result.deletedSeasonalRatings} seasonal ratings\n` +
        `Deleted ${result.deletedHistoryEntries} history entries\n` +
        `Deleted ${result.deletedUpdates} rating updates`
      );
      setResetModalOpen(false);
      loadLeaderboard(1);
      setCurrentPage(1);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reset ratings');
    } finally {
      setResetting(false);
    }
  };

  const handlePlayerClick = useCallback((player: { userId: string; userName: string }) => {
    setSelectedPlayer({ id: player.userId, name: player.userName });
    setHistoryModalOpen(true);
  }, []);

  const topThree = leaderboardData?.ratings?.slice(0, 3) || [];
  const allEntries = leaderboardData?.ratings || [];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Player Rankings</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Lifetime ratings and competitive tiers across all games
        </p>
      </div>

      {/* Controls */}
      <div className="mb-8 space-y-4">
        {/* Game Type Tabs */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-1.5 inline-flex shadow-sm">
          {GAME_TYPES.map((game) => (
            <button
              key={game.value}
              onClick={() => {
                setSelectedGame(game.value);
                setCurrentPage(1);
              }}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                selectedGame === game.value
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {game.label}
            </button>
          ))}
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-card border border-border rounded-xl text-foreground hover:bg-muted/50 transition flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {/* Reset Button */}
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2.5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive hover:bg-destructive/20 transition flex items-center gap-2 font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Ratings
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center mb-8">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Podium */}
      {!error && topThree.length > 0 && (
        <LeaderboardPodium
          topThree={topThree}
          onPlayerClick={handlePlayerClick}
        />
      )}

      {/* Full Leaderboard */}
      {!error && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Full Rankings</h2>
          <LeaderboardTable
            entries={allEntries}
            currentPage={leaderboardData?.page || 1}
            totalPages={leaderboardData?.totalPages || 1}
            onPageChange={handlePageChange}
            loading={loading}
            onPlayerClick={handlePlayerClick}
          />
        </div>
      )}

      {/* Empty State */}
      {!error && !loading && allEntries.length === 0 && (
        <div className="bg-card/50 border border-border rounded-2xl p-12 text-center mt-8">
          <div className="text-4xl mb-4">🎮</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {searchQuery ? 'No Players Found' : 'No Rankings Yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? `No players match "${searchQuery}" for ${formatGameName(selectedGame)}`
              : `Complete tournaments for ${formatGameName(selectedGame)} to see rankings appear here.`}
          </p>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full border border-destructive/30 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Reset All Ratings?</h3>
                <p className="text-muted-foreground text-sm">
                  This will permanently delete all ratings, history, and statistics for{' '}
                  <span className="font-semibold text-foreground">
                    {formatGameName(selectedGame)}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive font-medium mb-2">⚠️ This action cannot be undone!</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li>All player ratings will be deleted</li>
                <li>All rating history will be lost</li>
                <li>All seasonal ratings will be removed</li>
                <li>This does NOT affect event results or standings</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              💡 <strong>Tip:</strong> Export the leaderboard to CSV first if you want to keep a backup.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetModalOpen(false)}
                disabled={resetting}
                className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted/50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetRatings}
                disabled={resetting}
                className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Yes, Reset All Ratings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player History Modal */}
      {selectedPlayer && (
        <PlayerHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedPlayer(null);
          }}
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          category={selectedGame}
        />
      )}
    </div>
  );
}
