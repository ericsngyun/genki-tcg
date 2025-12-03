import { Filter, Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Transaction {
    id: string;
    amount: number;
    reasonCode: string;
    memo?: string;
    createdAt: string;
    createdByUser?: {
        name: string;
    };
}

interface PaginationInfo {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
    pagination: PaginationInfo | null;
    loading: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
}

const reasonCodeLabels: Record<string, { label: string; icon: string }> = {
    MANUAL_ADD: { label: 'Manual Add', icon: '➕' },
    MANUAL_DEDUCT: { label: 'Manual Deduct', icon: '➖' },
    PRIZE: { label: 'Prize', icon: '🏆' },
    REFUND: { label: 'Refund', icon: '💰' },
    PURCHASE: { label: 'Purchase', icon: '🛒' },
    EVENT_ENTRY: { label: 'Event Entry', icon: '🎫' },
    EVENT_REFUND: { label: 'Event Refund', icon: '↩️' },
};

export function TransactionHistory({
    transactions,
    pagination,
    loading,
    loadingMore,
    onLoadMore,
}: TransactionHistoryProps) {
    const [filter, setFilter] = useState<string>('ALL');
    const [showFilters, setShowFilters] = useState(false);

    const filteredTransactions = transactions.filter((tx) => {
        if (filter === 'ALL') return true;
        return tx.reasonCode === filter;
    });

    const availableReasonCodes = Array.from(
        new Set(transactions.map((t) => t.reasonCode))
    );

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            {/* Header with Filters */}
            <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground text-lg tracking-tight">Transaction History</h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="animate-in slide-in-from-top-2 duration-200 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                                Transaction Type
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'ALL'
                                            ? 'bg-primary text-primary-foreground shadow-md'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    All ({transactions.length})
                                </button>
                                {availableReasonCodes.map((code) => {
                                    const count = transactions.filter((t) => t.reasonCode === code).length;
                                    const info = reasonCodeLabels[code] || { label: code, icon: '📝' };
                                    return (
                                        <button
                                            key={code}
                                            onClick={() => setFilter(code)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === code
                                                    ? 'bg-primary text-primary-foreground shadow-md'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                }`}
                                        >
                                            {info.icon} {info.label} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction List */}
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground mt-3 animate-pulse">Loading transactions...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📜</span>
                        </div>
                        <p className="text-muted-foreground font-medium">No transactions yet</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            {filter !== 'ALL' ? 'Try changing the filter' : 'Transactions will appear here'}
                        </p>
                    </div>
                ) : (
                    <>
                        {filteredTransactions.map((tx, index) => {
                            const info = reasonCodeLabels[tx.reasonCode] || { label: tx.reasonCode.replace(/_/g, ' '), icon: '📝' };
                            return (
                                <div
                                    key={tx.id}
                                    className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-all group animate-in fade-in slide-in-from-right-2 duration-300"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Amount and Icon */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">{info.icon}</span>
                                                <div
                                                    className={`text-xl font-bold tabular-nums ${tx.amount > 0 ? 'text-green-400' : 'text-destructive'
                                                        }`}
                                                >
                                                    {tx.amount > 0 ? '+' : ''}
                                                    {tx.amount.toLocaleString()} credits
                                                </div>
                                            </div>

                                            {/* Reason Code */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2.5 py-1 bg-muted/80 text-muted-foreground rounded-md font-medium border border-border/50">
                                                    {info.label}
                                                </span>
                                                {tx.createdByUser && (
                                                    <span className="text-xs text-muted-foreground">
                                                        by {tx.createdByUser.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Memo */}
                                            {tx.memo && (
                                                <div className="text-sm text-muted-foreground italic mt-2 px-3 py-2 bg-muted/30 rounded-lg border-l-2 border-primary/30">
                                                    "{tx.memo}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="text-right flex-shrink-0">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground/70 mt-0.5">
                                                {new Date(tx.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load More Button */}
                        {pagination?.hasMore && (
                            <div className="p-4 border-t border-border bg-card/50">
                                <button
                                    onClick={onLoadMore}
                                    disabled={loadingMore}
                                    className="w-full py-3 px-4 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-muted/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    {loadingMore ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            Loading...
                                        </span>
                                    ) : (
                                        'Load More Transactions'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
