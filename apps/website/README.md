# Genki TCG Website

Official website for Genki TCG - Tournament management platform for competitive trading card games.

## Overview

This is a Next.js static website that serves as the main landing page and information hub for Genki TCG. It includes:

- Marketing landing page with features and screenshots
- App download page with store badges
- Comprehensive privacy policy (App Store compliant)
- Terms of service
- Support center with FAQs
- Mobile-responsive design with dark theme

## Tech Stack

- **Framework:** Next.js 14.2.15 (Static Export)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4.1
- **Icons:** React Icons
- **Deployment:** Vercel
- **Domain:** genkitcg.app

## Project Structure

```
apps/website/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout with Header/Footer
│   ├── globals.css        # Global styles and animations
│   ├── download/          # Download page
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   └── support/           # Support center
├── components/            # Reusable components
│   ├── Header.tsx        # Navigation header
│   └── Footer.tsx        # Site footer
├── public/               # Static assets
│   ├── genki-head.png    # Logo (character)
│   └── genki-logo.png    # Full logo
├── next.config.mjs       # Next.js configuration
├── tailwind.config.ts    # Tailwind theme (Genki Red colors)
└── vercel.json           # Vercel deployment config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Navigate to website directory
cd apps/website

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Build

```bash
# Create production build
npm run build

# Preview production build locally
npx serve out
```

## Branding

### Colors

The website uses the Genki TCG brand colors:

- **Primary Red:** `#DC2626` (genki-red)
- **Light Red:** `#EF4444` (genki-red-light)
- **Dark Red:** `#B91C1C` (genki-red-dark)
- **Background:** `#000000` (black)
- **Card Background:** `#18181B` (zinc-900)

### Typography

- **Font:** Inter (Google Fonts)
- **Headings:** Bold, gradient from genki-red to genki-red-light
- **Body:** Regular, text-text-secondary

### Logo Assets

- **genki-head.png:** Character logo (200x200px) - used on landing page
- **genki-logo.png:** Full logo - used in header

## Key Pages

### Landing Page (`/`)

- Hero section with animated logo
- Feature grid (6 key features)
- About section
- Call-to-action section
- Supported games badges

### Download Page (`/download`)

- App store badges (iOS & Android)
- System requirements
- Feature highlights
- Getting started guide

### Privacy Policy (`/privacy`)

- Official privacy policy from privacypolicies.com
- Includes company info: Genkivape Corp.
- App Store compliant
- Covers data collection, usage, retention

### Terms of Service (`/terms`)

- User agreement and eligibility
- Account responsibilities
- Tournament participation rules
- Intellectual property
- Disclaimers and limitations

### Support Center (`/support`)

- 12 FAQs covering common questions
- Contact methods (email, Discord, bugs)
- Quick links for players and organizers
- Collapsible FAQ interface

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

### Domain Setup

- **Main Site:** https://genkitcg.app
- **Admin Portal:** https://admin.genkitcg.app (separate deployment)

## Development Guidelines

### Adding New Pages

1. Create a new directory in `app/` (e.g., `app/about/`)
2. Add `page.tsx` with component
3. Add metadata export for SEO
4. Update Header navigation if needed

### Styling

- Use Tailwind utility classes
- Follow existing glass morphism patterns (`.glass`)
- Use theme colors from `tailwind.config.ts`
- Mobile-first responsive design

### Images

- Place in `public/` directory
- Use Next.js `<Image>` component for optimization
- Provide width/height attributes
- Use descriptive alt text

## Environment Variables

This is a static site with no environment variables required.

For the admin portal or API integration, create `.env.local`:

```env
# Not needed for current static deployment
```

## Performance

Target Lighthouse scores:
- **Performance:** 95+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 95+

Optimizations:
- Static export (no server required)
- Image optimization via Next.js
- Minimal JavaScript
- CSS purging via Tailwind

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari (iOS 13+)
- Chrome Mobile (Android 6+)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run build`
4. Submit pull request
5. Vercel will create preview deployment

## License

Proprietary - © 2024 Genkivape Corp.

## Contact

- **Support:** support@genkitcg.app
- **Legal:** legal@genkitcg.app
- **Organizers:** organizers@genkitcg.app
- **Website:** https://genkitcg.app
