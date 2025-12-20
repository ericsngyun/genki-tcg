'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/components/NotificationBell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border backdrop-blur-sm sticky top-0 z-50" role="banner">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="flex items-center"
                aria-label="Genki TCG Home"
              >
                <Logo size="small" />
              </Link>
              <nav className="hidden md:flex space-x-1" aria-label="Main navigation">
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background font-medium"
                  aria-label="Events management"
                >
                  Events
                </Link>
                <Link
                  href="/dashboard/players"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background font-medium"
                  aria-label="Players management"
                >
                  Players
                </Link>
                <Link
                  href="/dashboard/credits"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background font-medium"
                  aria-label="Credits management"
                >
                  Credits
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="text-sm text-foreground" role="status" aria-label={`Logged in as ${user.name}`}>
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg px-3 py-2 font-medium"
                aria-label="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {children}
      </main>
    </div>
  );
}
