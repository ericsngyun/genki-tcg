'use client';

import { useState } from 'react';

interface MatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: string, gamesWonA: number, gamesWonB: number) => Promise<void>;
  match: {
    id: string;
    tableNumber: number;
    playerA: { name: string };
    playerB?: { name: string };
  };
}

export function MatchResultModal({ isOpen, onClose, onSubmit, match }: MatchResultModalProps) {
  const [result, setResult] = useState<string>('');
  const [gamesWonA, setGamesWonA] = useState<number>(0);
  const [gamesWonB, setGamesWonB] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!result) {
      alert('Please select a result');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result, gamesWonA, gamesWonB);
      onClose();
      // Reset form
      setResult('');
      setGamesWonA(0);
      setGamesWonB(0);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to report result');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Report Match Result - Table {match.tableNumber}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Match</div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="font-bold text-gray-900">{match.playerA.name}</div>
                <div className="text-xs text-gray-500 mt-1">Player A</div>
              </div>
              <div className="text-gray-400 font-bold text-lg">vs</div>
              <div className="text-center">
                <div className="font-bold text-gray-900">
                  {match.playerB ? match.playerB.name : '— BYE —'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Player B</div>
              </div>
            </div>
          </div>

          {/* Result Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Match Result *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="result"
                  value="PLAYER_A_WIN"
                  checked={result === 'PLAYER_A_WIN'}
                  onChange={(e) => setResult(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-900">
                  {match.playerA.name} Wins
                </span>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="result"
                  value="PLAYER_B_WIN"
                  checked={result === 'PLAYER_B_WIN'}
                  onChange={(e) => setResult(e.target.value)}
                  className="mr-3"
                  disabled={!match.playerB}
                />
                <span className={`font-medium ${!match.playerB ? 'text-gray-400' : 'text-gray-900'}`}>
                  {match.playerB ? match.playerB.name : 'N/A'} Wins
                </span>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="result"
                  value="DRAW"
                  checked={result === 'DRAW'}
                  onChange={(e) => setResult(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-900">Draw</span>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="result"
                  value="INTENTIONAL_DRAW"
                  checked={result === 'INTENTIONAL_DRAW'}
                  onChange={(e) => setResult(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-900">Intentional Draw</span>
              </label>
            </div>
          </div>

          {/* Game Scores */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Game Wins (optional)
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  {match.playerA.name}
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={gamesWonA}
                  onChange={(e) => setGamesWonA(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div className="text-gray-400 font-bold pt-5">-</div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  {match.playerB ? match.playerB.name : 'N/A'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={gamesWonB}
                  onChange={(e) => setGamesWonB(parseInt(e.target.value) || 0)}
                  disabled={!match.playerB}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !result}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Reporting...' : 'Report Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
