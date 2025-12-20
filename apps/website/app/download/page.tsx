'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaApple, FaGooglePlay, FaArrowLeft } from 'react-icons/fa';
import { HiOutlineDevicePhoneMobile, HiOutlineBolt, HiOutlineChartBar } from 'react-icons/hi2';

export default function Download() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [hoveredPlatform, setHoveredPlatform] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsLoaded(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleDownload = (platform: 'ios' | 'android') => {
    if (platform === 'ios') {
      alert('iOS app is currently in TestFlight beta. Check back soon for the App Store release!');
    } else {
      alert('Android app is coming soon! Check back for updates.');
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-zinc-800/30 blur-[120px]"
        />
      </div>

      {/* Red accent glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hoveredPlatform ? 0.3 : 0.15 }}
        transition={{ duration: 0.5 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full blur-[100px] pointer-events-none"
        style={{ backgroundColor: '#DC143C' }}
      />

      {/* Back navigation */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute top-6 left-6 sm:top-8 sm:left-8 z-40"
          >
            <Link
              href="/"
              className="group flex items-center gap-2 text-red-500/60 hover:text-red-400 transition-colors duration-300"
            >
              <FaArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-xs tracking-[0.15em] uppercase">Back</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-6">
        {/* Hero text */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-12 sm:mb-16"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="inline-block text-[10px] sm:text-xs tracking-[0.3em] text-red-500/50 uppercase mb-4"
              >
                Beta Access
              </motion.span>

              <h1
                className="text-[12vw] sm:text-[10vw] md:text-[8vw] lg:text-[6vw] font-black tracking-[-0.02em] leading-[0.9]"
                style={{ color: '#DC143C' }}
              >
                GET THE APP
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-4 sm:mt-6 text-xs sm:text-sm text-red-500/40 tracking-wide max-w-md mx-auto"
              >
                Join the competitive TCG community
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Platform buttons */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-lg"
            >
              {/* iOS Button */}
              <button
                onClick={() => handleDownload('ios')}
                onMouseEnter={() => setHoveredPlatform('ios')}
                onMouseLeave={() => setHoveredPlatform(null)}
                className="group relative flex-1 p-6 sm:p-8 border border-white/10 hover:border-red-500/30 rounded-sm bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500"
              >
                <div className="flex flex-col items-center gap-4">
                  <FaApple className="w-10 h-10 sm:w-12 sm:h-12 text-white/80 group-hover:text-white transition-colors duration-300" />
                  <div className="text-center">
                    <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1">Download on</div>
                    <div className="text-lg sm:text-xl font-semibold text-white tracking-wide">App Store</div>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 40px rgba(220, 20, 60, 0.1)' }} />
              </button>

              {/* Android Button */}
              <button
                onClick={() => handleDownload('android')}
                onMouseEnter={() => setHoveredPlatform('android')}
                onMouseLeave={() => setHoveredPlatform(null)}
                className="group relative flex-1 p-6 sm:p-8 border border-white/10 hover:border-red-500/30 rounded-sm bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500"
              >
                <div className="flex flex-col items-center gap-4">
                  <FaGooglePlay className="w-9 h-9 sm:w-11 sm:h-11 text-white/80 group-hover:text-white transition-colors duration-300" />
                  <div className="text-center">
                    <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1">Get it on</div>
                    <div className="text-lg sm:text-xl font-semibold text-white tracking-wide">Google Play</div>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 40px rgba(220, 20, 60, 0.1)' }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature pills */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-3 sm:gap-4"
            >
              {[
                { icon: HiOutlineDevicePhoneMobile, label: 'Mobile First' },
                { icon: HiOutlineBolt, label: 'Real-time' },
                { icon: HiOutlineChartBar, label: 'Rankings' },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 border border-white/5 rounded-full bg-white/[0.02]"
                  >
                    <Icon className="w-4 h-4 text-red-500/60" />
                    <span className="text-xs tracking-wide text-white/40">{feature.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom info */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-[10px] tracking-[0.2em] text-white/20 uppercase">iOS</div>
                  <div className="text-xs text-red-500/40">13.0+</div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="text-center sm:text-left">
                  <div className="text-[10px] tracking-[0.2em] text-white/20 uppercase">Android</div>
                  <div className="text-xs text-red-500/40">6.0+</div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="text-center sm:text-left">
                  <div className="text-[10px] tracking-[0.2em] text-white/20 uppercase">Size</div>
                  <div className="text-xs text-red-500/40">~50 MB</div>
                </div>
              </div>

              <Link
                href="/support"
                className="group flex items-center gap-3 text-red-500/50 hover:text-red-400 transition-colors duration-300"
              >
                <span className="text-xs tracking-[0.15em] uppercase">Support</span>
                <span className="w-6 sm:w-8 h-[1px] bg-red-500/30 group-hover:bg-red-400 transition-colors duration-300" />
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-4 text-center sm:text-left"
            >
              <span className="text-[10px] tracking-[0.3em] text-red-500/20 uppercase">
                Currently in Beta
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative corner elements */}
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-white/5 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-white/5 pointer-events-none hidden sm:block" />
    </div>
  );
}
