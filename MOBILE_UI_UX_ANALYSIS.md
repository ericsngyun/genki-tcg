# Genki TCG Mobile App - UI/UX Analysis Report

## Executive Summary

The Genki TCG mobile app is built using React Native with Expo. The foundation is solid, but significant improvements are needed in design system formalization, component reusability, and accessibility features.

## Key Findings

### 1. Project Structure
- 7 screens using Expo Router (file-based routing)
- 2,383 total lines of code
- All styling uses React Native StyleSheet.create()
- API client using Axios with AsyncStorage for tokens

### 2. Styling Approach

**Method**: React Native StyleSheet (100% usage)
- Every screen has embedded styles
- NO centralized theme or design tokens
- All colors hardcoded as hex values

**Critical Issue**: React Native Paper is INSTALLED but COMPLETELY UNUSED
- Zero imports across all files
- Represents missed opportunity for Material Design consistency
- Should either be integrated or removed

### 3. Color Palette (Complete List)

All hardcoded hex values with NO centralization:
- Primary: #4F46E5 (Indigo - appears 20+ times!)
- Success: #10B981, #D1FAE5
- Error: #EF4444, #FEE2E2, #991B1B
- Warning: #F59E0B, #FEF3C7
- Info: #1E40AF, #DBEAFE
- Grays: #1F2937, #374151, #6B7280, #9CA3AF, #D1D5DB, #E5E7EB, #F3F4F6, #F5F5F5, #F9FAFB
- Custom: #E0E7FF, #EEF2FF, #4338CA

### 4. Typography

NO centralized type scale:
- Font sizes: 10-11px (labels), 12-14px (body), 16px (regular), 18px (card titles), 24-28px (headings), 32px (large), 48px (balance)
- Weights: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)

### 5. Screens & Features

1. **index.tsx** (41 lines) - Auth splash, checks token
2. **login.tsx** (232 lines) - Email/password login, signup link
3. **signup.tsx** (251 lines) - Account creation with invite code
4. **events.tsx** (473 lines) - Tournament list, register, check-in, payment tracking
5. **pairings.tsx** (522 lines) - Match pairings by round, personal match highlight
6. **standings.tsx** (458 lines) - Leaderboard with medals, personal stats, tiebreakers
7. **wallet.tsx** (208 lines) - Balance display, transaction history

### 6. Component Architecture

**Status**: NO REUSABLE COMPONENT LIBRARY

MASSIVE DUPLICATION:
- Card containers: 50+ identical definitions
- Status badges: 15+ similar styles, different names (statusBadge, checkedInBadge, paidBadge, etc.)
- Input fields: 10+ repeated definitions
- Buttons: 15+ primary button definitions
- Headers: 5+ identical header sections

Example: #4F46E5 appears in login.tsx, signup.tsx, events.tsx, pairings.tsx, standings.tsx, wallet.tsx

### 7. Accessibility (a11y) Assessment

CRITICAL GAPS:
- No accessibility labels (accessibilityLabel missing everywhere)
- No semantic roles (no accessibilityRole props)
- Emoji used as content (🎮, 👥, 🥇 not accessible)
- No focus indicators for keyboard users
- Error messages not announced to screen readers
- Complex tables lack semantic structure

### 8. Navigation

Framework: Expo Router (file-based routing)
- Standard Stack navigation
- No custom animations
- Auth check → login vs events split
- Dialog confirmations (logout)

### 9. Design Issues

CRITICAL:
- No centralized theme → dark mode impossible
- Hardcoded colors → global changes require code changes everywhere
- No typography scale → inconsistent text hierarchy
- React Native Paper unused → missed Material Design benefits

HIGH:
- Button/card/badge duplication
- No spacing tokens
- No component library
- No performance optimizations (lists using ScrollView + map)

MEDIUM:
- No dark mode support
- No custom fonts
- No animated transitions
- Portal-only (landscape disabled)
- No list optimization

### 10. Performance

POSITIVE:
- Hooks properly used
- Data loaded on mount
- Pull-to-refresh implemented
- Proper cleanup

ISSUES:
- No FlatList (using ScrollView + map)
- No pagination
- No data caching
- Fresh API calls each visit

## Recommendations by Priority

### IMMEDIATE (HIGH)
1. Create theme.ts with centralized colors, spacing, typography
2. Extract reusable components (Button, Card, Badge, Input, Header)
3. Add accessibilityLabel to all interactive elements
4. Decide on React Native Paper (use or remove)
5. Define design tokens

### SHORT TERM (MEDIUM)
6. Add accessibility roles (accessibilityRole)
7. Implement dark mode
8. Create icon system (replace emoji)
9. Optimize list rendering (FlatList)
10. Add error boundaries

### FUTURE (LOW)
11. Enable tablet/landscape support
12. Add screen animations
13. Implement data caching
14. Add search/filter to lists
15. Create loading skeletons

## Effort Estimates

- High priority: 2-3 weeks
- Medium priority: 1-2 weeks
- Low priority: 1-2 weeks
- Total: 4-7 weeks

## Conclusion

STRENGTHS: Clean Expo Router setup, consistent StyleSheet approach, good color palette, proper hooks

WEAKNESSES: No design system, massive duplication, missing a11y, no theme support, unused libraries

The app needs design system formalization and component extraction for maintainability. Accessibility should be prioritized before public release.
