import { Plus, Minus } from 'lucide-react';

interface QuickActionsProps {
    onAction: (amount: number, reason: string, memo: string) => void;
}

const quickActions = [
    { amount: 10, label: '+10', color: 'green' },
    { amount: 25, label: '+25', color: 'green' },
    { amount: 50, label: '+50', color: 'green' },
    { amount: 100, label: '+100', color: 'green' },
    { amount: -5, label: '-5', color: 'red' },
    { amount: -10, label: '-10', color: 'red' },
];

export function QuickActions({ onAction }: QuickActionsProps) {
    const handleAction = (amount: number) => {
        const reason = amount > 0 ? 'MANUAL_ADD' : 'PURCHASE';
        const memo = `Quick ${amount > 0 ? 'add' : 'deduct'} ${Math.abs(amount)} credits`;
        onAction(amount, reason, memo);
    };

    return (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                    const isPositive = action.amount > 0;
                    return (
                        <button
                            key={action.label}
                            onClick={() => handleAction(action.amount)}
                            className={`
                group relative overflow-hidden
                flex items-center justify-center gap-2 px-4 py-3
                border rounded-lg text-sm font-bold
                transition-all duration-200
                hover:scale-105 hover:shadow-lg active:scale-95
                animate-in fade-in slide-in-from-bottom-2
                ${isPositive
                                    ? 'border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-500/70 shadow-green-500/0 hover:shadow-green-500/20'
                                    : 'border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive/70 shadow-destructive/0 hover:shadow-destructive/20'
                                }
              `}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Ripple effect background */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isPositive ? 'bg-green-500/5' : 'bg-destructive/5'
                                }`}></div>

                            {/* Icon */}
                            {isPositive ? (
                                <Plus className="h-4 w-4 relative z-10" />
                            ) : (
                                <Minus className="h-4 w-4 relative z-10" />
                            )}

                            {/* Label */}
                            <span className="relative z-10 tabular-nums">{Math.abs(action.amount)}</span>
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
                Click to instantly adjust credits
            </p>
        </div>
    );
}
