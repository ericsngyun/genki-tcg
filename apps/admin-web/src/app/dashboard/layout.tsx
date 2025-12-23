'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/components/NotificationBell';

const navItems: Array<{ href: string; label: string; icon: string }> = [
  { href: '/dashboard', label: 'Events', icon: '📅' },
  { href: '/dashboard/players', label: 'Players', icon: '👥' },
  { href: '/dashboard/ratings', label: 'Ratings', icon: '📊' },
  { href: '/dashboard/credits', label: 'Credits', icon: '💳' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname?.startsWith('/dashboard/events');
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06]" role="banner">
        <div className="bg-black/80 backdrop-blur-xl">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              {/* Left: Logo + Nav */}
              <div className="flex items-center gap-10">
                <Link
                  href="/dashboard"
                  className="flex items-center group"
                  aria-label="Genki TCG Home"
                >
                  <Logo size="small" />
                </Link>

                <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
                  {navItems.map((item) => {
                    const isActive = isActiveRoute(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href as any}
                        className={`
                          relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive
                            ? 'text-white'
                            : 'text-white/50 hover:text-white/80'
                          }
                        `}
                      >
                        <span className="relative z-10">{item.label}</span>
                        {isActive && (
                          <span className="absolute inset-0 bg-white/[0.08] rounded-lg" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Right: Notifications + User */}
              <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white/70">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-white/70 hidden sm:block">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="text-sm text-white/40 hover:text-white/70 transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-white/[0.05]"
                  aria-label="Sign out of your account"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8" role="main">
        {children}
      </main>
    </div>
  );
}
