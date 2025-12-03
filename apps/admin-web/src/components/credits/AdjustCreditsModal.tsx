import { X, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdjustCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number, reason: string, memo: string) => Promise<void>;
    userName: string;
}

const reasonOptions = [
    { value: 'MANUAL_ADD', label: 'Manual Add', icon: '➕' },
    { value: 'MANUAL_DEDUCT', label: 'Manual Deduct', icon: '➖' },
    { value: 'PRIZE', label: 'Prize', icon: '🏆' },
    { value: 'REFUND', label: 'Refund', icon: '💰' },
    { value: 'PURCHASE', label: 'Purchase', icon: '🛒' },
    { value: 'EVENT_ENTRY', label: 'Event Entry', icon: '🎫' },
    { value: 'EVENT_REFUND', label: 'Event Refund', icon: '↩️' },
];

export function AdjustCreditsModal({
    isOpen,
    onClose,
    onSubmit,
    userName,
}: AdjustCreditsModalProps) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('MANUAL_ADD');
    const [memo, setMemo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setAmount('');
            setReason('MANUAL_ADD');
            setMemo('');
            setError('');
        }
    }, [isOpen]);

    const validate = (): boolean => {
        const numAmount = parseInt(amount);

        if (!amount || isNaN(numAmount) || numAmount === 0) {
            setError('Please enter a non-zero amount');
            return false;
        }

        if (Math.abs(numAmount) > 10000) {
            setError('Maximum 10,000 credits per transaction');
            return false;
        }

        setError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const numAmount = parseInt(amount);

        // Confirmation for large adjustments
        if (Math.abs(numAmount) >= 500) {
            const confirmed = confirm(
                `Are you sure you want to ${numAmount > 0 ? 'add' : 'deduct'} ${Math.abs(numAmount)} credits ${numAmount > 0 ? 'to' : 'from'} ${userName}?`
            );
            if (!confirmed) return;
        }

        setSubmitting(true);
        try {
            await onSubmit(numAmount, reason, memo);
            onClose();
        } catch (err) {
            setError('Failed to adjust credits');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const numAmount = parseInt(amount) || 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-border animate-in zoom-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                        Adjust Credits
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                    Adjusting credits for <span className="font-semibold text-foreground">{userName}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Amount <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg font-mono"
                            placeholder="Enter amount (e.g., 100 or -50)"
                            min="-10000"
                            max="10000"
                            disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Use positive numbers to add, negative to deduct (max ±10,000)
                        </p>

                        {/* Amount Preview */}
                        {numAmount !== 0 && (
                            <div className={`mt-3 p-3 rounded-lg border ${numAmount > 0
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-destructive/10 border-destructive/30 text-destructive'
                                }`}>
                                <div className="text-sm font-medium">
                                    Will {numAmount > 0 ? 'add' : 'deduct'} {Math.abs(numAmount).toLocaleString()} credits {numAmount > 0 ? 'to' : 'from'} {userName}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reason Select */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Reason <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            disabled={submitting}
                        >
                            {reasonOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Memo Input */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Memo <span className="text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none transition-all"
                            placeholder="Add a note about this adjustment..."
                            maxLength={200}
                            disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                            {memo.length}/200 characters
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting || !amount}
                            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                                    Processing...
                                </span>
                            ) : (
                                'Confirm Adjustment'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-3 border border-border rounded-lg font-semibold text-foreground hover:bg-muted/50 transition-all disabled:opacity-50 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
