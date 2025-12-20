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
        'This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.',
        'We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.',
      ],
    },
    {
      title: 'Definitions',
      content: [
        '<strong>Account</strong> means a unique account created for You to access our Service.',
        '<strong>Application</strong> refers to GENKI, the software program provided by the Company.',
        '<strong>Company</strong> refers to Genkivape Corp., 5528 Del Amo Blvd Lakewood, CA 90713.',
        '<strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.',
        '<strong>Service</strong> refers to the Application.',
        '<strong>Usage Data</strong> refers to data collected automatically from the Service infrastructure.',
      ],
    },
    {
      title: 'Data We Collect',
      content: [
        'We may collect personally identifiable information including: Email address, First name and last name, Usage Data.',
        'Usage Data may include your Device\'s IP address, browser type, pages visited, time and date of visits, time spent on pages, and unique device identifiers.',
        'When accessing via mobile device, we may collect device type, unique ID, IP address, mobile operating system, and browser type.',
      ],
    },
    {
      title: 'How We Use Your Data',
      content: [
        'To provide and maintain our Service, including monitoring usage.',
        'To manage Your Account and registration as a user.',
        'To contact You via email, push notifications, or other communications.',
        'For business transfers, data analysis, and improving our Service.',
        'We may share your data with Service Providers, Affiliates, and business partners.',
      ],
    },
    {
      title: 'Data Retention',
      content: [
        'We retain Personal Data only as long as necessary for the purposes in this Policy.',
        'Usage Data is generally retained for shorter periods except for security or legal requirements.',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        'You have the right to delete or request deletion of your Personal Data.',
        'You may update, amend, or delete your information via your Account settings.',
        'Contact Us to request access to, correct, or delete personal information.',
      ],
    },
    {
      title: 'Security',
      content: [
        'The security of Your Personal Data is important to Us, but no method of transmission or storage is 100% secure.',
        'We strive to use commercially reasonable means to protect Your data.',
      ],
    },
    {
      title: 'Children\'s Privacy',
      content: [
        'Our Service does not address anyone under the age of 13.',
        'We do not knowingly collect personally identifiable information from anyone under 13.',
        'If You are a parent aware that Your child has provided Us with Personal Data, please contact Us.',
      ],
    },
    {
      title: 'Changes',
      content: [
        'We may update this Privacy Policy from time to time.',
        'We will notify You of changes by posting the new Policy and updating the "Last updated" date.',
      ],
    },
    {
      title: 'Contact',
      content: [
        'Email: privacy@genkitcg.app',
        'Support: https://genkitcg.app/support',
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
