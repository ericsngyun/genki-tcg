import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface PlayerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  category: string;
}

interface HistoryEntry {
  eventId: string;
  eventName: string;
  eventDate: string;
  matchId: string;
  opponentId?: string;
  opponentName?: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  matchResult: string;
  createdAt: string;
}

export function PlayerHistoryModal({
  isOpen,
  onClose,
  playerId,
  playerName,
  category,
}: PlayerHistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, playerId, category]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getPlayerRatingHistory(playerId, category, { limit: 50 });
      setHistory(data.history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getResultColor = (result: string) => {
    if (result.includes('WIN')) return 'text-green-400';
    if (result.includes('LOSS')) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getResultText = (result: string) => {
    return result
      .replace('PLAYER_A_WIN', 'Win')
      .replace('PLAYER_B_WIN', 'Loss')
      .replace('DRAW', 'Draw')
      .replace('INTENTIONAL_DRAW', 'Draw (ID)');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{playerName}</h2>
            <p className="text-sm text-muted-foreground mt-1">Rating History</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No rating history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div
                  key={`${entry.eventId}-${entry.matchId}-${index}`}
                  className="bg-muted/50 rounded-lg p-4 border border-border hover:border-primary/30 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{entry.eventName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.eventDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' · '}
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getResultColor(
                        entry.matchResult
                      )} bg-current/10`}
                    >
                      {getResultText(entry.matchResult)}
                    </div>
                  </div>

                  {entry.opponentName && (
                    <p className="text-sm text-muted-foreground mb-3">
                      vs {entry.opponentName}
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rating:</span>
                      <span className="font-mono font-bold text-foreground">
                        {entry.ratingBefore}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono font-bold text-foreground">
                        {entry.ratingAfter}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {entry.ratingChange > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="font-mono font-bold text-green-400">
                            +{entry.ratingChange}
                          </span>
                        </>
                      ) : entry.ratingChange < 0 ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="font-mono font-bold text-red-400">
                            {entry.ratingChange}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono font-bold text-muted-foreground">±0</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
