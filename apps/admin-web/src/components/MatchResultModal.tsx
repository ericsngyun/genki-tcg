'use client';

import { useState, useEffect, useMemo } from 'react';
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

type GameWinner = 'A' | 'B' | null;

export function MatchResultModal({ isOpen, onClose, onSubmit, match, gameType }: MatchResultModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useManualEntry, setUseManualEntry] = useState(false);

  // Bo3 game-by-game selection
  const [gameWinners, setGameWinners] = useState<[GameWinner, GameWinner, GameWinner]>([null, null, null]);

  // Manual entry fields
  const [manualResult, setManualResult] = useState<string>('');
  const [manualGamesA, setManualGamesA] = useState<number>(0);
  const [manualGamesB, setManualGamesB] = useState<number>(0);

  // Riftbound always uses Bo3 selector
  const isRiftbound = gameType === 'RIFTBOUND';

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGameWinners([null, null, null]);
      setManualResult('');
      setManualGamesA(0);
      setManualGamesB(0);
      setError(null);
      setUseManualEntry(false);
    }
  }, [isOpen]);

  // Calculate result from game selections
  const calculatedResult = useMemo(() => {
    const winsA = gameWinners.filter(w => w === 'A').length;
    const winsB = gameWinners.filter(w => w === 'B').length;

    let result: string | null = null;
    if (winsA >= 2) result = 'PLAYER_A_WIN';
    else if (winsB >= 2) result = 'PLAYER_B_WIN';
    else if (winsA === 1 && winsB === 1 && gameWinners[2] === null) {
      // 1-1 with no game 3 selected - incomplete
      result = null;
    }

    return {
      result,
      gamesWonA: winsA,
      gamesWonB: winsB,
      isComplete: result !== null,
      gamesPlayed: gameWinners.filter(w => w !== null).length,
    };
  }, [gameWinners]);

  const handleGameWinnerSelect = (gameIndex: number, winner: GameWinner) => {
    const newWinners = [...gameWinners] as [GameWinner, GameWinner, GameWinner];

    // Toggle off if clicking the same selection
    if (newWinners[gameIndex] === winner) {
      newWinners[gameIndex] = null;
    } else {
      newWinners[gameIndex] = winner;
    }

    // Clear later games if match is already decided
    const winsA = newWinners.filter(w => w === 'A').length;
    const winsB = newWinners.filter(w => w === 'B').length;

    // If someone has won 2, clear game 3 unless we're toggling it
    if (gameIndex < 2 && (winsA >= 2 || winsB >= 2)) {
      newWinners[2] = null;
    }

    setGameWinners(newWinners);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalResult: string;
    let finalGamesA: number;
    let finalGamesB: number;

    if (useManualEntry || !isRiftbound) {
      // Manual entry validation
      if (!manualResult) {
        setError('Please select a result');
        return;
      }

      finalResult = manualResult;
      finalGamesA = manualGamesA;
      finalGamesB = manualGamesB;

      // Validate manual entry
      if (isRiftbound) {
        if (finalGamesA > 2 || finalGamesB > 2) {
          setError('Maximum 2 game wins per player in Best of 3');
          return;
        }
        if (finalGamesA === 2 && finalGamesB === 2) {
          setError('Invalid: Both players cannot win 2 games');
          return;
        }
        if (finalResult === 'PLAYER_A_WIN' && finalGamesA !== 2) {
          setError('Winner must have exactly 2 game wins');
          return;
        }
        if (finalResult === 'PLAYER_B_WIN' && finalGamesB !== 2) {
          setError('Winner must have exactly 2 game wins');
          return;
        }
      }
    } else {
      // Game-by-game selection validation
      if (!calculatedResult.isComplete) {
        setError('Please select the winner for each game played');
        return;
      }

      finalResult = calculatedResult.result!;
      finalGamesA = calculatedResult.gamesWonA;
      finalGamesB = calculatedResult.gamesWonB;
    }

    setSubmitting(true);
    try {
      await onSubmit(finalResult, finalGamesA, finalGamesB);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to report result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  // Get display names (truncated if too long)
  const playerAName = match.playerA.name.length > 12
    ? match.playerA.name.substring(0, 12) + '...'
    : match.playerA.name;
  const playerBName = match.playerB
    ? (match.playerB.name.length > 12 ? match.playerB.name.substring(0, 12) + '...' : match.playerB.name)
    : 'BYE';

  // Bo3 Game Selector Component
  const Bo3GameSelector = () => {
    const games = [
      { index: 0, label: 'Game 1' },
      { index: 1, label: 'Game 2' },
      { index: 2, label: 'Game 3' },
    ];

    // Check if game 3 is needed (only if 1-1 after games 1 and 2)
    const winsAfterTwo = {
      A: gameWinners.slice(0, 2).filter(w => w === 'A').length,
      B: gameWinners.slice(0, 2).filter(w => w === 'B').length,
    };
    const needsGame3 = winsAfterTwo.A === 1 && winsAfterTwo.B === 1;
    const matchDecided = calculatedResult.gamesWonA >= 2 || calculatedResult.gamesWonB >= 2;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Select Game Winners
          </label>
          <button
            type="button"
            onClick={() => setUseManualEntry(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Enter manually
          </button>
        </div>

        <div className="space-y-2">
          {games.map(({ index, label }) => {
            const isGame3 = index === 2;
            const isDisabled = isGame3 && !needsGame3 && !gameWinners[2];
            const isGreyedOut = isGame3 && matchDecided && !gameWinners[2];
            const winner = gameWinners[index];

            return (
              <div
                key={index}
                className={`relative rounded-lg border transition-all ${
                  isGreyedOut
                    ? 'border-border/50 bg-muted/30 opacity-50'
                    : winner
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-background hover:border-border/80'
                }`}
              >
                {/* Game Label */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground w-14">
                  {label}
                </div>

                {/* Player Buttons */}
                <div className="flex ml-16 mr-1 my-1 gap-1">
                  <button
                    type="button"
                    disabled={isDisabled || submitting}
                    onClick={() => handleGameWinnerSelect(index, 'A')}
                    className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                      winner === 'A'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {playerAName}
                  </button>
                  <button
                    type="button"
                    disabled={isDisabled || submitting || !match.playerB}
                    onClick={() => handleGameWinnerSelect(index, 'B')}
                    className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                      winner === 'B'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {playerBName}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Result Preview */}
        {calculatedResult.gamesPlayed > 0 && (
          <div className={`mt-4 p-3 rounded-lg border text-center ${
            calculatedResult.isComplete
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className="text-sm font-medium">
              {calculatedResult.isComplete ? (
                <span className="text-emerald-400">
                  {calculatedResult.result === 'PLAYER_A_WIN' ? match.playerA.name : match.playerB?.name} wins{' '}
                  <span className="font-bold">{calculatedResult.gamesWonA}-{calculatedResult.gamesWonB}</span>
                </span>
              ) : (
                <span className="text-amber-400">
                  Score: {calculatedResult.gamesWonA}-{calculatedResult.gamesWonB}
                  {needsGame3 && !gameWinners[2] && ' — Select Game 3 winner'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Manual Entry Component (for non-Riftbound or when toggled)
  const ManualEntry = () => (
    <div className="space-y-6">
      {isRiftbound && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Manual Score Entry</label>
          <button
            type="button"
            onClick={() => setUseManualEntry(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Use game selector
          </button>
        </div>
      )}

      {/* Result Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Match Result *
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-3 border-2 border-border rounded-lg cursor-pointer hover:bg-muted hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="result"
              value="PLAYER_A_WIN"
              checked={manualResult === 'PLAYER_A_WIN'}
              onChange={(e) => setManualResult(e.target.value)}
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
              checked={manualResult === 'PLAYER_B_WIN'}
              onChange={(e) => setManualResult(e.target.value)}
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
              checked={manualResult === 'DRAW'}
              onChange={(e) => setManualResult(e.target.value)}
              className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              disabled={submitting}
            />
            <span className="ml-3 font-medium text-foreground">Draw</span>
          </label>
          {!isRiftbound && (
            <label className="flex items-center p-3 border-2 border-border rounded-lg cursor-pointer hover:bg-muted hover:border-primary/50 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="result"
                value="INTENTIONAL_DRAW"
                checked={manualResult === 'INTENTIONAL_DRAW'}
                onChange={(e) => setManualResult(e.target.value)}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                disabled={submitting}
              />
              <span className="ml-3 font-medium text-foreground">Intentional Draw</span>
            </label>
          )}
        </div>
      </div>

      {/* Game Scores */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Game Wins {isRiftbound ? '(required)' : '(optional)'}
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              {match.playerA.name}
            </label>
            <input
              type="number"
              min="0"
              max={isRiftbound ? 2 : 9}
              value={manualGamesA}
              onChange={(e) => setManualGamesA(Math.min(parseInt(e.target.value) || 0, isRiftbound ? 2 : 9))}
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
              max={isRiftbound ? 2 : 9}
              value={manualGamesB}
              onChange={(e) => setManualGamesB(Math.min(parseInt(e.target.value) || 0, isRiftbound ? 2 : 9))}
              disabled={!match.playerB || submitting}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-muted disabled:cursor-not-allowed transition-all text-center text-lg font-bold"
            />
          </div>
        </div>
        {isRiftbound && (
          <p className="text-xs text-muted-foreground mt-2">
            Valid scores: 2-0, 2-1, 1-2, 0-2
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Report Result — Table {match.tableNumber}
            {isRiftbound && (
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium">
                Bo3
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isRiftbound && !useManualEntry
              ? 'Select the winner of each game'
              : 'Enter the match result'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Match Info Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="text-center flex-1">
                <div className="font-semibold text-foreground text-sm">{match.playerA.name}</div>
              </div>
              <div className="text-muted-foreground font-medium text-xs px-3">vs</div>
              <div className="text-center flex-1">
                <div className="font-semibold text-foreground text-sm">
                  {match.playerB ? match.playerB.name : '— BYE —'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {isRiftbound && !useManualEntry ? (
            <Bo3GameSelector />
          ) : (
            <ManualEntry />
          )}

          {/* Actions */}
          <DialogFooter className="mt-6">
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
              disabled={submitting || (isRiftbound && !useManualEntry && !calculatedResult.isComplete) || (!isRiftbound && !manualResult) || (useManualEntry && !manualResult)}
            >
              {submitting ? 'Reporting...' : 'Report Result'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
