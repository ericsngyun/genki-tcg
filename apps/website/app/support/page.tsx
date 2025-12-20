'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaDiscord, FaArrowLeft, FaChevronDown } from 'react-icons/fa';
import { HiOutlineBugAnt } from 'react-icons/hi2';

export default function Support() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsLoaded(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Download the Genki TCG app from the App Store or Google Play. You can sign up using your email address or link your Discord account for quick registration.',
    },
    {
      question: 'How do I join a tournament?',
      answer: 'Browse available tournaments in the app, select the tournament you want to join, and click "Register". Make sure to check in before the tournament starts.',
    },
    {
      question: 'How are rankings calculated?',
      answer: 'Rankings are based on a competitive rating system that takes into account your tournament performance, match results, and opponent strength.',
    },
    {
      question: 'Can I organize my own tournament?',
      answer: 'Yes! Contact us at organizers@genkitcg.app to get organizer access to the Admin Portal.',
    },
    {
      question: 'How do I report match results?',
      answer: 'After each match, both players can submit the result through the app. Once both players confirm, the result is recorded.',
    },
    {
      question: 'What games are supported?',
      answer: 'Currently, Genki TCG supports One Piece TCG, Azuki TCG, and Riftbound. We\'re continuously adding support for more trading card games.',
    },
  ];

  const contactMethods = [
    {
      icon: FaEnvelope,
      title: 'Email',
      description: 'General support',
      contact: 'support@genkitcg.app',
      action: 'mailto:support@genkitcg.app',
    },
    {
      icon: FaDiscord,
      title: 'Discord',
      description: 'Community server',
      contact: 'Join Server',
      action: 'https://discord.gg/6bAh6ArXhw',
    },
    {
      icon: HiOutlineBugAnt,
      title: 'Bug Reports',
      description: 'Technical issues',
      contact: 'bugs@genkitcg.app',
      action: 'mailto:bugs@genkitcg.app',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-zinc-800/20 blur-[120px] pointer-events-none" />

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
        <div className="max-w-4xl mx-auto">
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
                  Help Center
                </motion.span>

                <h1
                  className="text-[10vw] sm:text-[8vw] md:text-[6vw] lg:text-[4vw] font-black tracking-[-0.02em] leading-[0.9]"
                  style={{ color: '#DC143C' }}
                >
                  SUPPORT
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-4 text-sm text-white/40 tracking-wide max-w-md mx-auto"
                >
                  Find answers or get in touch
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contact Methods */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16"
              >
                {contactMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <motion.a
                      key={method.title}
                      href={method.action}
                      target={method.action.startsWith('http') ? '_blank' : undefined}
                      rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      className="group relative p-6 border border-white/10 hover:border-red-500/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500"
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <Icon className="w-6 h-6 text-red-500/60 group-hover:text-red-400 transition-colors duration-300" />
                        <div>
                          <div className="text-sm font-medium text-white/90">{method.title}</div>
                          <div className="text-xs text-white/30 mt-1">{method.description}</div>
                        </div>
                        <div className="text-xs text-red-500/60 group-hover:text-red-400 transition-colors duration-300">
                          {method.contact}
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQ Section */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <h2 className="text-xs tracking-[0.3em] text-red-500/50 uppercase mb-8 text-center">
                  Frequently Asked Questions
                </h2>

                <div className="space-y-2">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
                      className="border border-white/5 bg-white/[0.01] overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors duration-300"
                      >
                        <span className="text-left text-sm text-white/80">
                          {faq.question}
                        </span>
                        <FaChevronDown
                          className={`w-3 h-3 text-red-500/40 flex-shrink-0 ml-4 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      <AnimatePresence>
                        {openFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4">
                              <p className="text-sm text-white/40 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom CTA */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6"
              >
                <div className="text-center sm:text-left">
                  <div className="text-sm text-white/60">Still need help?</div>
                  <div className="text-xs text-white/30 mt-1">Our team usually responds within 24 hours</div>
                </div>

                <div className="flex gap-4">
                  <a
                    href="mailto:support@genkitcg.app"
                    className="px-6 py-2 border border-red-500/30 text-red-500/80 hover:bg-red-500/10 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                  >
                    Contact Us
                  </a>
                  <Link
                    href="/download"
                    className="px-6 py-2 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                  >
                    Get App
                  </Link>
                </div>
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
