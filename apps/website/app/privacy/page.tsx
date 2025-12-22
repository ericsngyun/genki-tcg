'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

export default function PrivacyPolicy() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const lastUpdated = 'December 18, 2024';

  useEffect(() => {
    const timer1 = setTimeout(() => setIsLoaded(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const sections = [
    {
      title: 'Introduction',
      content: [
        'Welcome to Genki TCG. We are committed to protecting your privacy and being transparent about how we collect, use, and share your personal data.',
        'This Privacy Policy explains our practices in compliance with Apple App Store Guidelines, CCPA, GDPR, and COPPA.',
        'By using the App, you agree to the collection and use of information in accordance with this Privacy Policy.',
      ],
    },
    {
      title: 'Information We Collect',
      content: [
        '<strong>Account Information:</strong> Email address, display name, profile avatar (from Discord OAuth), Discord user ID and username.',
        '<strong>Tournament Data:</strong> Event registrations, check-ins, match results, decklist submissions, standings, and placements.',
        '<strong>Credits & Transactions:</strong> In-app credit balance, transaction history, and prize distribution records.',
        '<strong>Device Information:</strong> Device type, OS version, unique identifiers (for push notifications), and app version.',
        '<strong>Usage Analytics:</strong> Screens accessed, session duration, and navigation patterns.',
        '<strong>Crash Reports (via Sentry):</strong> Anonymized error logs and diagnostic data (no personally identifiable information).',
      ],
    },
    {
      title: 'How We Use Your Data',
      content: [
        'Authenticate your identity and manage your account.',
        'Process tournament registrations, pairings, and standings.',
        'Calculate and display player ratings and rankings.',
        'Manage credits for tournament entry fees and prizes.',
        'Send push notifications about rounds, pairings, and results.',
        'Improve app performance, fix bugs, and develop new features.',
        'Ensure security and prevent fraud.',
      ],
    },
    {
      title: 'Data Sharing',
      content: [
        'We do NOT sell your personal information to third parties.',
        '<strong>Within the Community:</strong> Your display name, standings, and rankings are visible to other players in your organization.',
        '<strong>Service Providers:</strong> Discord (OAuth), Expo (push notifications), Railway (hosting), Sentry (error tracking).',
        '<strong>Legal Requirements:</strong> When required by law or to protect our rights.',
      ],
    },
    {
      title: 'Data Retention',
      content: [
        'Account information: Retained until account deletion + 30 days.',
        'Tournament history: Retained indefinitely (anonymized after deletion).',
        'Transaction history: 7 years (legal requirements).',
        'Crash reports: 90 days.',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        '<strong>Access:</strong> View your profile, tournament history, and credit balance in the App.',
        '<strong>Update:</strong> Edit your display name and notification preferences in App settings.',
        '<strong>Delete:</strong> Request account deletion by contacting privacy@genkitcg.com.',
        '<strong>CCPA/GDPR:</strong> California and EU residents have additional rights including data portability and objection to processing.',
      ],
    },
    {
      title: 'Security',
      content: [
        'All data is encrypted using HTTPS/TLS 1.2+.',
        'API endpoints protected with JWT-based authentication.',
        'Regular security audits and prompt patching.',
        'No method of transmission or storage is 100% secure; we strive to protect your data with commercially reasonable means.',
      ],
    },
    {
      title: 'Children\'s Privacy',
      content: [
        'Genki TCG is intended for users aged 13 and older.',
        'We do not knowingly collect personal information from children under 13.',
        'If you believe we have data from a child, please contact us immediately at privacy@genkitcg.com.',
      ],
    },
    {
      title: 'Third-Party Services',
      content: [
        '<strong>Discord:</strong> Authentication — <a href="https://discord.com/privacy" class="text-red-400 hover:underline">Privacy Policy</a>',
        '<strong>Expo:</strong> Push Notifications — <a href="https://expo.dev/privacy" class="text-red-400 hover:underline">Privacy Policy</a>',
        '<strong>Railway:</strong> Hosting — <a href="https://railway.app/legal/privacy" class="text-red-400 hover:underline">Privacy Policy</a>',
        '<strong>Sentry:</strong> Error Tracking — <a href="https://sentry.io/privacy/" class="text-red-400 hover:underline">Privacy Policy</a>',
      ],
    },
    {
      title: 'Contact',
      content: [
        'Privacy: privacy@genkitcg.com',
        'Support: support@genkitcg.com',
        'Website: https://genkitcg.com/support',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />

      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Back navigation */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="fixed top-6 left-6 sm:top-8 sm:left-8 z-40"
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
      <div className="relative z-10 pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-16"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="inline-block text-[10px] sm:text-xs tracking-[0.3em] text-red-500/50 uppercase mb-4"
                >
                  Legal
                </motion.span>

                <h1
                  className="text-[8vw] sm:text-[6vw] md:text-[4vw] font-black tracking-[-0.02em] leading-[0.9]"
                  style={{ color: '#DC143C' }}
                >
                  PRIVACY POLICY
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-4 text-xs text-white/30 tracking-wide"
                >
                  Last updated: {lastUpdated}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Sections */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-6"
              >
                {sections.map((section, index) => (
                  <motion.section
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                    className="p-6 border border-white/5 bg-white/[0.01]"
                  >
                    <h2 className="text-xs tracking-[0.2em] text-red-500/60 uppercase mb-4">
                      {section.title}
                    </h2>
                    <div className="space-y-3">
                      {section.content.map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className="text-sm text-white/50 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: paragraph }}
                        />
                      ))}
                    </div>
                  </motion.section>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom navigation */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <Link
                  href="/terms"
                  className="text-xs tracking-[0.15em] text-white/30 hover:text-red-400 uppercase transition-colors duration-300"
                >
                  Terms of Service →
                </Link>
                <Link
                  href="/support"
                  className="text-xs tracking-[0.15em] text-white/30 hover:text-red-400 uppercase transition-colors duration-300"
                >
                  Support Center →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-8 right-8 w-16 h-16 border-t border-r border-white/5 pointer-events-none hidden sm:block" />
      <div className="fixed bottom-8 left-8 w-16 h-16 border-b border-l border-white/5 pointer-events-none hidden sm:block" />
    </div>
  );
}
