'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatGameName, formatEventFormat } from '@/lib/formatters';

interface Event {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  startAt: string;
  maxPlayers?: number;
  _count: {
    entries: number;
  };
}

export default function DashboardPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setError(null);
    try {
      // Load all events to properly categorize them
      const [scheduled, inProgress, completed] = await Promise.all([
        api.getEvents('SCHEDULED'),
        api.getEvents('IN_PROGRESS'),
        api.getEvents('COMPLETED'),
      ]);

      setAllEvents([...scheduled, ...inProgress, ...completed]);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      setError(error.response?.data?.message || 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Smart event categorization based on status and time
  const { activeEvents, readyToStartEvents, upcomingEvents, pastEvents, filteredEvents, totalPlayers } = useMemo(() => {
    const now = new Date();

    // Active tournaments - IN_PROGRESS status
    const active = allEvents.filter(e => e.status === 'IN_PROGRESS');

    // Ready to start - SCHEDULED events where start time has passed (within 24 hours)
    // These need admin action to start them
    const readyToStart = allEvents
      .filter(e => {
        if (e.status !== 'SCHEDULED') return false;
        const startTime = new Date(e.startAt);
        const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return hoursPastStart > 0 && hoursPastStart <= 24;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Upcoming events - SCHEDULED and start time is in the future
    const upcoming = allEvents
      .filter(e => {
        if (e.status !== 'SCHEDULED') return false;
        const startTime = new Date(e.startAt);
        return startTime > now;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Past events - COMPLETED, CANCELLED, or start time passed without starting (24+ hours)
    const past = allEvents
      .filter(e => {
        if (e.status === 'COMPLETED' || e.status === 'CANCELLED') return true;
        // Also include SCHEDULED events that are past their start time by 24+ hours
        if (e.status === 'SCHEDULED') {
          const startTime = new Date(e.startAt);
          const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return hoursPastStart > 24;
        }
        return false;
      })
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    // Calculate total unique players across active, ready to start, and upcoming events
    const total = [...active, ...readyToStart, ...upcoming].reduce((acc, event) => acc + event._count.entries, 0);

    // Apply filter for the main list view
    let filtered: Event[];
    if (filter === 'IN_PROGRESS') {
      filtered = active;
    } else if (filter === 'SCHEDULED') {
      // Include both upcoming AND ready to start
      filtered = [...readyToStart, ...upcoming];
    } else if (filter === 'COMPLETED') {
      filtered = past;
    } else {
      // "All Events" = active + ready to start + upcoming (excludes past from main list)
      filtered = [...active, ...readyToStart, ...upcoming].sort((a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }

    return {
      activeEvents: active,
      readyToStartEvents: readyToStart,
      upcomingEvents: upcoming,
      pastEvents: past,
      filteredEvents: filtered,
      totalPlayers: total,
    };
  }, [allEvents, filter]);

  // Helper to determine effective status considering time
  const getEffectiveStatus = (event: Event): string => {
    const now = new Date();
    const startTime = new Date(event.startAt);
    const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // If database says SCHEDULED but time has passed significantly, mark as missed/past
    if (event.status === 'SCHEDULED' && hoursPastStart > 0) {
      if (hoursPastStart > 24) {
        return 'MISSED'; // More than 24 hours past - definitely missed
      } else {
        return 'STARTING_SOON'; // Within window, might be starting
      }
    }

    return event.status;
  };

  const getStatusColor = (event: Event) => {
    const effectiveStatus = getEffectiveStatus(event);
    switch (effectiveStatus) {
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'STARTING_SOON':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'REGISTRATION_CLOSED':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'IN_PROGRESS':
        return 'bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse';
      case 'COMPLETED':
        return 'bg-muted text-muted-foreground border border-border';
      case 'CANCELLED':
      case 'MISSED':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'DRAFT':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getStatusText = (event: Event) => {
    const effectiveStatus = getEffectiveStatus(event);
    switch (effectiveStatus) {
      case 'SCHEDULED':
        return 'Upcoming';
      case 'STARTING_SOON':
        return 'Starting Soon';
      case 'REGISTRATION_CLOSED':
        return 'Reg. Closed';
      case 'IN_PROGRESS':
        return 'LIVE';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'MISSED':
        return 'Past';
      case 'DRAFT':
        return 'Draft';
      default:
        return effectiveStatus.replace('_', ' ');
    }
  };

  const getTimeUntilEvent = (startAt: string) => {
    const now = new Date();
    const start = new Date(startAt);
    const diffMs = start.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return 'Started';
    } else if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Starts in ${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `Starts in ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Starts in ${diffDays}d`;
    } else {
      const diffWeeks = Math.floor(diffDays / 7);
      return `Starts in ${diffWeeks}w`;
    }
  };

  const getTimeUntilColor = (startAt: string) => {
    const now = new Date();
    const start = new Date(startAt);
    const diffHours = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 2) {
      return 'text-primary bg-primary/10 border-primary';
    } else if (diffHours < 24) {
      return 'text-orange-400 bg-orange-500/10 border-orange-500';
    } else {
      return 'text-blue-400 bg-blue-500/10 border-blue-500';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage tournaments and player check-ins
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          + Create Event
        </Link>
      </div>

      {/* Hero Stats Row */}
      {!loading && (
        <div className={`grid grid-cols-1 gap-6 mb-10 ${readyToStartEvents.length > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          {/* Active Stats */}
          <div className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-green-500/5 p-6 backdrop-blur-md shadow-xl shadow-green-500/10 transition-all hover:shadow-green-500/20 hover:border-green-500/50 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400 uppercase tracking-wider">Active Now</p>
                <h3 className="mt-2 text-4xl font-bold text-foreground tracking-tight">{activeEvents.length}</h3>
              </div>
              <div className="rounded-full bg-green-500/20 p-3 text-green-400 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Ready to Start Stats - Only show if there are events */}
          {readyToStartEvents.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 backdrop-blur-md shadow-xl shadow-orange-500/10 transition-all hover:shadow-orange-500/20 hover:border-orange-500/50 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-400 uppercase tracking-wider">Ready to Start</p>
                  <h3 className="mt-2 text-4xl font-bold text-foreground tracking-tight">{readyToStartEvents.length}</h3>
                </div>
                <div className="rounded-full bg-orange-500/20 p-3 text-orange-400 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Stats */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 backdrop-blur-md shadow-xl shadow-blue-500/10 transition-all hover:shadow-blue-500/20 hover:border-blue-500/50 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">Upcoming</p>
                <h3 className="mt-2 text-4xl font-bold text-foreground tracking-tight">{upcomingEvents.length}</h3>
              </div>
              <div className="rounded-full bg-blue-500/20 p-3 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 backdrop-blur-md shadow-xl shadow-purple-500/10 transition-all hover:shadow-purple-500/20 hover:border-purple-500/50 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400 uppercase tracking-wider">Total Players</p>
                <h3 className="mt-2 text-4xl font-bold text-foreground tracking-tight">{totalPlayers}</h3>
              </div>
              <div className="rounded-full bg-purple-500/20 p-3 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Tournaments Section - Most Important */}
      {!filter && !loading && activeEvents.length > 0 && (
        <div className="mb-10 animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Active Tournaments</h2>
            </div>
            <button
              onClick={() => setFilter('IN_PROGRESS')}
              className="text-sm text-green-400 hover:text-green-300 font-medium transition flex items-center gap-1"
            >
              View all active <span className="text-lg">→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group relative overflow-hidden rounded-2xl border border-green-500/30 bg-green-500/5 p-6 backdrop-blur-md transition-all hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-green-500/10 blur-2xl transition-all group-hover:bg-green-500/20"></div>

                <div className="flex items-start justify-between mb-4 relative">
                  <div className="px-3 py-1 rounded-full text-xs font-bold border bg-green-500/20 text-green-400 border-green-500/30 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    LIVE NOW
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400 tracking-tight">
                      {event._count.entries}
                      {event.maxPlayers && <span className="text-lg text-green-500/50">/{event.maxPlayers}</span>}
                    </div>
                    <div className="text-xs font-medium text-green-500/70 uppercase tracking-wider">players</div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-green-400 transition-colors relative">
                  {event.name}
                </h3>

                <div className="space-y-2 text-sm text-muted-foreground relative">
                  <div className="flex items-center bg-background/30 rounded-lg p-2 backdrop-blur-sm">
                    <span className="mr-3 text-lg">🎮</span>
                    <span className="font-medium">{formatGameName(event.game)}</span>
                  </div>
                  <div className="flex items-center bg-background/30 rounded-lg p-2 backdrop-blur-sm">
                    <span className="mr-3 text-lg">📋</span>
                    <span className="font-medium">{formatEventFormat(event.format)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ready to Start Section - Events past their start time that need to be started */}
      {!filter && !loading && readyToStartEvents.length > 0 && (
        <div className="mb-10 animate-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Ready to Start</h2>
              <span className="text-sm text-orange-400 font-medium">(past scheduled time)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyToStartEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 backdrop-blur-md transition-all hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20"></div>

                <div className="flex items-start justify-between mb-4 relative">
                  <div className="px-3 py-1 rounded-full text-xs font-bold border bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                    READY TO START
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-400 tracking-tight">
                      {event._count.entries}
                      {event.maxPlayers && <span className="text-lg text-orange-500/50">/{event.maxPlayers}</span>}
                    </div>
                    <div className="text-xs font-medium text-orange-500/70 uppercase tracking-wider">players</div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors relative">
                  {event.name}
                </h3>

                <div className="space-y-2 text-sm text-muted-foreground relative">
                  <div className="flex items-center bg-background/30 rounded-lg p-2 backdrop-blur-sm">
                    <span className="mr-3 text-lg">🎮</span>
                    <span className="font-medium">{formatGameName(event.game)}</span>
                  </div>
                  <div className="flex items-center bg-orange-500/10 rounded-lg p-2 backdrop-blur-sm border border-orange-500/20">
                    <span className="mr-3 text-lg">⚠️</span>
                    <span className="font-medium text-orange-400">Click to start tournament</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events Section */}
      {!filter && !loading && upcomingEvents.length > 0 && (
        <div className="mb-10 animate-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Upcoming Events</h2>
            <button
              onClick={() => setFilter('SCHEDULED')}
              className="text-sm text-primary hover:text-primary/80 font-medium transition flex items-center gap-1"
            >
              View all upcoming <span className="text-lg">→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getTimeUntilColor(event.startAt)}`}>
                    {getTimeUntilEvent(event.startAt)}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {event._count.entries}
                      {event.maxPlayers && <span className="text-sm text-muted-foreground">/{event.maxPlayers}</span>}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">players</div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {event.name}
                </h3>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span className="mr-2 w-5 text-center">🎮</span>
                    <span>{formatGameName(event.game)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 w-5 text-center">📅</span>
                    <span>
                      {new Date(event.startAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-1.5 mb-6 inline-flex shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
        <button
          onClick={() => setFilter(undefined)}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${filter === undefined
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
          All Events
        </button>
        <button
          onClick={() => setFilter('SCHEDULED')}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${filter === 'SCHEDULED'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('IN_PROGRESS')}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${filter === 'IN_PROGRESS'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${filter === 'COMPLETED'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
          Completed
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground animate-pulse">Loading events...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center backdrop-blur-sm">
          <div className="text-destructive text-lg font-bold mb-2">Error Loading Events</div>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={loadEvents}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            Try Again
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border border-dashed p-16 text-center animate-in fade-in duration-500">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">📅</span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No events found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            There are no events matching your criteria. Why not create a new one?
          </p>
          <Link
            href="/dashboard/events/new"
            className="text-primary hover:text-primary/80 font-bold transition flex items-center justify-center gap-2"
          >
            Create your first event <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className={`group bg-white/5 backdrop-blur-md rounded-xl border p-6 hover:shadow-lg transition-all hover:-translate-y-0.5 ${event.status === 'IN_PROGRESS'
                ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/10'
                : 'border-white/10 hover:border-primary/30 hover:shadow-primary/5'
                }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(
                        event
                      )}`}
                    >
                      {getStatusText(event)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🎮</span> {formatGameName(event.game)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">📋</span> {formatEventFormat(event.format)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">📅</span>{' '}
                      {new Date(event.startAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-border/50 ml-4">
                  <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {event._count.entries}
                    {event.maxPlayers && <span className="text-sm text-muted-foreground font-normal">/{event.maxPlayers}</span>}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Players</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Past Events Section - Collapsible */}
      {!filter && !loading && pastEvents.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition mb-6 group w-full"
          >
            <div className={`p-2 rounded-full bg-muted group-hover:bg-muted/80 transition-transform duration-300 ${showPastEvents ? 'rotate-90' : ''}`}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Past Events</h2>
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-bold">
                {pastEvents.length}
              </span>
            </div>
          </button>

          {showPastEvents && (
            <div className="grid gap-3 animate-in slide-in-from-top-2 duration-300">
              {pastEvents.slice(0, 10).map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="bg-card/30 rounded-lg border border-border/50 p-4 hover:bg-card/50 hover:border-border transition flex justify-between items-center group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {event.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(
                          event
                        )}`}
                      >
                        {getStatusText(event)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{formatGameName(event.game)}</span>
                      <span>•</span>
                      <span>
                        {new Date(event.startAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                      {event._count.entries}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">players</div>
                  </div>
                </Link>
              ))}
              {pastEvents.length > 10 && (
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium transition py-4 text-center border border-dashed border-border rounded-lg hover:bg-muted/30"
                >
                  View all {pastEvents.length} past events →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
