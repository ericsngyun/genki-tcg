'use client';

import { useEffect, useState } from 'react';
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
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents(filter);
      setEvents(data);

      // Load upcoming events separately for the upcoming section
      if (!filter) {
        const upcoming = await api.getEvents('SCHEDULED');
        const sortedUpcoming = upcoming
          .filter((e: Event) => new Date(e.startAt) > new Date())
          .sort((a: Event, b: Event) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .slice(0, 3);
        setUpcomingEvents(sortedUpcoming);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'IN_PROGRESS':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'COMPLETED':
        return 'bg-muted text-muted-foreground border border-border';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border border-border';
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

      {/* Upcoming Events Section */}
      {!filter && !loading && upcomingEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Upcoming Events</h2>
            <button
              onClick={() => setFilter('SCHEDULED')}
              className="text-sm text-primary hover:text-primary/80 font-medium transition"
            >
              View all upcoming →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
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
      ) : events.length === 0 ? (
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
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {event.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        event.status
                      )}`}
                    >
                      {event.status.replace('_', ' ')}
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
    </div>
  );
}
