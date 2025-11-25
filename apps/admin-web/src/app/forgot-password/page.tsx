'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle red glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo size="medium" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
              <div className="mt-2 h-0.5 w-16 bg-primary mx-auto rounded-full" />
            </div>

            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/30 text-foreground px-4 py-3 rounded-lg text-sm">
                <p className="font-medium mb-2">Password reset email sent!</p>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
                  Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>

              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Didn't receive the email? Check your spam folder.</p>
                <p>The reset link will expire in 1 hour.</p>
              </div>

              <Link
                href="/login"
                className="block w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition text-center shadow-lg shadow-primary/20"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle red glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/genki-logo.png"
                alt="Genki TCG Logo"
                width={180}
                height={54}
                priority
                className="h-14 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
            <div className="mt-2 h-0.5 w-16 bg-primary mx-auto rounded-full" />
            <p className="mt-4 text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-foreground placeholder:text-muted-foreground"
                placeholder="owner@genki-tcg.com"
                required
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
