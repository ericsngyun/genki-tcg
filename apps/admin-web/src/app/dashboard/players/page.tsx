'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatGameName } from '@/lib/formatters';
import { LeaderboardPodium } from '@/components/LeaderboardPodium';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { PlayerHistoryModal } from '@/components/PlayerHistoryModal';
import { Search, Download, RotateCcw, AlertTriangle, Calendar, ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type GameType = 'ONE_PIECE_TCG' | 'AZUKI_TCG' | 'RIFTBOUND';
type ViewMode = 'lifetime' | 'seasonal';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  _count?: {
    events: number;
    seasonalRatings: number;
  };
}

const GAME_TYPES: { value: GameType; label: string }[] = [
  { value: 'ONE_PIECE_TCG', label: 'One Piece' },
  { value: 'AZUKI_TCG', label: 'Azuki' },
  { value: 'RIFTBOUND', label: 'Riftbound' },
];

export default function PlayersPage() {
  const [selectedGame, setSelectedGame] = useState<GameType>('ONE_PIECE_TCG');
  const [viewMode, setViewMode] = useState<ViewMode>('lifetime');
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

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [showSeasonManagement, setShowSeasonManagement] = useState(false);
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState('');
  const [newSeasonEndDate, setNewSeasonEndDate] = useState('');

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (viewMode === 'seasonal' && activeSeason && !selectedSeason) {
      setSelectedSeason(activeSeason);
    }
  }, [viewMode, activeSeason, selectedSeason]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadLeaderboard(currentPage);
  }, [selectedGame, viewMode, selectedSeason, currentPage, searchDebounce]);

  const loadSeasons = async () => {
    try {
      const [seasonsData, activeSeasonData] = await Promise.all([
        api.getSeasons(),
        api.getActiveSeason().catch(() => null),
      ]);
      setSeasons(seasonsData);
      setActiveSeason(activeSeasonData);
      if (activeSeasonData && viewMode === 'seasonal') {
        setSelectedSeason(activeSeasonData);
      }
    } catch (error: any) {
      console.error('Failed to load seasons:', error);
    }
  };

  const loadLeaderboard = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const pageSize = 50;
      const offset = (page - 1) * pageSize;

      let data;
      if (viewMode === 'lifetime') {
        data = await api.getLifetimeLeaderboard(selectedGame, {
          limit: pageSize,
          offset,
          search: searchDebounce || undefined,
        });
      } else if (selectedSeason) {
        data = await api.getSeasonLeaderboard(selectedSeason.id, selectedGame, {
          limit: pageSize,
          offset,
        });
        data = {
          ratings: data.entries?.map((entry: any, index: number) => ({
            ...entry,
            rank: offset + index + 1,
          })) || [],
          page,
          totalPages: Math.ceil((data.total || 0) / pageSize),
        };
      }

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

  const handleCreateSeason = async () => {
    if (!newSeasonName || !newSeasonStartDate || !newSeasonEndDate) {
      alert('Please fill in all fields');
      return;
    }

    setActionLoading(true);
    try {
      await api.createSeason({
        name: newSeasonName,
        startDate: newSeasonStartDate,
        endDate: newSeasonEndDate,
      });
      alert('Season created successfully');
      setNewSeasonName('');
      setNewSeasonStartDate('');
      setNewSeasonEndDate('');
      setShowCreateSeason(false);
      await loadSeasons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create season');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitializeSeasonRatings = async (seasonId: string) => {
    if (!confirm('Initialize all player ratings for this season? This will copy lifetime ratings as the starting point.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.initializeSeasonRatings(seasonId);
      alert('Season ratings initialized successfully');
      await loadSeasons();
      await loadLeaderboard(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to initialize ratings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSeasonStatus = async (seasonId: string, status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED') => {
    setActionLoading(true);
    try {
      await api.updateSeasonStatus(seasonId, status);
      alert(`Season status updated to ${status}`);
      await loadSeasons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update season status');
    } finally {
      setActionLoading(false);
    }
  };

  const topThree = leaderboardData?.ratings?.slice(0, 3) || [];
  const allEntries = leaderboardData?.ratings || [];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Player Rankings</h1>
          <p className="text-white/40 mt-1">
            {viewMode === 'lifetime'
              ? 'Lifetime ratings and competitive tiers'
              : selectedSeason
                ? `${selectedSeason.name} - Seasonal Rankings`
                : 'Select a season to view rankings'}
          </p>
        </div>

        {/* Game Type Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          {GAME_TYPES.map((game) => (
            <button
              key={game.value}
              onClick={() => {
                setSelectedGame(game.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedGame === game.value
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {game.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <button
            onClick={() => {
              setViewMode('lifetime');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === 'lifetime'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Lifetime
          </button>
          <button
            onClick={() => {
              setViewMode('seasonal');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === 'seasonal'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Seasonal
          </button>
        </div>

        {/* Season Selector */}
        {viewMode === 'seasonal' && (
          <select
            value={selectedSeason?.id || ''}
            onChange={(e) => {
              const season = seasons.find(s => s.id === e.target.value);
              setSelectedSeason(season || null);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
          >
            <option value="">Select a season...</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} ({season.status})
              </option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        {/* Season Management */}
        <button
          onClick={() => setShowSeasonManagement(!showSeasonManagement)}
          className="px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Seasons
          {showSeasonManagement ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Season Management Panel */}
      {showSeasonManagement && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6 animate-slide-down">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Season Management</h3>
          </div>

          {activeSeason && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">{activeSeason.name}</h4>
                  <p className="text-sm text-white/40">
                    {new Date(activeSeason.startDate).toLocaleDateString()} - {new Date(activeSeason.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                  ACTIVE
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInitializeSeasonRatings(activeSeason.id)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Init Ratings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateSeasonStatus(activeSeason.id, 'COMPLETED')}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Complete
                </Button>
              </div>
            </div>
          )}

          {!showCreateSeason ? (
            <Button onClick={() => setShowCreateSeason(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Season
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="seasonName" className="text-white/60">Season Name</Label>
                <Input
                  id="seasonName"
                  placeholder="e.g., Spring 2025"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-white/60">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSeasonStartDate}
                    onChange={(e) => setNewSeasonStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-white/60">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newSeasonEndDate}
                    onChange={(e) => setNewSeasonEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateSeason} disabled={actionLoading}>
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreateSeason(false)} disabled={actionLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {seasons.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white/60">All Seasons</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {seasons.map((season) => (
                  <div
                    key={season.id}
                    className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{season.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          season.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : season.status === 'COMPLETED'
                            ? 'bg-white/5 text-white/40'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {season.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/30">
                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {season.status === 'UPCOMING' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateSeasonStatus(season.id, 'ACTIVE')} disabled={actionLoading} className="text-xs h-7">
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 font-medium flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      {/* Podium */}
      {!error && topThree.length > 0 && !searchQuery && currentPage === 1 && (
        <div className="py-4">
          <LeaderboardPodium
            topThree={topThree}
            onPlayerClick={handlePlayerClick}
          />
        </div>
      )}

      {/* Full Leaderboard */}
      {!error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {searchQuery ? 'Search Results' : 'All Players'}
            </h2>
            <span className="text-sm text-white/40">
              {leaderboardData?.ratings?.length || 0} players
            </span>
          </div>

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
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery ? 'No Players Found' : 'No Rankings Yet'}
          </h3>
          <p className="text-white/40 text-sm">
            {searchQuery
              ? `No players match "${searchQuery}"`
              : `Complete tournaments to see rankings`}
          </p>
        </div>
      )}

      {/* Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Reset All Ratings?</h3>
                <p className="text-white/40 text-sm">
                  This will permanently delete all ratings for{' '}
                  <span className="text-white">{formatGameName(selectedGame)}</span>.
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-6">
              <ul className="text-xs text-white/40 space-y-1">
                <li>All player ratings will be deleted</li>
                <li>All rating history will be lost</li>
                <li>This cannot be undone</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetModalOpen(false)}
                disabled={resetting}
                className="px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white/60 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetRatings}
                disabled={resetting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Ratings'
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
