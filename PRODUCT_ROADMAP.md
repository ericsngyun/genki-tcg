# Genki TCG - Complete Product Roadmap

## Current Status: Beta (Not Production-Ready)

**Completion**: ~70% of core features
**Security Status**: 3/12 critical vulnerabilities fixed
**Testing**: 0% (no tests written yet)

---

## ✅ COMPLETED FEATURES

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (OWNER, STAFF, PLAYER)
- ✅ Login/signup for both admin and mobile
- ✅ Invite code system for org membership
- ✅ Password hashing with bcrypt
- ✅ Logout functionality

### Event Management
- ✅ Create/edit events (admin)
- ✅ Support for multiple games (OPTCG, Azuki TCG, Riftbound)
- ✅ Multiple formats (Constructed, Draft, Sealed, etc.)
- ✅ Max player limits
- ✅ Entry fees
- ✅ Prize pool tracking
- ✅ Event status management (DRAFT → SCHEDULED → IN_PROGRESS → COMPLETED)

### Registration & Check-in
- ✅ Player registration via mobile
- ✅ Self check-in for players
- ✅ Staff check-in (admin)
- ✅ Payment tracking (mark as paid)
- ✅ Payment validation before check-in
- ✅ Late player addition
- ✅ Drop player functionality with round tracking

### Tournament Operations
- ✅ Swiss pairing algorithm
- ✅ Round generation
- ✅ Match result reporting (admin)
- ✅ Match result override with audit trail
- ✅ Bye handling
- ✅ Rematch avoidance

### Standings
- ✅ Real-time standings calculation
- ✅ Tiebreaker calculations (OMW%, GW%, OGW%, OOMW%)
- ✅ Dropped player handling
- ✅ CSV export for standings

### Prize Distribution
- ✅ Prize credit distribution by placement
- ✅ One-time distribution enforcement
- ✅ Audit trail for distributions

### Credits System
- ✅ Credit ledger (double-entry accounting)
- ✅ Credit balance tracking
- ✅ Transaction history
- ✅ Manual credit adjustment (admin)
- ✅ Credit redemption
- ✅ Prize credit distribution

### Decklist Management
- ✅ Decklist submission (URL + JSON)
- ✅ Decklist locking
- ✅ Bulk lock all decklists
- ✅ Staff viewing of decklists

### Real-time Features
- ✅ WebSocket infrastructure
- ✅ Live pairing updates
- ✅ Live standings updates
- ✅ Live match result updates

### Mobile App
- ✅ Login/signup
- ✅ Event browsing
- ✅ Event registration
- ✅ Self check-in with payment validation
- ✅ View pairings
- ✅ View standings
- ✅ Credit wallet view
- ✅ Logout

### Admin Web App
- ✅ Login
- ✅ Dashboard
- ✅ Event list with filters
- ✅ Event detail with tabs (Players, Rounds, Standings)
- ✅ Player management (check-in, mark paid, drop)
- ✅ Round creation
- ✅ Match result reporting
- ✅ Match result override
- ✅ Prize distribution UI
- ✅ Late player addition
- ✅ CSV export

---

## 🚧 IN PROGRESS

### Security Fixes (CRITICAL)
- 🔄 Organization validation (1 of 17 endpoints done)
- 🔄 Input validation (DTOs need conversion to classes)
- 🔄 Payment validation
- 🔄 Race condition fixes

---

## ⏳ HIGH PRIORITY - NEXT 2-3 WEEKS

### 1. Complete Security Fixes (20-25 hours)
**Priority**: P0-P1 CRITICAL
- [ ] Organization validation for all 17 endpoints
- [ ] Convert all DTOs to classes with validation
- [ ] Add payment amount validation
- [ ] Add prize distribution validation
- [ ] Fix payment marking race condition
- [ ] Add password strength requirements
- [ ] Configure rate limiting
- [ ] Configure CORS properly
- [ ] Add request size limits

**Deliverables**:
- Application secure for production deployment
- No cross-tenant data access possible
- All input validated
- Rate limiting prevents abuse

