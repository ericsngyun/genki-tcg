'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

export default function TermsOfService() {
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
      title: 'Agreement to Terms',
      content: [
        'These Terms and Conditions constitute a legally binding agreement governing your use of the Genki TCG mobile application and related services.',
        'By downloading, installing, or using the App, you agree to be bound by these Terms.',
        'If you do not agree, you must not use the Service.',
      ],
    },
    {
      title: 'Eligibility',
      content: [
        'You must be at least 13 years old to use the Service.',
        'Users between 13 and 18 must have parental or guardian consent.',
        'You must provide accurate and complete information during registration.',
        'One account per person is permitted.',
      ],
    },
    {
      title: 'Account Security',
      content: [
        'You are responsible for maintaining the confidentiality of your account.',
        'You are responsible for all activities that occur under your account.',
        'Promptly notify us of any unauthorized access at support@genkitcg.com.',
        'We may suspend or terminate accounts for Terms violations.',
      ],
    },
    {
      title: 'Credits System',
      content: [
        'Credits are virtual currency with NO real-world monetary value.',
        'Credits cannot be purchased with real money, exchanged, or redeemed for cash.',
        'Credits may be earned through tournament prizes, promotional bonuses, or refunds.',
        'Credit transactions are final; remaining credits are forfeited upon account termination.',
      ],
    },
    {
      title: 'Prohibited Activities',
      content: [
        'Submit false or manipulated match results.',
        'Collude with other players to manipulate standings.',
        'Create multiple accounts to gain unfair advantages.',
        'Harass, bully, or threaten other users.',
        'Attempt to gain unauthorized access to the Service.',
        'Reverse engineer, decompile, or disassemble the App.',
      ],
    },
    {
      title: 'Tournament Rules',
      content: [
        'All participants must adhere to fair play standards.',
        'Tournament organizers have authority over all in-event decisions.',
        'Match results reported in the App are considered official.',
        'Intentional misreporting is grounds for immediate disqualification.',
        'Rating manipulation through collusion or intentional losses is prohibited.',
      ],
    },
    {
      title: 'Intellectual Property',
      content: [
        'The Service and its content are owned by Genki TCG and protected by intellectual property laws.',
        'TCG names and logos (One Piece TCG, Azuki TCG, Riftbound) are trademarks of their respective owners.',
        'You retain ownership of content you submit (display name, avatar, decklists).',
      ],
    },
    {
      title: 'Disclaimers',
      content: [
        'The Service is provided "AS IS" without warranties of any kind.',
        'We do not guarantee uninterrupted, error-free, or secure operation.',
        'We are not liable for indirect, incidental, special, consequential, or punitive damages.',
        'Maximum liability shall not exceed $100 or amounts paid to us in the past 12 months, whichever is greater.',
      ],
    },
    {
      title: 'Dispute Resolution',
      content: [
        'Before filing legal action, contact legal@genkitcg.com to attempt informal resolution.',
        'These Terms are governed by the laws of the State of California, United States.',
        'Disputes shall be resolved through binding arbitration (except where prohibited by law).',
        'You agree to resolve disputes individually and waive class action participation.',
      ],
    },
    {
      title: 'Apple App Store Terms',
      content: [
        'These Terms are between you and Genki TCG only, not with Apple Inc.',
        'Apple has no obligation to provide maintenance, support, or warranty services.',
        'Apple is not responsible for addressing claims related to the App.',
        'Apple and its subsidiaries are third-party beneficiaries of these Terms.',
      ],
    },
    {
      title: 'Contact',
      content: [
        'General: support@genkitcg.com',
        'Legal: legal@genkitcg.com',
        'Privacy: privacy@genkitcg.com',
        'Website: https://genkitcg.com',
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
                  TERMS OF SERVICE
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
                    <ul className="space-y-2">
                      {section.content.map((item, iIndex) => (
                        <li
                          key={iIndex}
                          className="text-sm text-white/50 leading-relaxed flex items-start gap-2"
                        >
                          <span className="text-red-500/40 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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
                  href="/privacy"
                  className="text-xs tracking-[0.15em] text-white/30 hover:text-red-400 uppercase transition-colors duration-300"
                >
                  Privacy Policy →
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
