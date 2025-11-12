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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents(filter);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">
            Manage tournaments and player check-ins
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition"
        >
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter(undefined)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === undefined
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('SCHEDULED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'SCHEDULED'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('IN_PROGRESS')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'IN_PROGRESS'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'COMPLETED'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">No events found</p>
          <Link
            href="/dashboard/events/new"
            className="text-primary hover:underline"
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
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
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
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
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
                  <div className="text-2xl font-bold text-gray-900">
                    {event._count.entries}
                    {event.maxPlayers && `/${event.maxPlayers}`}
                  </div>
                  <div className="text-sm text-gray-600">Players</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
