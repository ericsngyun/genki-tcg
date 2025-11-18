# Genki TCG Mobile App - Feature Strategy & Priorities

## Design Philosophy

**Goals:**
- Clean, modern, aesthetic UI that players love to use
- Seamless tournament participation (register → check-in → play → results)
- Fast, intuitive navigation
- Shop integration for exclusive features
- Professional branding consistent with admin web

## Priority Levels

### 🔴 **CRITICAL (Phase 1)** - Core Tournament Experience
Must have for basic tournament functionality to work smoothly.

### 🟡 **HIGH (Phase 2)** - Enhanced UX
Significantly improves user experience and engagement.

### 🟢 **MEDIUM (Phase 3)** - Nice to Have
Adds value but not essential for launch.

### ⚪ **LOW (Phase 4)** - Future Enhancements
Can be added after initial success.

---

## 🔴 PHASE 1: CRITICAL FEATURES (Implement First)

### 1. UI/Branding Overhaul
**Priority: CRITICAL**
**Timeline: 1-2 days**

Current issues:
- No branding/logo
- Inconsistent color scheme (purple primary is good, but needs dark theme)
- Basic styling, not modern enough

**Improvements:**
- [ ] Add Genki logo to all screens (header/navigation)
- [ ] Implement dark theme matching admin web (black/zinc-900 background)
- [ ] Consistent red accent color (#DC2626) matching brand
- [ ] Modern card designs with subtle shadows and gradients
- [ ] Smooth animations (fade-ins, slide-ups)
- [ ] Professional typography (larger headings, better hierarchy)

**Impact:** First impressions matter - makes app feel professional

---

### 2. Enhanced Event Experience
**Priority: CRITICAL**
**Timeline: 2-3 days**

Current state: Basic event list with registration
Needs: More information, better flow

**Features to add:**
- [ ] **Event Details Page**
  - Full event description
  - Prize support info
  - Store location with map integration
  - Entry fee breakdown
  - Registration deadline
  - "Add to Calendar" button

- [ ] **QR Code Check-In**
  - Generate unique QR code for each player registration
  - Store owner scans to check player in
  - Faster than manual check-in
  - Shows on screen when registered

- [ ] **Better Registration Flow**
  - Confirmation screen before registering
  - Show what you're signing up for
  - Entry fee payment integration (if applicable)
  - Success animation after registration

**Impact:** Core tournament flow - must be seamless

---

### 3. Match Result Reporting
**Priority: CRITICAL**
**Timeline: 2-3 days**

Current state: View pairings only, no reporting
Needs: Players must be able to report match results

**Features:**
- [ ] **Match Reporting Interface**
  - Show current round and opponent
  - Simple win/loss/draw buttons
  - Game-by-game result entry (best of 3)
  - Confirmation before submitting
  - Both players must confirm result

- [ ] **Active Match Card**
  - Prominent "Your Current Match" card on events screen
  - Shows opponent name, table number
  - Timer showing round time remaining
  - Quick "Report Result" button

- [ ] **Match History**
  - See all your matches from current event
  - Win/loss record
  - Opponents played against

**Impact:** ESSENTIAL - tournaments can't run without result reporting

---

### 4. Push Notifications
**Priority: CRITICAL**
**Timeline: 1-2 days**

Current state: No notifications
Needs: Players miss pairings announcements

**Notifications needed:**
- [ ] "Round X pairings posted" - directs to pairings screen
- [ ] "10 minutes until round starts" - reminder
- [ ] "Event starting soon" - 30 min before event
- [ ] "Registration confirmed" - after signing up
- [ ] "Check-in reminder" - 1 hour before event
- [ ] "Results needed" - if you haven't reported yet

**Implementation:**
- Use Expo Push Notifications (already installed)
- Backend sends via Firebase Cloud Messaging
- In-app notification center to view history

**Impact:** Critical for tournament flow - players need timely updates

---

### 5. Improved Navigation
**Priority: CRITICAL**
**Timeline: 1 day**

Current state: Stack navigation only, confusing
Needs: Clear tab navigation for main sections

**New Structure:**
```
Bottom Tab Navigation:
├── Events (home icon) - main screen
├── Wallet (wallet icon) - credits/transactions
├── Profile (user icon) - player profile, settings
└── More (menu icon) - match history, notifications, settings
```

**Impact:** Much easier to navigate, industry standard

---

## 🟡 PHASE 2: HIGH PRIORITY (Enhance Experience)

### 6. Player Profile
**Priority: HIGH**
**Timeline: 2-3 days**

**Features:**
- [ ] Profile photo upload
- [ ] Player statistics (events played, win rate, etc.)
- [ ] Recent match history
- [ ] Achievements/badges
- [ ] Favorite game/format
- [ ] Edit profile info
- [ ] QR code for player ID (quick lookup)

**Impact:** Personalization, social proof

---

### 7. Credits/Payment Integration
**Priority: HIGH**
**Timeline: 3-4 days**

Current state: View-only wallet
Needs: Actually use credits in app

**Features:**
- [ ] **Purchase Credits**
  - Buy credit bundles (10, 25, 50, 100 credits)
  - Stripe/PayPal integration
  - Apple Pay / Google Pay support
  - Bonus credits for larger purchases

- [ ] **Pay Entry Fees**
  - Pay tournament entry with credits
  - Show credit balance when registering
  - Automatic deduction on registration
  - Receipt/confirmation

- [ ] **Transfer Credits** (Optional)
  - Send credits to other players
  - Enter player ID or scan QR
  - Confirmation step
  - Transaction history

**Shop Exclusive Features:**
- [ ] **In-Store Credit Top-Up**
  - QR code shown to cashier
  - Instant credit addition
  - Receipt integration

- [ ] **Shop Loyalty Rewards**
  - Earn credits for purchases at shop
  - Special promotions visible in app
  - Member-only tournament discounts

**Impact:** Monetization + convenience for players

---

### 8. Store Locator & Info
**Priority: HIGH**
**Timeline: 2 days**

**Features:**
- [ ] Store details page
  - Address, phone, hours
  - Map with directions
  - Upcoming events at this store
  - Store photos

- [ ] "Get Directions" button (opens Maps)
- [ ] Store contact (call/email buttons)
- [ ] Store inventory preview (if integrated with shop POS)

**Shop Exclusive:**
- [ ] **In-Store Mode**
  - Special UI when detected at shop (geofencing)
  - Quick access to shop-only features
  - Current in-store events
  - Browse shop inventory

**Impact:** Drives foot traffic to shop

---

### 9. Deck Management
**Priority: HIGH**
**Timeline: 3-4 days**

**Features:**
- [ ] Save multiple decks
- [ ] Deck name, format, game
- [ ] Card list entry (manual or scan)
- [ ] Deck validation (legal for format)
- [ ] Export deck list (text, image)
- [ ] Deck stats (cost curve, type distribution)
- [ ] Share deck with friends

**Future Enhancement:**
- Card database integration
- Deck builder with autocomplete
- Meta deck suggestions

**Impact:** Players want to track their decks

---

### 10. Enhanced Standings
**Priority: HIGH**
**Timeline: 1-2 days**

Current state: Basic standings list
Needs: More context and info

**Improvements:**
- [ ] Highlight your position (colored row)
- [ ] Show tie-breakers clearly
- [ ] Match win percentage, game win percentage
- [ ] Opponent match win percentage
- [ ] Top 8 cutoff line visual indicator
- [ ] Prize breakdown overlay
- [ ] Share standings screenshot

**Impact:** Players constantly check standings - make it beautiful

---

## 🟢 PHASE 3: MEDIUM PRIORITY (Nice to Have)

### 11. Social Features
**Priority: MEDIUM**
**Timeline: 5-7 days**

**Features:**
- [ ] Friends list
- [ ] Follow other players
- [ ] View friend profiles and stats
- [ ] Recent activity feed
- [ ] Friend match history
- [ ] Challenge friends to casual matches
- [ ] Event invitations

**Impact:** Community building, retention

---

### 12. Event Feed & Updates
**Priority: MEDIUM**
**Timeline: 2-3 days**

**Features:**
- [ ] Store announcements
- [ ] Event updates (format changes, prize updates)
- [ ] General TCG news feed
- [ ] Shop promotions
- [ ] New product releases
- [ ] Tournament results highlights

**Impact:** Engagement, shop marketing

---

### 13. Photo Sharing
**Priority: MEDIUM**
**Timeline: 2-3 days**

**Features:**
- [ ] Upload event photos
- [ ] Tag other players
- [ ] Event photo gallery
- [ ] Share match moments
- [ ] Shop display case photos
- [ ] Prize photos

**Impact:** Social proof, marketing

---

### 14. Offline Mode
**Priority: MEDIUM**
**Timeline: 3-4 days**

**Features:**
- [ ] Cache event data
- [ ] View standings offline
- [ ] View match history offline
- [ ] Queue actions when offline (report results)
- [ ] Sync when back online

**Impact:** Reliability at events with poor Wi-Fi

---

## ⚪ PHASE 4: LOW PRIORITY (Future)

### 15. Advanced Analytics
- Player performance trends
- Game-specific statistics
- Format win rates
- Matchup tracking

### 16. Coaching/Mentoring
- Find coaches
- Training sessions
- Strategy articles
- Video tutorials

### 17. Trading/Marketplace
- Trade cards with other players
- Want lists
- Have lists
- In-app messaging for trades

### 18. Custom Tournaments
- Create private tournaments
- Invite-only events
- Home tournaments
- Casual league tracking

---

## Shop-Exclusive Features Summary

These features only work when integrated with your physical shop:

1. **In-Store Credit Top-Up** - QR code for instant credit addition at register
2. **Shop Loyalty Rewards** - Earn credits for shop purchases
3. **In-Store Mode** - Special UI when at shop (geofencing)
4. **Shop Inventory Preview** - See what's in stock before visiting
5. **Member Discounts** - App users get special tournament pricing
6. **Early Registration** - App users register before non-app users
7. **Shop Events Calendar** - Beyond tournaments (game nights, releases)
8. **Pre-Order System** - Reserve new products via app
9. **Shop Credit Account** - Store credit separate from tournament credits
10. **Membership Tiers** - Bronze/Silver/Gold based on spending/attendance

---

## Implementation Roadmap

### Week 1-2: UI/Branding + Navigation
- Dark theme implementation
- Logo integration
- Tab navigation
- Design system setup

### Week 3-4: Core Tournament Flow
- Event details page
- QR code check-in
- Match result reporting
- Push notifications

### Week 5-6: Credits & Payments
- Stripe integration
- Credit purchases
- Entry fee payments
- Shop integration basics

### Week 7-8: Enhanced Features
- Player profiles
- Deck management
- Enhanced standings
- Store locator

### Week 9+: Phase 3 & 4
- Social features
- Event feed
- Analytics
- Additional shop features

---

## Technical Requirements

### Backend Additions Needed
- [ ] Match result submission endpoint
- [ ] Player profile endpoints
- [ ] Credit purchase/transaction endpoints
- [ ] Push notification service
- [ ] QR code generation
- [ ] File upload for photos
- [ ] Friends/social relationships
- [ ] Event feed content management

### External Services
- [ ] Stripe for payments
- [ ] Firebase Cloud Messaging for notifications
- [ ] Google Maps SDK for store locator
- [ ] AWS S3 for image uploads
- [ ] (Optional) Algolia for player/card search

### Mobile Dependencies to Add
- [ ] expo-notifications (already installed ✓)
- [ ] @stripe/stripe-react-native
- [ ] react-native-maps
- [ ] expo-image-picker
- [ ] expo-qr-code
- [ ] expo-camera (for QR scanning)
- [ ] react-native-calendars
- [ ] @react-navigation/bottom-tabs

---

## Success Metrics

### User Engagement
- Daily active users
- Events registered per user
- Time in app per session
- Notification open rate

### Tournament Flow
- Self-check-in rate (vs manual)
- Match reporting speed
- Average time to report result
- Player satisfaction score

### Revenue
- Credit purchases per user
- Average credit purchase amount
- Shop visit frequency
- Entry fee payment rate

### Retention
- Week 1, Week 4, Month 3 retention
- Events attended per month
- Friend invitations sent

---

## Design Mockup Priorities

Before coding, create mockups for:
1. ✅ New home screen (events list with branding)
2. ✅ Event details page
3. ✅ Match reporting interface
4. ✅ Bottom tab navigation
5. ✅ Player profile
6. ✅ Credit purchase flow

---

## Next Steps

1. **Approve Phase 1 scope** - confirm these are the right priorities
2. **Start with UI/Branding** - foundation for everything else
3. **Build Phase 1 incrementally** - test each feature
4. **Beta test with real tournament** - get player feedback
5. **Iterate based on feedback** - refine before Phase 2
6. **Plan shop integration** - technical requirements for POS connection

---

**Estimated Timeline:**
- Phase 1 (Critical): 2-3 weeks
- Phase 2 (High): 4-6 weeks
- Phase 3 (Medium): 6-8 weeks
- Phase 4 (Low): Ongoing

**Recommended Start:** Phase 1, Feature #1 (UI/Branding Overhaul)
