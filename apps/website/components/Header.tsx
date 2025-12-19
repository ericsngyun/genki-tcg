'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const navigation = [
    { name: 'Download', href: '/download' },
    { name: 'Support', href: '/support' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <nav className="max-w-7xl mx-auto px-6 md:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo - hidden on home, visible on other pages */}
              <Link href="/" className="pointer-events-auto opacity-0">
                <span className="text-sm font-medium tracking-[0.2em] text-white/50 hover:text-white/80 transition-colors duration-500 uppercase">
                  Genki
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8 pointer-events-auto">
                {navigation.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                  >
                    <Link
                      href={item.href}
                      className="text-xs tracking-[0.2em] text-white/30 hover:text-white/70 transition-colors duration-500 uppercase"
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 pointer-events-auto text-white/30 hover:text-white/70 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <FaTimes className="w-5 h-5" />
                ) : (
                  <FaBars className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:hidden mt-6 pointer-events-auto"
                >
                  <div className="flex flex-col gap-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-sm tracking-[0.15em] text-white/40 hover:text-white/80 transition-colors uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
