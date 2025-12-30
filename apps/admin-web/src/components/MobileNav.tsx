'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, Calendar, Users, BarChart3, CreditCard, LogOut } from 'lucide-react';
import { Logo } from './Logo';

interface MobileNavProps {
  user: {
    name?: string;
  };
  onLogout: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Events', icon: Calendar },
  { href: '/dashboard/players', label: 'Players', icon: Users },
  { href: '/dashboard/ratings', label: 'Ratings', icon: BarChart3 },
  { href: '/dashboard/credits', label: 'Credits', icon: CreditCard },
];

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname?.startsWith('/dashboard/events');
    }
    return pathname?.startsWith(href);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Hamburger Button - Only visible on mobile */}
      <Dialog.Trigger asChild>
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />

        {/* Drawer */}
        <Dialog.Content
          className="fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-black border-r border-white/[0.1] z-50 flex flex-col data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <Logo size="small" />
            <Dialog.Close asChild>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/[0.05] transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </Dialog.Close>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Mobile navigation">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as any}
                      className={`
                        flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer - User Info & Logout */}
          <div className="p-4 border-t border-white/[0.06]">
            {/* User Info */}
            <div className="flex items-center gap-3 px-3 py-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white/70">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-white/50">Administrator</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
