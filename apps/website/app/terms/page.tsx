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
        'These Terms of Service govern your access to and use of the Genki TCG mobile application and related services.',
        'By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not access or use the Service.',
        'We reserve the right to modify these Terms at any time. Continued use constitutes acceptance of revised Terms.',
      ],
    },
    {
      title: 'Eligibility',
      content: [
        'You must be at least 13 years old to use the Service.',
        'You must have legal capacity to enter into binding contracts.',
        'You must provide accurate and complete registration information.',
        'Users under 18 should have permission from a parent or guardian.',
      ],
    },
    {
      title: 'Account Security',
      content: [
        'You agree to maintain the security of your account credentials.',
        'Promptly notify us of any unauthorized access.',
        'You are responsible for all activities under your account.',
        'We may suspend or terminate accounts that violate these Terms.',
      ],
    },
    {
      title: 'Prohibited Activities',
      content: [
        'Use the Service for any illegal or unauthorized purpose.',
        'Harass, threaten, or abuse other users.',
        'Submit false tournament results or manipulate rankings.',
        'Use automated tools, bots, or scripts.',
        'Attempt to gain unauthorized access to accounts.',
        'Engage in any form of cheating or fraud.',
      ],
    },
    {
      title: 'Tournament Rules',
      content: [
        'Follow all tournament rules and guidelines.',
        'Report match results accurately and honestly.',
        'Respect tournament organizers and their decisions.',
        'Communicate respectfully with opponents.',
        'Penalties for violations may include warnings, suspensions, or bans.',
      ],
    },
    {
      title: 'Intellectual Property',
      content: [
        'The Service and its content are protected by intellectual property laws.',
        'You retain ownership of content you submit (profiles, deck lists, etc.).',
        'Trading card game names and logos belong to their respective owners.',
        'Genki TCG is not affiliated with any trading card game publishers.',
      ],
    },
    {
      title: 'Disclaimers',
      content: [
        'The Service is provided "AS IS" without warranties of any kind.',
        'We do not guarantee uninterrupted or error-free service.',
        'We are not liable for indirect, incidental, or consequential damages.',
        'We are not responsible for actions or conduct of other users.',
      ],
    },
    {
      title: 'Dispute Resolution',
      content: [
        'These Terms are governed by applicable laws of your jurisdiction.',
        'Disputes shall be resolved through good faith negotiations.',
        'If negotiations fail, binding arbitration applies.',
        'You waive the right to jury trial or class action participation.',
      ],
    },
    {
      title: 'Contact',
      content: [
        'Legal: legal@genkitcg.app',
        'Support: support@genkitcg.app',
        'Website: https://genkitcg.app/support',
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
