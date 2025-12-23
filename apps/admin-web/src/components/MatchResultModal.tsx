'use client';

import { useState, useEffect } from 'react';
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
  gameType?: string;
}

export function MatchResultModal({ isOpen, onClose, onSubmit, match, gameType }: MatchResultModalProps) {
  const [result, setResult] = useState<string>('');
  const [gamesWonA, setGamesWonA] = useState<number>(0);
  const [gamesWonB, setGamesWonB] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if this is a Best of 3 match (Riftbound)
  const isBo3 = gameType === 'RIFTBOUND';
  const maxGames = isBo3 ? 2 : 9;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setResult('');
      setGamesWonA(0);
      setGamesWonB(0);
      setError(null);
    }
  }, [isOpen]);

  // Auto-set scores based on result for non-Bo3 when user selects result
  useEffect(() => {
    if (!isBo3 && result) {
      if (result === 'PLAYER_A_WIN' && gamesWonA === 0 && gamesWonB === 0) {
        setGamesWonA(1);
        setGamesWonB(0);
      } else if (result === 'PLAYER_B_WIN' && gamesWonA === 0 && gamesWonB === 0) {
        setGamesWonA(0);
        setGamesWonB(1);
      }
    }
  }, [result, isBo3, gamesWonA, gamesWonB]);

  const validateBo3Score = (): string | null => {
    if (!isBo3) return null;

    if (gamesWonA > 2 || gamesWonB > 2) {
      return 'Maximum 2 game wins per player in Best of 3';
    }

    if (gamesWonA === 2 && gamesWonB === 2) {
      return 'Invalid: Both players cannot win 2 games in Best of 3';
    }

    const totalGames = gamesWonA + gamesWonB;
    if (totalGames < 2 || totalGames > 3) {
      return 'Total games must be 2 or 3 in Best of 3';
    }

    if (result === 'PLAYER_A_WIN' && gamesWonA !== 2) {
      return 'Player A must have 2 game wins to win the match';
    }

    if (result === 'PLAYER_B_WIN' && gamesWonB !== 2) {
      return 'Player B must have 2 game wins to win the match';
    }

    if (result === 'DRAW' && gamesWonA !== gamesWonB) {
      return 'Draw requires equal game wins';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!result) {
      setError('Please select a result');
      return;
    }

    // Bo3 validation
    const bo3Error = validateBo3Score();
    if (bo3Error) {
      setError(bo3Error);
      return;
    }

    // General validation for non-Bo3
    if (!isBo3) {
      if (result === 'PLAYER_A_WIN' && gamesWonA <= gamesWonB && gamesWonA > 0) {
        setError('Player A wins should have more game wins than Player B');
        return;
      }
      if (result === 'PLAYER_B_WIN' && gamesWonB <= gamesWonA && gamesWonB > 0) {
        setError('Player B wins should have more game wins than Player A');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(result, gamesWonA, gamesWonB);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to report result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setResult('');
      setGamesWonA(0);
      setGamesWonB(0);
      setError(null);
      onClose();
    }
  };

  // Quick score buttons for Bo3
  const Bo3QuickScores = () => {
    if (!isBo3) return null;

    const scores = [
      { a: 2, b: 0, label: '2-0', winner: 'A' },
      { a: 2, b: 1, label: '2-1', winner: 'A' },
      { a: 1, b: 2, label: '1-2', winner: 'B' },
      { a: 0, b: 2, label: '0-2', winner: 'B' },
    ];

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Quick Score Selection
        </label>
        <div className="grid grid-cols-4 gap-2">
          {scores.map((score) => {
            const isSelected = gamesWonA === score.a && gamesWonB === score.b;
            const expectedResult = score.winner === 'A' ? 'PLAYER_A_WIN' : 'PLAYER_B_WIN';
            return (
              <button
                key={score.label}
                type="button"
                onClick={() => {
                  setGamesWonA(score.a);
                  setGamesWonB(score.b);
                  setResult(expectedResult);
                }}
                className={`py-2.5 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted'
                }`}
              >
                {score.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Report Match Result - Table {match.tableNumber}
            {isBo3 && (
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium">
                Best of 3
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBo3
              ? 'Select the match result and enter the game score (e.g., 2-1 or 2-0)'
              : 'Select the match result and optionally enter game scores'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Match Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-muted rounded-lg p-4">
              <div className="text-center flex-1">
                <div className="font-bold text-foreground">{match.playerA.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Player A</div>
              </div>
              <div className="text-muted-foreground font-bold text-lg px-4">vs</div>
              <div className="text-center flex-1">
                <div className="font-bold text-foreground">
                  {match.playerB ? match.playerB.name : '— BYE —'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Player B</div>
              </div>
            </div>
          </div>

          {/* Bo3 Quick Score Selection */}
          <Bo3QuickScores />

          {/* Result Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Match Result *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-border rounded-lg cursor-pointer hover:bg-muted hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="result"
                  value="PLAYER_A_WIN"
                  checked={result === 'PLAYER_A_WIN'}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                  disabled={submitting}
                />
                <span className="ml-3 font-medium text-foreground">
                  {match.playerA.name} Wins
                </span>
              </label>
              <label className={`flex items-center p-3 border-2 border-border rounded-lg transition-all ${
                match.playerB
                  ? 'cursor-pointer hover:bg-muted hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5'
                  : 'opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="radio"
                  name="result"
                  value="PLAYER_B_WIN"
                  checked={result === 'PLAYER_B_WIN'}
                  onChange={(e) => setResult(e.target.value)}
                  disabled={!match.playerB || submitting}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <span className="ml-3 font-medium text-foreground">
                  {match.playerB ? match.playerB.name : 'N/A'} Wins
                </span>
              </label>
              <label className="flex items-center p-3 border-2 border-border rounded-lg cursor-pointer hover:bg-muted hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="result"
                  value="DRAW"
                  checked={result === 'DRAW'}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                  disabled={submitting}
                />
                <span className="ml-3 font-medium text-foreground">Draw</span>
              </label>
              {!isBo3 && (
                <label className="flex items-center p-3 border-2 border-border rounded-lg cursor-pointer hover:bg-muted hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="result"
                    value="INTENTIONAL_DRAW"
                    checked={result === 'INTENTIONAL_DRAW'}
                    onChange={(e) => setResult(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                  />
                  <span className="ml-3 font-medium text-foreground">Intentional Draw</span>
                </label>
              )}
            </div>
          </div>

          {/* Game Scores */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Game Wins {isBo3 ? '*' : '(optional)'}
              {isBo3 && (
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  Max 2 games each
                </span>
              )}
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">
                  {match.playerA.name}
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxGames}
                  value={gamesWonA}
                  onChange={(e) => setGamesWonA(Math.min(parseInt(e.target.value) || 0, maxGames))}
                  disabled={submitting}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:opacity-50 transition-all text-center text-lg font-bold"
                />
              </div>
              <div className="text-muted-foreground font-bold text-lg pt-5">-</div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">
                  {match.playerB ? match.playerB.name : 'N/A'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxGames}
                  value={gamesWonB}
                  onChange={(e) => setGamesWonB(Math.min(parseInt(e.target.value) || 0, maxGames))}
                  disabled={!match.playerB || submitting}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-muted disabled:cursor-not-allowed transition-all text-center text-lg font-bold"
                />
              </div>
            </div>
            {isBo3 && (
              <p className="text-xs text-muted-foreground mt-2">
                Winner must have exactly 2 game wins. Valid scores: 2-0, 2-1, 1-2, 0-2
              </p>
            )}
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
