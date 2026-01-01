'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useEventSocket } from '@/hooks/useEventSocket';
import { MatchResultModal } from '@/components/MatchResultModal';
import { PrizeDistributionModal } from '@/components/PrizeDistributionModal';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { formatGameName, formatEventFormat } from '@/lib/formatters';

interface Event {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  startAt: string;
  maxPlayers?: number;
  entryFeeCents?: number;
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
      avatarUrl?: string | null;
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
    avatarUrl?: string | null;
  };
  playerB?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  result?: string;
  gamesWonA?: number;
  gamesWonB?: number;
}

interface Standing {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
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
  const [roundActionLoading, setRoundActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEventSocket(eventId, {
    onPairingsPosted: () => {
      loadEvent();
      if (selectedRound) loadPairings(selectedRound);
    },
    onMatchResultReported: () => {
      if (selectedRound) loadPairings(selectedRound);
    },
    onStandingsUpdated: () => {
      if (activeTab === 'standings') loadStandings();
    },
  });

  useEffect(() => { loadEvent(); }, [eventId]);
  useEffect(() => { if (selectedRound) loadPairings(selectedRound); }, [selectedRound]);
  useEffect(() => { if (activeTab === 'standings' && event) loadStandings(); }, [activeTab, event]);

  const loadEvent = async () => {
    try {
      const data = await api.getEvent(eventId);
      setEvent(data);
      if (data.rounds.length > 0) setSelectedRound(data.rounds[data.rounds.length - 1].id);
    } catch (error: any) {
      console.error('Failed to load event:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load event';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadPairings = async (roundId: string) => {
    try {
      const data = await api.getPairings(roundId);
      setPairings(data);
    } catch (error: any) {
      console.error('Failed to load pairings:', error);
      toast.error('Failed to load pairings', {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const loadStandings = async () => {
    try {
      const data = await api.getStandings(eventId);
      setStandings(data);
    } catch (error: any) {
      console.error('Failed to load standings:', error);
      toast.error('Failed to load standings', {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleCreateRound = async () => {
    if (!event) return;
    const checkedIn = event.entries.filter((e) => e.checkedInAt && !e.droppedAt).length;
    if (checkedIn < 2) { alert('Need at least 2 checked-in players'); return; }
    if (!confirm(`Create Round ${(event.rounds.length || 0) + 1} with ${checkedIn} players?`)) return;
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
      alert(error.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleBulkCheckIn = async () => {
    if (!event) return;
    const unchecked = event.entries.filter((e) => !e.checkedInAt && !e.droppedAt);
    if (unchecked.length === 0) { alert('No players to check in'); return; }
    if (!confirm(`Check in ${unchecked.length} player(s)?`)) return;
    try {
      await Promise.all(unchecked.map((entry) => api.checkInEntry(entry.id)));
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in');
    }
  };

  const handleDropPlayer = async (entryId: string, playerName: string) => {
    if (!event) return;
    if (!confirm(`Drop ${playerName}?`)) return;
    setDropping(entryId);
    try {
      await api.dropPlayer(entryId, event.rounds.length);
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to drop');
    } finally {
      setDropping(null);
    }
  };

  const handleSubmitResult = async (result: string, gamesWonA: number, gamesWonB: number) => {
    if (!selectedMatch) return;
    await api.reportMatchResult(selectedMatch.id, result, gamesWonA, gamesWonB);
    if (selectedRound) await loadPairings(selectedRound);
    await loadStandings();
  };

  const handleDistributePrizes = async (distributions: Array<{ userId: string; amount: number; placement: number }>) => {
    if (!event) return;
    await api.distributePrizes(eventId, distributions);
    await loadEvent();
    alert('Prizes distributed!');
  };

  const loadOrgUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await api.getOrgUsers();
      const registered = new Set(event?.entries.map(e => e.userId) || []);
      setOrgUsers(users.filter((u: any) => !registered.has(u.id)));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddLatePlayer = async () => {
    if (!selectedUserId) { alert('Select a player'); return; }
    try {
      await api.addLatePlayer(eventId, selectedUserId);
      await loadEvent();
      setLateAddModalOpen(false);
      setSelectedUserId('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add player');
    }
  };

  const handleMarkAsPaid = async (entryId: string, playerName: string) => {
    if (!confirm(`Mark ${playerName} as paid?`)) return;
    setMarkingPaid(entryId);
    try {
      await api.markEntryAsPaid(entryId);
      await loadEvent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed');
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleStartRound = async (roundId: string) => {
    if (!confirm('Start this round?')) return;
    setRoundActionLoading(true);
    try {
      await api.startRound(roundId);
      await loadEvent();
      if (selectedRound) await loadPairings(selectedRound);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed');
    } finally {
      setRoundActionLoading(false);
    }
  };

  const handleCompleteRound = async (roundId: string) => {
    if (!confirm('Complete this round?')) return;
    setRoundActionLoading(true);
    try {
      const result = await api.completeRound(roundId);
      await loadEvent();
      if (result.tournamentComplete) alert(`Tournament Complete! ${result.reason || ''}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed');
    } finally {
      setRoundActionLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event) return;
    setCancelling(true);
    try {
      await api.cancelEvent(eventId, cancelReason || undefined);
      await loadEvent();
      setCancelModalOpen(false);
      setCancelReason('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-white/40">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl">
        {error || 'Event not found'}
      </div>
    );
  }

  const checkedInCount = event.entries.filter((e) => e.checkedInAt && !e.droppedAt).length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'COMPLETED': return 'bg-white/5 text-white/40 border-white/10';
      case 'CANCELLED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Card */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-white">{event.name}</h1>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusStyle(event.status)}`}>
                {event.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
              <span>{formatGameName(event.game)}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{formatEventFormat(event.format)}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>
                {new Date(event.startAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{checkedInCount}</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">Checked In</div>
            </div>
            {event.maxPlayers && (
              <div className="text-center">
                <div className="text-3xl font-bold text-white/60">{event.maxPlayers}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Max</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/[0.06]">
          {event.status !== 'COMPLETED' && event.status !== 'CANCELLED' && (
            <>
              {event.rounds.length === 0 ? (
                <button
                  onClick={handleCreateRound}
                  disabled={checkedInCount < 2}
                  className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  Start Tournament
                </button>
              ) : (
                <button
                  onClick={handleCreateRound}
                  disabled={checkedInCount < 2}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  Create Round {event.rounds.length + 1}
                </button>
              )}
            </>
          )}
          {event.status === 'COMPLETED' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-lg font-medium">
              Tournament Complete
            </div>
          )}
          {(event.status === 'SCHEDULED' || event.status === 'IN_PROGRESS') && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
            >
              Cancel Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          {(['players', 'rounds', 'standings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white bg-white/[0.04] border-b-2 border-primary'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab === 'players' && `Players (${event.entries.length})`}
              {tab === 'rounds' && `Rounds (${event.rounds.length})`}
              {tab === 'standings' && 'Standings'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Players Tab */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleBulkCheckIn}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Check In All
                </button>
                <button
                  onClick={() => { setLateAddModalOpen(true); loadOrgUsers(); }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  + Add Player
                </button>
              </div>

              {event.entries.length === 0 ? (
                <div className="text-center py-12 text-white/40">No players registered</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-left">
                        <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Player</th>
                        <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Email</th>
                        <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Payment</th>
                        <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.entries.map((entry) => {
                        const requiresPayment = event.entryFeeCents && event.entryFeeCents > 0;
                        return (
                          <tr key={entry.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <PlayerAvatar name={entry.user.name} avatarUrl={entry.user.avatarUrl} size="sm" />
                                <span className="font-medium text-white">{entry.user.name}</span>
                              </div>
                            </td>
                            <td className="py-4 text-white/40 text-sm hidden md:table-cell">{entry.user.email}</td>
                            <td className="py-4">
                              {!requiresPayment ? (
                                <span className="text-xs text-white/30">Free</span>
                              ) : entry.paidAt ? (
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">Paid</span>
                              ) : (
                                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs font-medium">Unpaid</span>
                              )}
                            </td>
                            <td className="py-4">
                              {entry.droppedAt ? (
                                <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs font-medium">Dropped</span>
                              ) : entry.checkedInAt ? (
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">Checked In</span>
                              ) : (
                                <span className="px-2 py-1 bg-white/5 text-white/40 rounded text-xs font-medium">Registered</span>
                              )}
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {requiresPayment && !entry.paidAt && !entry.droppedAt && (
                                  <button
                                    onClick={() => handleMarkAsPaid(entry.id, entry.user.name)}
                                    disabled={markingPaid === entry.id}
                                    className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-md hover:bg-amber-600 transition disabled:opacity-50"
                                  >
                                    {markingPaid === entry.id ? '...' : 'Mark Paid'}
                                  </button>
                                )}
                                {!entry.checkedInAt && !entry.droppedAt && (!requiresPayment || entry.paidAt) && (
                                  <button
                                    onClick={() => handleCheckIn(entry.id)}
                                    disabled={checkingIn === entry.id}
                                    className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-md hover:bg-emerald-600 transition disabled:opacity-50"
                                  >
                                    {checkingIn === entry.id ? '...' : 'Check In'}
                                  </button>
                                )}
                                {entry.checkedInAt && !entry.droppedAt && (
                                  <button
                                    onClick={() => handleDropPlayer(entry.id, entry.user.name)}
                                    disabled={dropping === entry.id}
                                    className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-md hover:bg-red-500/20 transition disabled:opacity-50"
                                  >
                                    {dropping === entry.id ? '...' : 'Drop'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Rounds Tab */}
          {activeTab === 'rounds' && (
            <div className="space-y-6">
              {event.rounds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏁</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Tournament Not Started</h3>
                  <p className="text-white/40 text-sm">Check in players, then click "Start Tournament"</p>
                  <p className="text-white/30 text-xs mt-2">{checkedInCount} checked in (need 2+)</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4">
                    <select
                      value={selectedRound || ''}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="px-4 py-2 bg-white/[0.02] border border-white/[0.1] rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
                    >
                      {event.rounds.map((round) => (
                        <option key={round.id} value={round.id}>
                          Round {round.roundNumber} - {round.status}
                        </option>
                      ))}
                    </select>

                    {selectedRound && (() => {
                      const round = event.rounds.find(r => r.id === selectedRound);
                      const allReported = pairings.length > 0 && pairings.every(p => p.result || !p.playerB);
                      return (
                        <div className="flex gap-2">
                          {round?.status === 'PENDING' && (
                            <button
                              onClick={() => handleStartRound(selectedRound)}
                              disabled={roundActionLoading}
                              className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50"
                            >
                              {roundActionLoading ? 'Starting...' : 'Start Round'}
                            </button>
                          )}
                          {(round?.status === 'ACTIVE' || round?.status === 'PENDING') && (
                            <button
                              onClick={() => handleCompleteRound(selectedRound)}
                              disabled={roundActionLoading || !allReported}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
                            >
                              {roundActionLoading ? 'Completing...' : 'Complete Round'}
                            </button>
                          )}
                          {round?.status === 'COMPLETED' && (
                            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium">
                              Round Completed
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {pairings.length === 0 ? (
                    <div className="text-center py-8 text-white/40">Loading pairings...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-left">
                            <th className="pb-3 pl-4 text-xs font-medium text-white/40 uppercase tracking-wider w-16">Table</th>
                            <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Player A</th>
                            <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider text-center w-12">VS</th>
                            <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Player B</th>
                            <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Result</th>
                            <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pairings.map((pairing) => (
                            <tr key={pairing.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${pairing.result ? 'bg-emerald-500/[0.03]' : ''}`}>
                              <td className="py-4 pl-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                  <span className="font-bold text-primary">{pairing.tableNumber}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <PlayerAvatar name={pairing.playerA.name} avatarUrl={pairing.playerA.avatarUrl} size="sm" />
                                  <span className="font-medium text-white">{pairing.playerA.name}</span>
                                </div>
                              </td>
                              <td className="py-4 text-center text-white/30 text-xs">VS</td>
                              <td className="py-4">
                                {pairing.playerB ? (
                                  <div className="flex items-center gap-3">
                                    <PlayerAvatar name={pairing.playerB.name} avatarUrl={pairing.playerB.avatarUrl} size="sm" />
                                    <span className="font-medium text-white">{pairing.playerB.name}</span>
                                  </div>
                                ) : (
                                  <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium">BYE</span>
                                )}
                              </td>
                              <td className="py-4 text-white/40 text-sm">
                                {pairing.result ? (
                                  <span>
                                    {pairing.result.replace('PLAYER_A_WIN', 'A Wins').replace('PLAYER_B_WIN', 'B Wins').replace('DRAW', 'Draw').replace('INTENTIONAL_DRAW', 'ID')}
                                    {pairing.gamesWonA !== undefined && ` (${pairing.gamesWonA}-${pairing.gamesWonB})`}
                                  </span>
                                ) : (
                                  <span className="text-white/30">Pending</span>
                                )}
                              </td>
                              <td className="py-4">
                                {!pairing.result && pairing.playerB && (
                                  <button
                                    onClick={() => { setSelectedMatch(pairing); setResultModalOpen(true); }}
                                    className="bg-primary text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 transition"
                                  >
                                    Report
                                  </button>
                                )}
                                {!pairing.result && !pairing.playerB && (
                                  <span className="text-xs text-white/30">Auto Win</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Standings Tab */}
          {activeTab === 'standings' && (
            <div className="space-y-4">
              {standings.length === 0 ? (
                <div className="text-center py-12 text-white/40">No standings yet</div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-3">
                    {event.totalPrizeCredits && event.totalPrizeCredits > 0 && !event.prizesDistributed && (
                      <button
                        onClick={() => setPrizeModalOpen(true)}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition"
                      >
                        Distribute {event.totalPrizeCredits} Credits
                      </button>
                    )}
                    <button
                      onClick={() => api.exportStandings(eventId)}
                      className="bg-white/[0.02] text-white border border-white/[0.1] px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/[0.06] transition"
                    >
                      Export CSV
                    </button>
                  </div>

                  {event.prizesDistributed && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm">
                      Prizes distributed{event.prizesDistributedAt && ` on ${new Date(event.prizesDistributedAt).toLocaleDateString()}`}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-left">
                          <th className="pb-3 pl-4 text-xs font-medium text-white/40 uppercase tracking-wider w-16">Rank</th>
                          <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Player</th>
                          <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider text-right">Pts</th>
                          <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider text-right">Record</th>
                          <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider text-right hidden md:table-cell">OMW%</th>
                          <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider text-right hidden lg:table-cell">GW%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing) => {
                          const isTop3 = standing.rank <= 3;
                          const rankColors: Record<number, string> = {
                            1: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                            2: 'bg-slate-400/10 border-slate-400/30 text-slate-300',
                            3: 'bg-orange-600/10 border-orange-600/30 text-orange-400',
                          };
                          return (
                            <tr key={standing.userId} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${isTop3 ? 'bg-primary/[0.02]' : ''}`}>
                              <td className="py-4 pl-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${isTop3 ? rankColors[standing.rank] + ' border' : 'bg-white/5 text-white'}`}>
                                  {standing.rank}
                                </div>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <PlayerAvatar name={standing.userName} avatarUrl={standing.avatarUrl} size="sm" />
                                  <div>
                                    <div className="font-medium text-white">{standing.userName}</div>
                                    {isTop3 && (
                                      <div className="text-xs text-white/40">
                                        {standing.rank === 1 && 'Champion'}
                                        {standing.rank === 2 && 'Runner-up'}
                                        {standing.rank === 3 && '3rd Place'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 font-bold text-white text-right">{standing.points}</td>
                              <td className="py-4 text-white/40 text-right">{standing.matchWins}-{standing.matchLosses}-{standing.matchDraws}</td>
                              <td className="py-4 text-white/40 text-right hidden md:table-cell">{(standing.omwPercent * 100).toFixed(1)}%</td>
                              <td className="py-4 text-white/40 text-right hidden lg:table-cell">{(standing.gwPercent * 100).toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedMatch && (
        <MatchResultModal
          isOpen={resultModalOpen}
          onClose={() => { setResultModalOpen(false); setSelectedMatch(null); }}
          onSubmit={handleSubmitResult}
          match={selectedMatch}
          gameType={event?.game}
        />
      )}

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

      {/* Late Add Modal */}
      {lateAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-semibold text-white mb-4">Add Late Player</h3>
            <p className="text-sm text-white/40 mb-4">Player will be auto checked-in.</p>
            {loadingUsers ? (
              <p className="text-sm text-white/40">Loading...</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white mb-4"
              >
                <option value="">Choose a player...</option>
                {orgUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setLateAddModalOpen(false); setSelectedUserId(''); }} className="px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white/60 hover:text-white transition">
                Cancel
              </button>
              <button onClick={handleAddLatePlayer} disabled={!selectedUserId} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50">
                Add Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-semibold text-white mb-4">Cancel Event</h3>
            <p className="text-sm text-white/40 mb-4">Are you sure? Players will be notified.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)..."
              className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white placeholder-white/30 resize-none mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setCancelModalOpen(false); setCancelReason(''); }} disabled={cancelling} className="px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white/60 hover:text-white transition disabled:opacity-50">
                Go Back
              </button>
              <button onClick={handleCancelEvent} disabled={cancelling} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Cancel Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