---

### 2. Testing Infrastructure (22-30 hours)
**Priority**: P0 CRITICAL
- [ ] Set up Jest for backend
- [ ] Set up Jest for admin web
- [ ] Set up Jest for mobile
- [ ] Write unit tests for authentication
- [ ] Write unit tests for event management
- [ ] Write unit tests for tournament logic
- [ ] Write integration tests for API endpoints
- [ ] Write E2E tests for critical workflows
- [ ] Set up CI/CD pipeline
- [ ] Achieve 80%+ code coverage

**Deliverables**:
- 80%+ test coverage
- Automated testing on every commit
- Confidence in code quality

---

### 3. Mobile Match Result Reporting (6-8 hours)
**Priority**: P1 HIGH
**Why**: Players need to report their own match results

**Tasks**:
- [ ] Design match result reporting UI
- [ ] Add match result submission form
- [ ] Show opponent information
- [ ] Add game win/loss inputs
- [ ] Handle draw and intentional draw
- [ ] Confirmation dialog
- [ ] Success/error feedback
- [ ] Real-time sync with admin view

**User Story**:
> As a player, after finishing my match, I want to report the result (2-1, 2-0, etc.) on my phone so the TO doesn't have to manually enter every result.

**Files to Create/Modify**:
- `apps/mobile/app/report-result.tsx` (new screen)
- `apps/mobile/lib/api.ts` (add reportMatchResult method)
- Update navigation

---

### 4. Real-Time Updates in Mobile (8-10 hours)
**Priority**: P1 HIGH
**Why**: Players need live updates when pairings posted

**Tasks**:
- [ ] Add Socket.IO client to mobile
- [ ] Connect to backend WebSocket
- [ ] Listen for pairing updates
- [ ] Listen for standings updates
- [ ] Listen for match result updates
- [ ] Show notifications for new pairings
- [ ] Auto-refresh data on events
- [ ] Handle connection loss/reconnect

**User Story**:
> As a player, when the next round starts, I want my phone to automatically show my new pairing without refreshing.

**Files to Modify**:
- `apps/mobile/lib/socket.ts` (new file)
- `apps/mobile/app/events.tsx`
- `apps/mobile/app/pairings.tsx`
- `apps/mobile/app/standings.tsx`

---

### 5. Mobile Decklist Submission (10-12 hours)
**Priority**: P1 HIGH
**Why**: Players need to submit decklists before events

**Tasks**:
- [ ] Design decklist submission UI
- [ ] Add deck name input
- [ ] Add decklist URL input
- [ ] Optional: Add JSON deck builder
- [ ] Show submission status
- [ ] Show lock status
- [ ] Edit before lock
- [ ] View submitted decklist
- [ ] Confirmation dialogs

**User Story**:
> As a player, before an event starts, I want to submit my decklist URL so the TO can verify my deck is legal.

**Files to Create/Modify**:
- `apps/mobile/app/submit-decklist.tsx` (new screen)
- `apps/mobile/lib/api.ts` (add decklist methods)
- Update events screen with decklist button

---

## 📅 MEDIUM PRIORITY - NEXT 1-2 MONTHS

### 6. Timer Management (8-10 hours)
**Priority**: P2 MEDIUM

**Current State**: Timer configured but no control
**Needed**:
- [ ] Start/stop round timer (backend endpoint)
- [ ] Timer display in admin UI
- [ ] Timer countdown
- [ ] Low time warnings
- [ ] Overtime handling
- [ ] Time extensions
- [ ] Pause/resume
- [ ] Mobile timer display

**User Story**:
> As a TO, I want to start a 50-minute timer when the round begins and see it countdown so players know how much time remains.

---

### 7. Player Profile & Statistics (12-15 hours)
**Priority**: P2 MEDIUM

**Features**:
- [ ] Player profile page
- [ ] Tournament history
- [ ] Win/loss record
- [ ] Average placement
- [ ] Lifetime earnings (credits)
- [ ] Recent matches
- [ ] Head-to-head records
- [ ] Favorite decks
- [ ] Achievement badges

