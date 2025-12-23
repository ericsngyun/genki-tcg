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

    const cleanup = () => {
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-state="open"]');
      overlays.forEach((overlay) => {
        const htmlOverlay = overlay as HTMLElement;
        if (htmlOverlay.style.position === 'fixed' && htmlOverlay.style.zIndex) {
          const zIndex = parseInt(htmlOverlay.style.zIndex);
          if (zIndex >= 50) {
            htmlOverlay.remove();
          }
        }
      });
    };

    setTimeout(cleanup, 100);
  }, []);

  const loadEvents = async () => {
    setError(null);
    try {
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

  const { activeEvents, readyToStartEvents, upcomingEvents, pastEvents, filteredEvents, totalPlayers } = useMemo(() => {
    const now = new Date();

    const active = allEvents.filter(e => e.status === 'IN_PROGRESS');

    const readyToStart = allEvents
      .filter(e => {
        if (e.status !== 'SCHEDULED') return false;
        const startTime = new Date(e.startAt);
        const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return hoursPastStart > 0 && hoursPastStart <= 6;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const upcoming = allEvents
      .filter(e => {
        if (e.status !== 'SCHEDULED') return false;
        const startTime = new Date(e.startAt);
        return startTime > now;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const past = allEvents
      .filter(e => {
        if (e.status === 'COMPLETED' || e.status === 'CANCELLED') return true;
        if (e.status === 'SCHEDULED') {
          const startTime = new Date(e.startAt);
          const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return hoursPastStart > 6;
        }
        return false;
      })
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    const total = [...active, ...readyToStart, ...upcoming].reduce((acc, event) => acc + event._count.entries, 0);

    let filtered: Event[];
    if (filter === 'IN_PROGRESS') {
      filtered = active;
    } else if (filter === 'SCHEDULED') {
      filtered = [...readyToStart, ...upcoming];
    } else if (filter === 'COMPLETED') {
      filtered = past;
    } else {
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

  const getEffectiveStatus = (event: Event): string => {
    const now = new Date();
    const startTime = new Date(event.startAt);
    const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (event.status === 'SCHEDULED' && hoursPastStart > 0) {
      if (hoursPastStart > 6) {
        return 'MISSED';
      } else {
        return 'STARTING_SOON';
      }
    }

    return event.status;
  };

  const getStatusStyles = (event: Event) => {
    const effectiveStatus = getEffectiveStatus(event);
    switch (effectiveStatus) {
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'STARTING_SOON':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'COMPLETED':
        return 'bg-white/5 text-white/40 border-white/10';
      case 'CANCELLED':
      case 'MISSED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getStatusText = (event: Event) => {
    const effectiveStatus = getEffectiveStatus(event);
    switch (effectiveStatus) {
      case 'SCHEDULED':
        return 'Upcoming';
      case 'STARTING_SOON':
        return 'Ready';
      case 'IN_PROGRESS':
        return 'Live';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'MISSED':
        return 'Past';
      default:
        return effectiveStatus;
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
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks}w`;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Events</h1>
          <p className="text-white/40 mt-1">
            Manage tournaments and player check-ins
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
        >
          Create Event
        </Link>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.1]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-white mt-1">{activeEvents.length}</p>
              </div>
              {activeEvents.length > 0 && (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>

          {readyToStartEvents.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 transition-all duration-200 hover:bg-amber-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">Ready to Start</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{readyToStartEvents.length}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
            </div>
          )}

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.1]">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Upcoming</p>
            <p className="text-2xl font-bold text-white mt-1">{upcomingEvents.length}</p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.1]">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Total Players</p>
            <p className="text-2xl font-bold text-white mt-1">{totalPlayers}</p>
          </div>
        </div>
      )}

      {/* Active Tournaments */}
      {!filter && !loading && activeEvents.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-semibold text-white">Active Tournaments</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 transition-all duration-200 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-emerald-400">{event._count.entries}</span>
                    {event.maxPlayers && (
                      <span className="text-sm text-emerald-400/50">/{event.maxPlayers}</span>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                  {event.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{formatGameName(event.game)}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{formatEventFormat(event.format)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ready to Start */}
      {!filter && !loading && readyToStartEvents.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-lg font-semibold text-white">Ready to Start</h2>
            <span className="text-xs text-amber-400/60">(past scheduled time)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyToStartEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 transition-all duration-200 hover:bg-amber-500/10 hover:border-amber-500/30 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Ready
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-amber-400">{event._count.entries}</span>
                    {event.maxPlayers && (
                      <span className="text-sm text-amber-400/50">/{event.maxPlayers}</span>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                  {event.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{formatGameName(event.game)}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>Click to start</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {!filter && !loading && upcomingEvents.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
            <button
              onClick={() => setFilter('SCHEDULED')}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.1] hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {getTimeUntilEvent(event.startAt)}
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-white group-hover:text-primary transition-colors">{event._count.entries}</span>
                    {event.maxPlayers && (
                      <span className="text-sm text-white/30">/{event.maxPlayers}</span>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {event.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{formatGameName(event.game)}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>
                    {new Date(event.startAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/[0.06] rounded-lg w-fit mb-6">
        {[
          { value: undefined, label: 'All Events' },
          { value: 'SCHEDULED', label: 'Upcoming' },
          { value: 'IN_PROGRESS', label: 'Active' },
          { value: 'COMPLETED', label: 'Completed' },
        ].map((option) => (
          <button
            key={option.label}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              filter === option.value
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-white/40">Loading events...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8 text-center">
          <p className="text-red-400 font-medium mb-2">Error Loading Events</p>
          <p className="text-white/40 text-sm mb-4">{error}</p>
          <button
            onClick={loadEvents}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] border-dashed rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
          <p className="text-white/40 text-sm mb-6">
            There are no events matching your criteria.
          </p>
          <Link
            href="/dashboard/events/new"
            className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                event.status === 'IN_PROGRESS'
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
                      {event.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(event)}`}>
                      {getStatusText(event)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span>{formatGameName(event.game)}</span>
                    <span>{formatEventFormat(event.format)}</span>
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
              </div>
              <div className="text-right pl-4 border-l border-white/[0.06] ml-4">
                <span className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                  {event._count.entries}
                </span>
                {event.maxPlayers && (
                  <span className="text-sm text-white/30">/{event.maxPlayers}</span>
                )}
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Players</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Past Events */}
      {!filter && !loading && pastEvents.length > 0 && (
        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="flex items-center gap-3 text-white/40 hover:text-white/60 transition-colors mb-4 group"
          >
            <div className={`w-5 h-5 rounded bg-white/5 flex items-center justify-center transition-transform duration-200 ${showPastEvents ? 'rotate-90' : ''}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className="text-sm font-medium">Past Events</span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-xs">{pastEvents.length}</span>
          </button>

          {showPastEvents && (
            <div className="space-y-2 animate-fade-in">
              {pastEvents.slice(0, 10).map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm text-white/60 group-hover:text-white/80 transition-colors truncate">
                        {event.name}
                      </h3>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusStyles(event)}`}>
                        {getStatusText(event)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
                      <span>{formatGameName(event.game)}</span>
                      <span>
                        {new Date(event.startAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right pl-4">
                    <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">
                      {event._count.entries}
                    </span>
                  </div>
                </Link>
              ))}
              {pastEvents.length > 10 && (
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className="w-full text-center py-3 text-xs text-white/30 hover:text-white/50 transition-colors border border-dashed border-white/[0.06] rounded-lg hover:bg-white/[0.02]"
                >
                  View all {pastEvents.length} past events
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
