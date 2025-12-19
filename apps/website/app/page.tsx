'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const GenkiLogo3D = dynamic(() => import('@/components/GenkiLogo3D'), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsLoaded(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 1500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />

      {/* Ambient glow behind model */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-red-900/20 blur-[100px]" />
      </div>

      {/* 3D Model - Centered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-10"
      >
        <GenkiLogo3D />
      </motion.div>

      {/* GENKI Text - Centered with 3D model */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <h1
              className="text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] font-black tracking-[-0.02em] text-white/90 select-none mix-blend-difference"
            >
              GENKI
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar - Location & Social */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 md:p-8 flex justify-between items-center"
          >
            <span className="text-[10px] sm:text-xs tracking-[0.2em] text-white/40 uppercase">
              Lakewood, CA
            </span>

            <div className="flex gap-4">
              <a
                href="https://discord.gg/6bAh6ArXhw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors duration-300"
                aria-label="Discord"
              >
                <FaDiscord className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://x.com/genkitcg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors duration-300"
                aria-label="X"
              >
                <FaXTwitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar - Tagline & CTA */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs sm:text-sm text-white/40 tracking-wide text-center sm:text-left max-w-md">
                The premier tournament platform for competitive TCG players
              </p>

              <Link
                href="/download"
                className="group flex items-center gap-3 text-white/60 hover:text-white transition-colors duration-300"
              >
                <span className="text-xs sm:text-sm tracking-[0.15em] uppercase font-medium">
                  Enter
                </span>
                <span className="w-8 sm:w-12 h-[1px] bg-white/30 group-hover:bg-white transition-colors duration-300" />
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-4 text-center sm:text-left"
            >
              <span className="text-[10px] tracking-[0.3em] text-white/20 uppercase">
                Est. 2024
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