**Backend**:
- [ ] `GET /players/:id/profile`
- [ ] `GET /players/:id/history`
- [ ] `GET /players/:id/stats`
- [ ] `GET /players/:id/head-to-head/:opponentId`

**Mobile**:
- [ ] Profile screen
- [ ] Stats dashboard
- [ ] Tournament history list
- [ ] Match history

---

### 8. Push Notifications (10-12 hours)
**Priority**: P2 MEDIUM

**Current State**: Stubbed but not functional
**Needed**:
- [ ] Expo push token registration
- [ ] Send notifications for:
  - [ ] Pairings posted
  - [ ] Match time warnings
  - [ ] Round ending soon
  - [ ] Tournament starting
  - [ ] Prize distribution
- [ ] Notification preferences
- [ ] Notification history

---

### 9. Tournament Analytics Dashboard (15-20 hours)
**Priority**: P2 MEDIUM

**Admin Features**:
- [ ] Event statistics
- [ ] Player attendance trends
- [ ] Revenue tracking
- [ ] Popular games/formats
- [ ] Average tournament size
- [ ] Credit redemption analytics
- [ ] Player retention metrics
- [ ] Graphs and charts

**Backend**:
- [ ] Analytics service
- [ ] Data aggregation queries
- [ ] Caching for performance
- [ ] Export to PDF/Excel

---

### 10. Advanced Event Features (12-15 hours)
**Priority**: P2-P3 MEDIUM-LOW

**Features**:
- [ ] Event templates (copy settings from past events)
- [ ] Recurring events (weekly, monthly)
- [ ] Event series/seasons
- [ ] Team events
- [ ] Multi-day events
- [ ] Side events
- [ ] Event promotions/discounts
- [ ] Early bird registration
- [ ] Registration deadlines
- [ ] Waitlists for full events

---

### 11. Enhanced Decklist Features (10-12 hours)
**Priority**: P2-P3 MEDIUM-LOW

**Features**:
- [ ] Decklist validation rules
- [ ] Format-specific card limits
- [ ] Banned/restricted list checking
- [ ] Deck legality verification
- [ ] Visual deck builder
- [ ] Import from popular deck sites
- [ ] Deck statistics (mana curve, etc.)
- [ ] Proxy card handling
- [ ] Deck photo upload

---

### 12. Match Slip Generation (6-8 hours)
**Priority**: P2 MEDIUM

**Features**:
- [ ] Generate printable match slips
- [ ] QR codes for digital reporting
- [ ] Bulk print for round
- [ ] Player names and table numbers
- [ ] Result checkboxes
- [ ] Signature lines
- [ ] PDF generation

---

### 13. Judge/Staff Management (8-10 hours)
**Priority**: P3 LOW

**Features**:
- [ ] Multiple staff roles (Judge, Scorekeeper, etc.)
- [ ] Staff assignments to events
- [ ] Judge calls/appeals system
- [ ] Staff activity log
- [ ] Permission granularity
- [ ] Staff scheduling

---

### 14. Reporting & Appeals System (10-12 hours)
**Priority**: P3 LOW

**Features**:
- [ ] Player dispute filing
- [ ] Judge appeal workflow
- [ ] Result confirmation (both players)
- [ ] Violation tracking (warnings, game losses, DQ)
- [ ] Slow play warnings
- [ ] Behavioral tracking

---

## 🎨 POLISH & ENHANCEMENTS

### UI/UX Improvements (15-20 hours)
- [ ] Mobile app dark mode
- [ ] Admin dashboard dark mode
- [ ] Loading skeletons
- [ ] Better error messages
- [ ] Toast notifications
- [ ] Confirmation dialogs
- [ ] Keyboard shortcuts (admin)
- [ ] Responsive design improvements
- [ ] Accessibility improvements (WCAG 2.1)
- [ ] Animations and transitions

