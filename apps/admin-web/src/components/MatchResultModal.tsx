'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Match Result - Table {match.tableNumber}</DialogTitle>
          <DialogDescription>
            Select the match result and optionally enter game scores
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Match Info */}
          <div className="mb-6">
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
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="result"
                  value="PLAYER_A_WIN"
                  checked={result === 'PLAYER_A_WIN'}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="ml-3 font-medium text-gray-900">
                  {match.playerA.name} Wins
                </span>
              </label>
              <label className={`flex items-center p-3 border-2 border-gray-200 rounded-lg transition-all ${
                match.playerB
                  ? 'cursor-pointer hover:bg-gray-50 hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5'
                  : 'opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="radio"
                  name="result"
                  value="PLAYER_B_WIN"
                  checked={result === 'PLAYER_B_WIN'}
                  onChange={(e) => setResult(e.target.value)}
                  disabled={!match.playerB}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <span className="ml-3 font-medium text-gray-900">
                  {match.playerB ? match.playerB.name : 'N/A'} Wins
                </span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="result"
                  value="DRAW"
                  checked={result === 'DRAW'}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="ml-3 font-medium text-gray-900">Draw</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="result"
                  value="INTENTIONAL_DRAW"
                  checked={result === 'INTENTIONAL_DRAW'}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="ml-3 font-medium text-gray-900">Intentional Draw</span>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !result}
            >
              {submitting ? 'Reporting...' : 'Report Result'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
