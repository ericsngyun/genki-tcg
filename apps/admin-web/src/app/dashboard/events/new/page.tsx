'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    game: 'ONE_PIECE_TCG',
    format: 'CONSTRUCTED',
    startAt: '',
    maxPlayers: '',
    entryFeeCents: '',
    totalPrizeCredits: '',
    requiresDecklist: false,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        startAt: new Date(formData.startAt),
        maxPlayers: formData.maxPlayers
          ? parseInt(formData.maxPlayers)
          : undefined,
        entryFeeCents: formData.entryFeeCents
          ? parseInt(formData.entryFeeCents)
          : undefined,
        totalPrizeCredits: formData.totalPrizeCredits
          ? parseInt(formData.totalPrizeCredits)
          : undefined,
      };

      const event = await api.createEvent(payload);
      router.push(`/dashboard/events/${event.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
        <p className="text-gray-600 mt-2">
          Set up a new tournament for your store
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Event Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Friday Night OPTCG"
            />
          </div>

          {/* Game and Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="game" className="block text-sm font-medium text-gray-700 mb-2">
                Game *
              </label>
              <select
                id="game"
                required
                value={formData.game}
                onChange={(e) =>
                  setFormData({ ...formData, game: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="ONE_PIECE_TCG">One Piece TCG</option>
                <option value="AZUKI_TCG">Azuki TCG</option>
                <option value="RIFTBOUND">Riftbound</option>
              </select>
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                Format *
              </label>
              <select
                id="format"
                required
                value={formData.format}
                onChange={(e) =>
                  setFormData({ ...formData, format: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="CONSTRUCTED">Constructed</option>
                <option value="DRAFT">Draft</option>
                <option value="SEALED">Sealed</option>
                <option value="PRE_RELEASE">Pre-Release</option>
                <option value="SUPER_PRE_RELEASE">Super Pre-Release</option>
              </select>
            </div>
          </div>

          {/* Start Date/Time */}
          <div>
            <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time *
            </label>
            <input
              id="startAt"
              type="datetime-local"
              required
              value={formData.startAt}
              onChange={(e) =>
                setFormData({ ...formData, startAt: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {/* Max Players and Entry Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                Max Players
              </label>
              <input
                id="maxPlayers"
                type="number"
                min="2"
                value={formData.maxPlayers}
                onChange={(e) =>
                  setFormData({ ...formData, maxPlayers: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="32"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for unlimited
              </p>
            </div>

            <div>
              <label htmlFor="entryFeeCents" className="block text-sm font-medium text-gray-700 mb-2">
                Entry Fee (cents)
              </label>
              <input
                id="entryFeeCents"
                type="number"
                min="0"
                value={formData.entryFeeCents}
                onChange={(e) =>
                  setFormData({ ...formData, entryFeeCents: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: 500 = $5.00
              </p>
            </div>
          </div>

          {/* Prize Credits */}
          <div>
            <label htmlFor="totalPrizeCredits" className="block text-sm font-medium text-gray-700 mb-2">
              Total Prize Credits
            </label>
            <input
              id="totalPrizeCredits"
              type="number"
              min="0"
              value={formData.totalPrizeCredits}
              onChange={(e) =>
                setFormData({ ...formData, totalPrizeCredits: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Store credits to distribute to top players after tournament
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Weekly Friday night tournament for One Piece TCG..."
            />
          </div>

          {/* Decklist Requirement */}
          <div className="flex items-center">
            <input
              id="requiresDecklist"
              type="checkbox"
              checked={formData.requiresDecklist}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiresDecklist: e.target.checked,
                })
              }
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label
              htmlFor="requiresDecklist"
              className="ml-3 text-sm text-gray-700"
            >
              Require decklist submission
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