### Performance Optimizations (10-15 hours)
- [ ] Database query optimization
- [ ] Add Redis caching
- [ ] Pagination for large lists
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle size reduction
- [ ] Code splitting

### Documentation (10-12 hours)
- [ ] User guide for players
- [ ] Admin manual
- [ ] TO best practices
- [ ] API documentation
- [ ] Setup/deployment guide
- [ ] Troubleshooting guide
- [ ] Video tutorials

---

## 🚀 FUTURE ENHANCEMENTS (3-6 months out)

### Advanced Features
- [ ] Draft tournament support
- [ ] Sealed deck tournament support
- [ ] Round robin format
- [ ] Single elimination brackets
- [ ] Double elimination brackets
- [ ] Custom pairing algorithms
- [ ] Multi-stage tournaments
- [ ] Playoffs/top cut

### Integrations
- [ ] Stripe payment processing
- [ ] PayPal integration
- [ ] Discord bot
- [ ] Twitch integration for streaming
- [ ] Social media sharing
- [ ] Email marketing integration

### Multi-Org Features
- [ ] Organization switching
- [ ] Cross-org player profiles
- [ ] Regional rankings
- [ ] National rankings
- [ ] Sanctioned events
- [ ] Qualifier system

### Mobile Enhancements
- [ ] Offline mode
- [ ] Card scanner (camera)
- [ ] Deck management
- [ ] Friend system
- [ ] Chat with opponents
- [ ] Push-to-talk for rulings

---

## 📊 ESTIMATED TIMELINE

### Phase 1: Production-Ready (3-4 weeks)
**Focus**: Security + Testing + Critical Features
- Week 1-2: Complete all security fixes
- Week 2-3: Build testing infrastructure
- Week 3-4: Mobile match reporting, real-time updates

**Deliverable**: Secure, tested platform ready for beta users

### Phase 2: Feature Complete (2-3 months)
**Focus**: Complete player & admin experience
- Mobile decklist submission
- Timer management
- Player profiles & stats
- Push notifications
- Analytics dashboard

**Deliverable**: Full-featured tournament management platform

### Phase 3: Polish & Scale (3-6 months)
**Focus**: Performance, UX, advanced features
- UI/UX improvements
- Performance optimizations
- Advanced tournament formats
- Integrations
- Documentation

**Deliverable**: Production-grade platform ready for widespread use

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- [ ] 80%+ test coverage
- [ ] <100ms API response time (p95)
- [ ] 99.9% uptime
- [ ] Zero critical security vulnerabilities
- [ ] <2MB mobile app bundle size

### Product Metrics
- [ ] 100+ active tournaments per month
- [ ] 1000+ registered players
- [ ] 4.5+ star rating (mobile app stores)
- [ ] <5% support ticket rate
- [ ] 90%+ player satisfaction

### Business Metrics
- [ ] Break-even on hosting costs
- [ ] 20%+ month-over-month growth
- [ ] <10% player churn
- [ ] Multiple paying organizations
- [ ] Positive cash flow

---

## 💡 NEXT STEPS FOR YOU

### This Week
1. ✅ Complete organization validation (3-4 hours)
2. ✅ Convert DTOs to classes (6-8 hours)
3. ✅ Add payment/prize validation (4 hours)

### Next Week
4. ✅ Set up testing infrastructure (8-10 hours)
5. ✅ Write critical path tests (10-12 hours)

### Week 3-4
6. ✅ Mobile match reporting (6-8 hours)
7. ✅ Real-time updates (8-10 hours)
8. ✅ Mobile decklist submission (10-12 hours)

**After 4 weeks**: Platform ready for beta testing with real users! 🎉

---

## 📞 QUESTIONS & PRIORITIZATION

Before continuing development, consider:

1. **Target Launch Date**: When do you want to go live?
2. **Core Features**: Which features are must-haves for launch?
3. **User Base**: Are you targeting casual or competitive players?
4. **Monetization**: How will you make money from this platform?
5. **Support Model**: Will you provide customer support?

These answers will help prioritize the roadmap further.
