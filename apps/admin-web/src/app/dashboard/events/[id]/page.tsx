'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useEventSocket } from '@/hooks/useEventSocket';
import { MatchResultModal } from '@/components/MatchResultModal';
import { PrizeDistributionModal } from '@/components/PrizeDistributionModal';
import { formatGameName, formatEventFormat } from '@/lib/formatters';

interface Event {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  startAt: string;
  maxPlayers?: number;
  totalPrizeCredits?: number;
  prizesDistributed?: boolean;
  prizesDistributedAt?: string;
  entries: Array<{
    id: string;
    userId: string;
    registeredAt: string;
    checkedInAt?: string;
    droppedAt?: string;
    paidAt?: string;
    paidAmount?: number;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  rounds: Array<{
    id: string;
    roundNumber: number;
    status: string;
    startAt?: string;
    endAt?: string;
  }>;
}

interface Pairing {
  id: string;
  tableNumber: number;
  playerA: {
    id: string;
    name: string;
  };
  playerB?: {
    id: string;
    name: string;
  };
  result?: string;
  gamesWonA?: number;
  gamesWonB?: number;
}

interface Standing {
  userId: string;
  userName: string;
  rank: number;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  omwPercent: number;
  gwPercent: number;
  oomwPercent: number;
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [activeTab, setActiveTab] = useState<'players' | 'rounds' | 'standings'>('players');
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Pairing | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [dropping, setDropping] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [lateAddModalOpen, setLateAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Socket.IO for real-time updates
  useEventSocket(eventId, {
    onPairingsPosted: (data) => {
      console.log('Pairings posted:', data);
      loadEvent();
      if (selectedRound) {
        loadPairings(selectedRound);
      }
    },
    onMatchResultReported: (data) => {
      console.log('Match result reported:', data);
      if (selectedRound) {
        loadPairings(selectedRound);
      }
    },
    onStandingsUpdated: (data) => {
      console.log('Standings updated:', data);
      if (activeTab === 'standings') {
        loadStandings();
      }
    },
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (selectedRound) {
      loadPairings(selectedRound);
    }
  }, [selectedRound]);

  useEffect(() => {
    if (activeTab === 'standings' && event) {
      loadStandings();
    }
  }, [activeTab, event]);

  const loadEvent = async () => {
    try {
      const data = await api.getEvent(eventId);
      setEvent(data);
      if (data.rounds.length > 0) {
        setSelectedRound(data.rounds[data.rounds.length - 1].id);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const loadPairings = async (roundId: string) => {
    try {
      const data = await api.getPairings(roundId);
      setPairings(data);
    } catch (error) {
      console.error('Failed to load pairings:', error);
    }
  };

  const loadStandings = async () => {
    try {
      const data = await api.getStandings(eventId);
      setStandings(data);
    } catch (error) {
      console.error('Failed to load standings:', error);
    }
  };

  const handleCreateRound = async () => {
    if (!event) return;

    const checkedIn = event.entries.filter((e) => e.checkedInAt && !e.droppedAt).length;
    if (checkedIn < 2) {
      alert('Need at least 2 checked-in players to create a round');
      return;
    }

    if (!confirm(`Create Round ${(event.rounds.length || 0) + 1} with ${checkedIn} players?`)) {
      return;
    }

    try {
      await api.createNextRound(eventId);
      await loadEvent();
      setActiveTab('rounds');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create round');
    }
  };

  const handleCheckIn = async (entryId: string) => {
    setCheckingIn(entryId);
    try {
      await api.checkInEntry(entryId);
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in player');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleBulkCheckIn = async () => {
    if (!event) return;

    const uncheckedEntries = event.entries.filter(
      (e) => !e.checkedInAt && !e.droppedAt
    );

    if (uncheckedEntries.length === 0) {
      alert('No players to check in');
      return;
    }

    if (!confirm(`Check in ${uncheckedEntries.length} player(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        uncheckedEntries.map((entry) => api.checkInEntry(entry.id))
      );
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in players');
    }
  };

  const handleDropPlayer = async (entryId: string, playerName: string) => {
    if (!event) return;

    const currentRound = event.rounds.length;

    if (!confirm(`Drop ${playerName} from the tournament? This will remove them from future rounds.`)) {
      return;
    }

    setDropping(entryId);
    try {
      await api.dropPlayer(entryId, currentRound);
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to drop player');
    } finally {
      setDropping(null);
    }
  };

  const handleOpenResultModal = (match: Pairing) => {
    setSelectedMatch(match);
    setResultModalOpen(true);
  };

  const handleSubmitResult = async (
    result: string,
    gamesWonA: number,
    gamesWonB: number
  ) => {
    if (!selectedMatch) return;

    await api.reportMatchResult(selectedMatch.id, result, gamesWonA, gamesWonB);

    // Reload pairings and standings
    if (selectedRound) {
      await loadPairings(selectedRound);
    }
    await loadStandings();
  };

  const handleDistributePrizes = async (
    distributions: Array<{ userId: string; amount: number; placement: number }>
  ) => {
    if (!event) return;

    await api.distributePrizes(eventId, distributions);
    await loadEvent();
    alert('Prize credits distributed successfully!');
  };

  const loadOrgUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await api.getOrgUsers();
      // Filter out already registered players
      const registeredUserIds = new Set(event?.entries.map(e => e.userId) || []);
      setOrgUsers(users.filter((u: any) => !registeredUserIds.has(u.id)));
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddLatePlayer = async () => {
    if (!selectedUserId) {
      alert('Please select a player');
      return;
    }

    try {
      await api.addLatePlayer(eventId, selectedUserId);
      await loadEvent();
      setLateAddModalOpen(false);
      setSelectedUserId('');
      alert('Player added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add player');
    }
  };

  const handleMarkAsPaid = async (entryId: string, playerName: string) => {
    if (!confirm(`Mark ${playerName} as paid?`)) {
      return;
    }

    setMarkingPaid(entryId);
    try {
      await api.markEntryAsPaid(entryId);
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setMarkingPaid(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-lg">
        {error || 'Event not found'}
      </div>
    );
  }

  const checkedInCount = event.entries.filter((e) => e.checkedInAt && !e.droppedAt).length;

  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {event.name}
            </h1>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>🎮 {formatGameName(event.game)}</span>
              <span>📋 {formatEventFormat(event.format)}</span>
              <span>
                📅{' '}
                {new Date(event.startAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-400' :
                event.status === 'IN_PROGRESS' ? 'bg-green-500/10 text-green-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {event.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">
              {checkedInCount}
            </div>
            <div className="text-sm text-muted-foreground">Checked In</div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleCreateRound}
            disabled={checkedInCount < 2}
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Round {(event.rounds.length || 0) + 1}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg border border-border">
        <div className="border-b border-border">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('players')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'players'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Players ({event.entries.length})
            </button>
            <button
              onClick={() => setActiveTab('rounds')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'rounds'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Rounds ({event.rounds.length})
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'standings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Standings
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Players Tab */}
          {activeTab === 'players' && (
            <div>
              {event.entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No players registered yet
                </p>
              ) : (
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <button
                      onClick={handleBulkCheckIn}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      Check In All
                    </button>
                    <button
                      onClick={() => {
                        setLateAddModalOpen(true);
                        loadOrgUsers();
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      + Add Late Player
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 font-medium text-muted-foreground">Name</th>
                          <th className="pb-3 font-medium text-muted-foreground">Email</th>
                          <th className="pb-3 font-medium text-muted-foreground">Registered</th>
                          <th className="pb-3 font-medium text-muted-foreground">Payment</th>
                          <th className="pb-3 font-medium text-muted-foreground">Status</th>
                          <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {event.entries.map((entry) => {
                          const requiresPayment = event.entryFeeCents && event.entryFeeCents > 0;
                          return (
                          <tr key={entry.id} className="border-b border-border/50">
                            <td className="py-3 font-medium text-foreground">
                              {entry.user.name}
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {entry.user.email}
                            </td>
                            <td className="py-3 text-muted-foreground text-sm">
                              {new Date(entry.registeredAt).toLocaleString()}
                            </td>
                            <td className="py-3">
                              {!requiresPayment ? (
                                <span className="text-xs text-muted-foreground">Free</span>
                              ) : entry.paidAt ? (
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                                  Paid
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium">
                                  Unpaid
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              {entry.droppedAt ? (
                                <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">
                                  Dropped
                                </span>
                              ) : entry.checkedInAt ? (
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                                  Checked In
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                                  Registered
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {requiresPayment && !entry.paidAt && !entry.droppedAt && (
                                  <button
                                    onClick={() => handleMarkAsPaid(entry.id, entry.user.name)}
                                    disabled={markingPaid === entry.id}
                                    className="text-sm bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                                  >
                                    {markingPaid === entry.id ? 'Marking...' : 'Mark Paid'}
                                  </button>
                                )}
                                {!entry.checkedInAt && !entry.droppedAt && (!requiresPayment || entry.paidAt) && (
                                  <button
                                    onClick={() => handleCheckIn(entry.id)}
                                    disabled={checkingIn === entry.id}
                                    className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                  >
                                    {checkingIn === entry.id ? 'Checking In...' : 'Check In'}
                                  </button>
                                )}
                                {entry.checkedInAt && !entry.droppedAt && (
                                  <button
                                    onClick={() => handleDropPlayer(entry.id, entry.user.name)}
                                    disabled={dropping === entry.id}
                                    className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                  >
                                    {dropping === entry.id ? 'Dropping...' : 'Drop'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rounds Tab */}
          {activeTab === 'rounds' && (
            <div>
              {event.rounds.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No rounds created yet. Click "Create Round 1" to start the tournament.
                </p>
              ) : (
                <div>
                  {/* Round Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Select Round
                    </label>
                    <select
                      value={selectedRound || ''}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    >
                      {event.rounds.map((round) => (
                        <option key={round.id} value={round.id}>
                          Round {round.roundNumber} - {round.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pairings */}
                  {pairings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Loading pairings...
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-3 font-medium text-muted-foreground">Table</th>
                            <th className="pb-3 font-medium text-muted-foreground">Player A</th>
                            <th className="pb-3 font-medium text-muted-foreground">Player B</th>
                            <th className="pb-3 font-medium text-muted-foreground">Result</th>
                            <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pairings.map((pairing) => (
                            <tr key={pairing.id} className="border-b border-border/50">
                              <td className="py-3 font-bold text-foreground">
                                {pairing.tableNumber}
                              </td>
                              <td className="py-3 text-foreground">
                                {pairing.playerA.name}
                              </td>
                              <td className="py-3 text-foreground">
                                {pairing.playerB ? pairing.playerB.name : '— BYE —'}
                              </td>
                              <td className="py-3">
                                {pairing.result ? (
                                  <span className="text-sm text-muted-foreground">
                                    {pairing.result.replace('PLAYER_A_WIN', 'A Wins')
                                      .replace('PLAYER_B_WIN', 'B Wins')
                                      .replace('DRAW', 'Draw')
                                      .replace('INTENTIONAL_DRAW', 'ID')}
                                    {pairing.gamesWonA !== undefined &&
                                      ` (${pairing.gamesWonA}-${pairing.gamesWonB})`}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not reported</span>
                                )}
                              </td>
                              <td className="py-3">
                                {!pairing.result && pairing.playerB && (
                                  <button
                                    onClick={() => handleOpenResultModal(pairing)}
                                    className="text-sm bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition"
                                  >
                                    Report Result
                                  </button>
                                )}
                                {!pairing.result && !pairing.playerB && (
                                  <span className="text-sm text-muted-foreground">Auto Win</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Standings Tab */}
          {activeTab === 'standings' && (
            <div>
              {standings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No standings available yet. Create a round to start the tournament.
                </p>
              ) : (
                <div>
                  {/* Action Buttons */}
                  <div className="mb-4 flex items-center gap-3">
                    {event.totalPrizeCredits && event.totalPrizeCredits > 0 && !event.prizesDistributed && (
                      <button
                        onClick={() => setPrizeModalOpen(true)}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition"
                      >
                        💰 Distribute {event.totalPrizeCredits} Prize Credits
                      </button>
                    )}
                    <button
                      onClick={() => api.exportStandings(eventId)}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      📥 Export CSV
                    </button>
                  </div>
                  {event.prizesDistributed && (
                    <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
                      ✅ Prize credits have been distributed{event.prizesDistributedAt && ` on ${new Date(event.prizesDistributedAt).toLocaleDateString()}`}
                    </div>
                  )}
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Rank</th>
                        <th className="pb-3 font-medium text-muted-foreground">Player</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Points</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Record</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">OMW%</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">GW%</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">OOMW%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((standing) => (
                        <tr key={standing.userId} className="border-b border-border/50">
                          <td className="py-3 font-bold text-foreground">
                            {standing.rank}
                          </td>
                          <td className="py-3 text-foreground">
                            {standing.userName}
                          </td>
                          <td className="py-3 font-bold text-foreground text-right">
                            {standing.points}
                          </td>
                          <td className="py-3 text-muted-foreground text-right">
                            {standing.matchWins}-{standing.matchLosses}-{standing.matchDraws}
                          </td>
                          <td className="py-3 text-muted-foreground text-right">
                            {(standing.omwPercent * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 text-muted-foreground text-right">
                            {(standing.gwPercent * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 text-muted-foreground text-right">
                            {(standing.oomwPercent * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Match Result Modal */}
      {selectedMatch && (
        <MatchResultModal
          isOpen={resultModalOpen}
          onClose={() => {
            setResultModalOpen(false);
            setSelectedMatch(null);
          }}
          onSubmit={handleSubmitResult}
          match={selectedMatch}
        />
      )}

      {/* Prize Distribution Modal */}
      {event && (
        <PrizeDistributionModal
          isOpen={prizeModalOpen}
          onClose={() => setPrizeModalOpen(false)}
          onSubmit={handleDistributePrizes}
          standings={standings}
          totalPrizeCredits={event.totalPrizeCredits || 0}
          eventName={event.name}
        />
      )}

      {/* Late Add Player Modal */}
      {lateAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-foreground">Add Late Player</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Player will be automatically checked in upon addition.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Player
              </label>
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Loading players...</p>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="">Choose a player...</option>
                  {orgUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setLateAddModalOpen(false);
                  setSelectedUserId('');
                }}
                className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLatePlayer}
                disabled={!selectedUserId}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                Add Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
