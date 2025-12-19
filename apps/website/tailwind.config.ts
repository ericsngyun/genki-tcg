import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Genki Brand Colors
        genki: {
          red: '#DC2626',
          'red-light': '#EF4444',
          'red-lighter': '#F87171',
          'red-lightest': '#FEE2E2',
          'red-dark': '#B91C1C',
          'red-darker': '#991B1B',
        },
        // Dark theme backgrounds - pure black
        background: {
          DEFAULT: '#000000',
          secondary: '#050505',
          tertiary: '#0A0A0A',
          card: '#0A0A0A',
          elevated: '#141414',
        },
        // Text colors
        text: {
          DEFAULT: '#FAFAFA',
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
          muted: '#52525B',
        },
        // Border colors - darker
        border: {
          light: '#1A1A1A',
          DEFAULT: '#27272A',
          dark: '#3F3F46',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'radial-gradient(ellipse at center, rgba(185, 28, 28, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(185, 28, 28, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(185, 28, 28, 0.6)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(185, 28, 28, 0.4), 0 0 40px rgba(185, 28, 28, 0.25)',
        'glow-lg': '0 0 30px rgba(185, 28, 28, 0.5), 0 0 60px rgba(185, 28, 28, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
