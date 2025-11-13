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
import { Badge } from '@/components/ui/badge';

interface Standing {
  userId: string;
  userName: string;
  rank: number;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  omwPercent: number;
  gwPercent: number;
}

interface PrizeDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (distributions: Array<{ userId: string; amount: number; placement: number }>) => Promise<void>;
  standings: Standing[];
  totalPrizeCredits: number;
  eventName: string;
}

export function PrizeDistributionModal({
  isOpen,
  onClose,
  onSubmit,
  standings,
  totalPrizeCredits,
  eventName,
}: PrizeDistributionModalProps) {
  const [distributions, setDistributions] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAmountChange = (userId: string, amount: string) => {
    const numAmount = parseInt(amount) || 0;
    setDistributions((prev) => ({
      ...prev,
      [userId]: numAmount,
    }));
  };

  const getTotalAllocated = () => {
    return Object.values(distributions).reduce((sum, amount) => sum + amount, 0);
  };

  const getRemaining = () => {
    return totalPrizeCredits - getTotalAllocated();
  };

  const handleSubmit = async () => {
    const totalAllocated = getTotalAllocated();

    if (totalAllocated === 0) {
      alert('Please allocate at least some credits');
      return;
    }

    if (totalAllocated > totalPrizeCredits) {
      alert(`Total allocated (${totalAllocated}) exceeds prize pool (${totalPrizeCredits})`);
      return;
    }

    const distributionArray = Object.entries(distributions)
      .filter(([_, amount]) => amount > 0)
      .map(([userId, amount]) => {
        const standing = standings.find((s) => s.userId === userId);
        return {
          userId,
          amount,
          placement: standing?.rank || 0,
        };
      });

    if (!confirm(`Distribute ${totalAllocated} credits to ${distributionArray.length} player(s)?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(distributionArray);
      onClose();
      setDistributions({});
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to distribute prizes');
    } finally {
      setSubmitting(false);
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    if (rank === 3) return 'secondary';
    return 'outline';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Distribute Prize Credits</DialogTitle>
          <DialogDescription>
            {eventName} - Allocate {totalPrizeCredits} credits to top finishers
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {/* Prize Pool Summary */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Total Prize Pool</div>
                <div className="text-2xl font-bold text-primary">{totalPrizeCredits} credits</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Remaining</div>
                <div className={`text-2xl font-bold ${getRemaining() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getRemaining()} credits
                </div>
              </div>
            </div>
            {getTotalAllocated() > 0 && (
              <div className="mt-2 pt-2 border-t border-primary/20">
                <div className="text-sm text-gray-600">Allocated: {getTotalAllocated()} credits</div>
              </div>
            )}
          </div>

          {/* Standings List */}
          <div className="space-y-2">
            {standings.slice(0, 8).map((standing) => (
              <div
                key={standing.userId}
                className={`border-2 rounded-lg p-4 transition-all ${
                  distributions[standing.userId] > 0
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <Badge variant={getRankBadgeVariant(standing.rank)} className="text-lg px-3 py-1">
                      {getRankEmoji(standing.rank)} {standing.rank}
                    </Badge>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{standing.userName}</div>
                    <div className="text-sm text-gray-600">
                      {standing.points} pts • {standing.matchWins}-{standing.matchLosses}-{standing.matchDraws} • OMW {(standing.omwPercent * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Credit Input */}
                  <div className="flex-shrink-0 w-32">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={totalPrizeCredits}
                        value={distributions[standing.userId] || ''}
                        onChange={(e) => handleAmountChange(standing.userId, e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center font-semibold"
                      />
                      <span className="text-sm text-gray-600">cr</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {standings.length > 8 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing top 8 finishers
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || getTotalAllocated() === 0 || getRemaining() < 0}
          >
            {submitting ? 'Distributing...' : `Distribute ${getTotalAllocated()} Credits`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
