import { Download, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useMemo } from 'react';
import { UserAvatar } from '../UserAvatar';

interface Transaction {
    id: string;
    amount: number;
    reasonCode: string;
    memo?: string;
    createdAt: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
}

interface BalanceCardProps {
    user: User;
    balance: number | null;
    transactions: Transaction[];
    onExport: () => void;
    onAdjust: () => void;
    exporting: boolean;
}

export function BalanceCard({
    user,
    balance,
    transactions,
    onExport,
    onAdjust,
    exporting,
}: BalanceCardProps) {
    // Calculate statistics
    const stats = useMemo(() => {
        const totalEarned = transactions
            .filter((t) => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        const totalSpent = Math.abs(
            transactions
                .filter((t) => t.amount < 0)
                .reduce((sum, t) => sum + t.amount, 0)
        );
        const totalTransactions = transactions.length;

        return { totalEarned, totalSpent, totalTransactions };
    }, [transactions]);

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <UserAvatar
                            user={{ name: user.name, avatarUrl: user.avatarUrl }}
                            size="lg"
                            className="shadow-lg"
                        />

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-foreground tracking-tight">{user.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {transactions.length > 0 && (
                            <button
                                onClick={onExport}
                                disabled={exporting}
                                className="bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Download className="h-4 w-4" />
                                {exporting ? 'Exporting...' : 'Export'}
                            </button>
                        )}
                        <button
                            onClick={onAdjust}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Adjust Credits
                        </button>
                    </div>
                </div>
            </div>

            {/* Balance Display */}
            <div className="p-8 bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="relative">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Current Balance
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-6xl font-bold text-foreground tracking-tight">
                            {balance !== null ? balance.toLocaleString() : '—'}
                        </div>
                        <div className="text-lg text-muted-foreground font-medium pb-2">credits</div>
                    </div>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-px bg-border p-6">
                {/* Total Transactions */}
                <div className="bg-card p-4 rounded-lg hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
                        <Activity className="h-3.5 w-3.5" />
                        Transactions
                    </div>
                    <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {stats.totalTransactions}
                    </div>
                </div>

                {/* Total Earned */}
                <div className="bg-card p-4 rounded-lg hover:bg-green-500/5 transition-colors group">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Earned
                    </div>
                    <div className="text-2xl font-bold text-green-400 group-hover:scale-105 transition-transform">
                        +{stats.totalEarned.toLocaleString()}
                    </div>
                </div>

                {/* Total Spent */}
                <div className="bg-card p-4 rounded-lg hover:bg-destructive/5 transition-colors group">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
                        <TrendingDown className="h-3.5 w-3.5" />
                        Spent
                    </div>
                    <div className="text-2xl font-bold text-destructive group-hover:scale-105 transition-transform">
                        {stats.totalSpent.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
