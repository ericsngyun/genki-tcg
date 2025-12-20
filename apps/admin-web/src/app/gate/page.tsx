'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Logo } from '../../components/Logo';

function GateContent() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/gate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Redirect to original destination or dashboard
                const redirect = searchParams.get('redirect') || '/';
                router.push(redirect as any);
                router.refresh();
            } else {
                setError(data.message || 'Invalid password');
            }
        } catch (err) {
            setError('Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background with Genki Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a2e_0%,#000000_100%)] z-0" />

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
            </div>

            <div className="relative w-full max-w-md z-10">
                {/* Logo/Brand */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="mb-6 scale-125">
                        <Logo />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight mt-4">
                        Admin Access
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Please verify your identity to continue
                    </p>
                </div>

                {/* Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5">
                        <div className="space-y-2 mb-6">
                            <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Site Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="block w-full pl-10 pr-10 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    autoFocus
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <ShieldCheck className="w-4 h-4 text-destructive shrink-0" />
                                <p className="text-sm text-destructive font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <span>Unlock Admin Panel</span>
                                    <Lock className="w-4 h-4 opacity-80" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-muted-foreground/50">
                        Authorized Personnel Only • Genki TCG
                    </p>
                </div>
            </div>
        </div>
    );
}

function GateLoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a2e_0%,#000000_100%)] z-0" />
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground text-sm">Loading...</p>
            </div>
        </div>
    );
}

export default function GatePage() {
    return (
        <Suspense fallback={<GateLoadingFallback />}>
            <GateContent />
        </Suspense>
    );
}
