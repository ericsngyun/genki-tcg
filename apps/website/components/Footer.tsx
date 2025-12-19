'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 2 }}
      className="fixed bottom-0 left-0 right-0 z-40 p-6 md:p-8 pointer-events-none"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-end">
        {/* Left: Legal */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <Link
            href="/privacy"
            className="text-[10px] tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors duration-500 uppercase"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[10px] tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors duration-500 uppercase"
          >
            Terms
          </Link>
        </div>

        {/* Right: Copyright */}
        <div className="text-right">
          <p className="text-[10px] tracking-[0.2em] text-white/15 uppercase">
            © {currentYear}
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
