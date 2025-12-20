'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatGameName } from '@/lib/formatters';
import { LeaderboardPodium } from '@/components/LeaderboardPodium';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { PlayerHistoryModal } from '@/components/PlayerHistoryModal';
import { Search, Download, RotateCcw, AlertTriangle, Trophy, Calendar, ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react';
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

  // Season management
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [showSeasonManagement, setShowSeasonManagement] = useState(false);
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New season form
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState('');
  const [newSeasonEndDate, setNewSeasonEndDate] = useState('');

  // Load seasons on mount
  useEffect(() => {
    loadSeasons();
  }, []);

  // Auto-select active season when switching to seasonal view
  useEffect(() => {
    if (viewMode === 'seasonal' && activeSeason && !selectedSeason) {
      setSelectedSeason(activeSeason);
    }
  }, [viewMode, activeSeason, selectedSeason]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load leaderboard when game, view mode, season, or search changes
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
        // Transform seasonal data to match lifetime format
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
    <div className="animate-in fade-in duration-700 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Player Rankings
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {viewMode === 'lifetime'
              ? 'Lifetime ratings and competitive tiers across all games'
              : selectedSeason
                ? `${selectedSeason.name} - Seasonal Rankings`
                : 'Select a season to view rankings'}
          </p>
        </div>

        {/* Game Type Tabs */}
        <div className="bg-muted/30 p-1 rounded-xl inline-flex self-start md:self-center">
          {GAME_TYPES.map((game) => (
            <button
              key={game.value}
              onClick={() => {
                setSelectedGame(game.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${selectedGame === game.value
                  ? 'bg-background text-foreground shadow-sm scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              {game.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle & Season Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Lifetime vs Seasonal Toggle */}
        <div className="bg-muted/30 p-1 rounded-lg inline-flex">
          <button
            onClick={() => {
              setViewMode('lifetime');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
              viewMode === 'lifetime'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Lifetime
          </button>
          <button
            onClick={() => {
              setViewMode('seasonal');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
              viewMode === 'seasonal'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Seasonal
          </button>
        </div>

        {/* Season Selector (only show in seasonal mode) */}
        {viewMode === 'seasonal' && (
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedSeason?.id || ''}
              onChange={(e) => {
                const season = seasons.find(s => s.id === e.target.value);
                setSelectedSeason(season || null);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">Select a season...</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} ({season.status}) - {new Date(season.startDate).toLocaleDateString()} to {new Date(season.endDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Season Management Toggle */}
        <button
          onClick={() => setShowSeasonManagement(!showSeasonManagement)}
          className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Manage Seasons
          {showSeasonManagement ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Season Management Section */}
      {showSeasonManagement && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Season Management
            </CardTitle>
            <CardDescription>Create and manage ranked seasons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Season Info */}
            {activeSeason && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{activeSeason.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activeSeason.startDate).toLocaleDateString()} - {new Date(activeSeason.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    ACTIVE
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInitializeSeasonRatings(activeSeason.id)}
                    disabled={actionLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Initialize Ratings
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateSeasonStatus(activeSeason.id, 'COMPLETED')}
                    disabled={actionLoading}
                  >
                    Complete Season
                  </Button>
                </div>
              </div>
            )}

            {/* Create New Season */}
            {!showCreateSeason ? (
              <Button onClick={() => setShowCreateSeason(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Season
              </Button>
            ) : (
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="seasonName">Season Name</Label>
                  <Input
                    id="seasonName"
                    placeholder="e.g., Spring 2025"
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newSeasonStartDate}
                      onChange={(e) => setNewSeasonStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
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
                    Create Season
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateSeason(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* All Seasons List */}
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">All Seasons</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {seasons.map((season) => (
                  <div
                    key={season.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{season.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            season.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-400'
                              : season.status === 'COMPLETED'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {season.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {season.status === 'UPCOMING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateSeasonStatus(season.id, 'ACTIVE')}
                          disabled={actionLoading}
                        >
                          Activate
                        </Button>
                      )}
                      {season.status === 'ACTIVE' && season.id !== activeSeason?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateSeasonStatus(season.id, 'COMPLETED')}
                          disabled={actionLoading}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Reset Button */}
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2 bg-destructive/5 border border-destructive/20 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center animate-in fade-in slide-in-from-top-2">
          <p className="text-destructive font-medium flex items-center justify-center gap-2">
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
            <h2 className="text-xl font-bold text-foreground">
              {searchQuery ? 'Search Results' : 'All Players'}
            </h2>
            <div className="text-sm text-muted-foreground">
              Showing {leaderboardData?.ratings?.length || 0} players
            </div>
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
        <div className="bg-card/50 border border-border rounded-2xl p-12 text-center mt-8 animate-in fade-in zoom-in">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-xl p-6 max-w-md w-full border border-destructive/30 shadow-2xl animate-in zoom-in-95 duration-200">
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
                className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted/50 transition disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetRatings}
                disabled={resetting}
                className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition disabled:opacity-50 flex items-center gap-2 font-medium"
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
