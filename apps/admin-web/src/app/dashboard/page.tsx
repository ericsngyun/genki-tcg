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
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      // Load all events to properly categorize them
      const [scheduled, inProgress, completed] = await Promise.all([
        api.getEvents('SCHEDULED'),
        api.getEvents('IN_PROGRESS'),
        api.getEvents('COMPLETED'),
      ]);

      setAllEvents([...scheduled, ...inProgress, ...completed]);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Smart event categorization based on status and time
  const { activeEvents, upcomingEvents, pastEvents, filteredEvents } = useMemo(() => {
    const now = new Date();

    // Active tournaments - IN_PROGRESS status
    const active = allEvents.filter(e => e.status === 'IN_PROGRESS');

    // Upcoming events - SCHEDULED and start time is in the future
    const upcoming = allEvents
      .filter(e => {
        if (e.status !== 'SCHEDULED') return false;
        const startTime = new Date(e.startAt);
        return startTime > now;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Past events - COMPLETED, CANCELLED, or start time passed without starting
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

    // Apply filter for the main list view
    // When "All Events" is selected (no filter), show active + upcoming, NOT past events
    // Past events are shown in the collapsible Past Events section
    let filtered: Event[];
    if (filter === 'IN_PROGRESS') {
      filtered = active;
    } else if (filter === 'SCHEDULED') {
      filtered = upcoming;
    } else if (filter === 'COMPLETED') {
      filtered = past;
    } else {
      // "All Events" = active + upcoming (excludes past from main list)
      filtered = [...active, ...upcoming].sort((a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }

    return {
      activeEvents: active,
      upcomingEvents: upcoming,
      pastEvents: past,
      filteredEvents: filtered,
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage tournaments and player check-ins
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          Create Event
        </Link>
      </div>

      {/* Active Tournaments Section - Most Important */}
      {!filter && !loading && activeEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h2 className="text-xl font-bold text-foreground">Active Tournaments</h2>
              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {activeEvents.length} LIVE
              </span>
            </div>
            <button
              onClick={() => setFilter('IN_PROGRESS')}
              className="text-sm text-green-400 hover:text-green-300 font-medium transition"
            >
              View all active →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="bg-gradient-to-br from-green-500/5 to-green-500/15 rounded-xl border-2 border-green-500/30 p-6 hover:shadow-xl hover:shadow-green-500/10 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="px-3 py-1 rounded-full text-xs font-bold border-2 bg-green-500/20 text-green-400 border-green-500 animate-pulse">
                    LIVE NOW
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      {event._count.entries}
                      {event.maxPlayers && `/${event.maxPlayers}`}
                    </div>
                    <div className="text-xs text-muted-foreground">players</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                  {event.name}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span className="mr-2">🎮</span>
                    <span>{formatGameName(event.game)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📋</span>
                    <span>{formatEventFormat(event.format)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events Section */}
      {!filter && !loading && upcomingEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Upcoming Events</h2>
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
                {upcomingEvents.length}
              </span>
            </div>
            <button
              onClick={() => setFilter('SCHEDULED')}
              className="text-sm text-primary hover:text-primary/80 font-medium transition"
            >
              View all upcoming →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20 p-6 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getTimeUntilColor(event.startAt)}`}>
                    {getTimeUntilEvent(event.startAt)}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {event._count.entries}
                      {event.maxPlayers && `/${event.maxPlayers}`}
                    </div>
                    <div className="text-xs text-muted-foreground">players</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                  {event.name}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span className="mr-2">🎮</span>
                    <span>{formatGameName(event.game)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📅</span>
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
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter(undefined)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === undefined
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('SCHEDULED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'SCHEDULED'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('IN_PROGRESS')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'IN_PROGRESS'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'COMPLETED'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">No events found</p>
          <Link
            href="/dashboard/events/new"
            className="text-primary hover:text-primary/80 font-medium transition"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className={`bg-card rounded-lg border p-6 hover:shadow-lg transition ${
                event.status === 'IN_PROGRESS'
                  ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/10'
                  : 'border-border hover:border-primary/30 hover:shadow-primary/5'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {event.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        event
                      )}`}
                    >
                      {getStatusText(event)}
                    </span>
                  </div>
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
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {event._count.entries}
                    {event.maxPlayers && `/${event.maxPlayers}`}
                  </div>
                  <div className="text-sm text-muted-foreground">Players</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Past Events Section - Collapsible */}
      {!filter && !loading && pastEvents.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-4"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showPastEvents ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h2 className="text-lg font-semibold">Past Events</h2>
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
              {pastEvents.length}
            </span>
          </button>
          {showPastEvents && (
            <div className="grid gap-3 opacity-75">
              {pastEvents.slice(0, 10).map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-base font-medium text-foreground">
                          {event.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            event
                          )}`}
                        >
                          {getStatusText(event)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>🎮 {formatGameName(event.game)}</span>
                        <span>
                          📅{' '}
                          {new Date(event.startAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-muted-foreground">
                        {event._count.entries}
                      </div>
                      <div className="text-xs text-muted-foreground">players</div>
                    </div>
                  </div>
                </Link>
              ))}
              {pastEvents.length > 10 && (
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium transition py-2"
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
