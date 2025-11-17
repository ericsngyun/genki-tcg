# Credit Management System Enhancement Plan

## Executive Summary

This document outlines the comprehensive enhancement of the Genki TCG credit management system, focusing on creating a polished, intuitive, and production-ready experience for shop owners and staff to manage player credits.

---

## 🎯 Design Goals

1. **Clarity** - Credits are store tokens, not money (fix inconsistency)
2. **Efficiency** - Manage credits in seconds, not minutes
3. **Transparency** - Complete audit trail with detailed context
4. **Beauty** - Clean, modern UI that feels professional
5. **Reliability** - Bulletproof validation and error handling
6. **Scalability** - Handle thousands of transactions smoothly

---

## 🔍 Critical Issues Identified

### 1. Data Model Inconsistency (CRITICAL - FIX FIRST)
**Problem:** Players page displays `${(balance/100).toFixed(2)}` but everywhere else uses integer credits.

**Decision Required:**
- **Option A:** Credits are integer tokens (100 credits = 100 tokens)
- **Option B:** Credits are cents (100 credits = $1.00)

**Recommendation:** **Option A** - Integer tokens
- Simpler for users to understand
- No decimal confusion
- Easier mental math
- Common in gaming/arcade systems
- Current backend assumes this

**Fix:**
- Remove `/100` division from Players page
- Display as "123 credits" not "$1.23"
- Update all display logic consistently

### 2. Missing Pagination (HIGH PRIORITY)
**Problem:** Transaction history returns ALL records - could be 10,000+

**Fix:**
- Implement cursor-based pagination
- Default 50 transactions per page
- "Load more" button
- Virtual scrolling for large lists

### 3. Poor Error Handling (HIGH PRIORITY)
**Problem:** Generic `alert()` calls everywhere

**Fix:**
- Implement toast notification system
- Structured error messages
- Retry mechanisms
- Loading states

### 4. Limited Validation (MEDIUM PRIORITY)
**Problem:** No DTO validation, no amount limits

**Fix:**
- Add class-validator decorators
- Set reasonable limits (e.g., max 10,000 per transaction)
- Client-side validation with instant feedback

---

## 🎨 Enhanced UI/UX Design

### Admin Web - Credits Management Page

#### Layout: Three-Panel Design

```
┌──────────────────────────────────────────────────────────────────┐
│  Credits Management                                    [Export ▼] │
├──────────────┬──────────────────────────┬───────────────────────┤
│              │                          │                        │
│  USER LIST   │    TRANSACTION DETAILS   │   QUICK ACTIONS       │
│              │                          │                        │
│  Search...   │  ┌─────────────────────┐│  ┌──────────────────┐ │
│  ┌────────┐  │  │ John Smith          ││  │  Quick Add       │ │
│  │● Alice │  │  │ john@example.com    ││  │                  │ │
│  │  120 cr│  │  │                     ││  │ [+10] [+25] [+50]│ │
│  ├────────┤  │  │ Balance: 450 credits││  │ [+100] [+250]    │ │
│  │  Bob   │  │  │ ↗ +25 this week     ││  │                  │ │
│  │  85 cr │  │  └─────────────────────┘│  │  Quick Deduct    │ │
│  ├────────┤  │                          │  │ [-5] [-10] [-25] │ │
│  │○ Carol │  │  [Filters ▼] [Export]   │  │                  │ │
│  │  200 cr│  │                          │  │  Custom Amount   │ │
│  └────────┘  │  ┌──────────────────────┐│  │  [______] [✓]   │ │
│              │  │ 📅 Nov 17, 2:30 PM  ││  └──────────────────┘ │
│ 15 players   │  │ +50 credits          ││                       │
│ 3,400 total  │  │ 🏆 Prize             ││  ┌──────────────────┐ │
│              │  │ "1st Place OPTCG"   ││  │  Full Adjustment │ │
│              │  │ by Sarah (Owner)    ││  │  [Adjust]        │ │
│              │  ├──────────────────────┤│  └──────────────────┘ │
│              │  │ 📅 Nov 16, 4:15 PM  ││                       │
│              │  │ -25 credits          ││  Recent Activity     │
│              │  │ 💳 Purchase          ││  ○ 5 transactions    │
│              │  │ "Pack of sleeves"   ││    in last hour      │
│              │  └──────────────────────┘│                       │
└──────────────┴──────────────────────────┴───────────────────────┘
```

#### Key Features:

**User List Panel (Left):**
- Real-time search with debouncing
- Sort by: name, balance, recent activity
- Visual indicators:
  - ● Green dot = active (transactions in last 7 days)
  - ○ Gray dot = inactive
- Quick balance preview
- Pagination (load more)
- Filters:
  - All users
  - Low balance (< 50 credits)
  - High balance (> 500 credits)
  - Recently active
  - Inactive (30+ days)

**Transaction Details Panel (Center):**
- Selected user's full profile at top
  - Avatar
  - Name + email
  - Current balance (large, bold)
  - Trend indicator (↗ up, ↘ down, → neutral)
  - "Last transaction: X ago"
- Filter controls:
  - Date range picker
  - Reason code filter (multi-select)
  - Amount range slider
  - Search memo
- Transaction cards:
  - Icon based on reason code:
    - 🏆 Prize
    - 💳 Purchase
    - ➕ Manual Add
    - ➖ Manual Deduct
    - 💰 Refund
  - Amount (color-coded)
  - Reason badge
  - Memo (if present)
  - Timestamp (relative + absolute on hover)
  - Performer (who did it)
  - Expandable details
- Infinite scroll with virtual rendering
- Export button (CSV/PDF)

**Quick Actions Panel (Right):**
- Preset buttons for common amounts
- Custom amount input
- Reason auto-selection based on amount
- Memo suggestions
- One-click actions
- Recent activity summary
- Warnings:
  - "Low balance" if < 50
  - "Large transaction" if > 500
- Keyboard shortcuts

### Visual Design Specifications

#### Color Palette

```css
--credit-positive: #10b981  /* Green for credits added */
--credit-negative: #ef4444  /* Red for credits spent */
--credit-neutral: #6b7280   /* Gray for neutral */
--background: #ffffff       /* Clean white */
--surface: #f9fafb         /* Light gray for cards */
--border: #e5e7eb          /* Subtle borders */
--text-primary: #111827    /* Near black */
--text-secondary: #6b7280  /* Medium gray */
--accent: #6366f1          /* Indigo for actions */
```

#### Typography

```css
--font-display: 'Inter', sans-serif
--size-balance: 3rem (48px)    /* Large balance display */
--size-amount: 1.5rem (24px)   /* Transaction amounts */
--size-body: 1rem (16px)       /* Regular text */
--size-caption: 0.875rem (14px) /* Secondary info */
```

#### Icons

Use consistent icon set (Heroicons or Lucide):
- 🏆 Trophy - Prizes
- 💳 CreditCard - Purchases
- ➕ Plus - Manual additions
- ➖ Minus - Manual deductions
- 💰 DollarSign - Refunds
- 🎟️ Ticket - Event entries
- 📊 BarChart - Analytics
- 📥 Download - Export
- 🔍 Search - Filters
- ⚙️ Settings - Configuration

#### Component Design

**Balance Display:**
```tsx
<div className="balance-card">
  <div className="balance-amount">450</div>
  <div className="balance-label">credits</div>
  <div className="balance-trend">
    <TrendingUpIcon />
    <span>+25 this week</span>
  </div>
</div>
```

**Transaction Card:**
```tsx
<div className="transaction-card">
  <div className="transaction-icon prize">🏆</div>
  <div className="transaction-content">
    <div className="transaction-header">
      <span className="amount positive">+50</span>
      <span className="reason-badge">Prize</span>
    </div>
    <div className="transaction-memo">1st Place OPTCG Tournament</div>
    <div className="transaction-meta">
      <span>2:30 PM • by Sarah</span>
    </div>
  </div>
</div>
```

**Quick Action Button:**
```tsx
<button className="quick-action">
  <span className="action-amount">+25</span>
  <span className="action-label">credits</span>
</button>
```

### Mobile App - Wallet Screen

#### Enhanced Design

```
┌─────────────────────────────┐
│        MY WALLET            │
├─────────────────────────────┤
│                             │
│     ┌─────────────────┐    │
│     │                 │    │
│     │      450        │    │
│     │    credits      │    │
│     │                 │    │
│     │   ↗ +25 today   │    │
│     └─────────────────┘    │
│                             │
│  [Earn Credits] [Redeem]   │
│                             │
├─────────────────────────────┤
│  Recent Activity            │
│                             │
│  🏆 +50 credits             │
│  1st Place OPTCG            │
│  2 hours ago                │
│                             │
│  💳 -25 credits             │
│  Card sleeves               │
│  Yesterday                  │
│                             │
│  [View All History]         │
│                             │
├─────────────────────────────┤
│  How Credits Work           │
│  • Earn by playing          │
│  • Redeem at shop           │
│  • Never expire             │
│  [Learn More]               │
└─────────────────────────────┘
```

#### Key Features:

**Balance Card:**
- Large, prominent display
- Trend indicator
- Haptic feedback on pull-to-refresh

**Action Buttons:**
- "Earn Credits" - Shows how to earn
- "Redeem" - Generates QR code for staff to scan

**Transaction List:**
- Icon + amount + title
- Expandable for full details
- Swipe actions (future: dispute, receipt)

**Educational Section:**
- First-time user onboarding
- FAQ accordion
- Contact support

---

## 🔧 Technical Implementation

### Phase 1: Critical Fixes (Implement First)

#### 1.1 Fix Data Model Inconsistency

**Backend - No Changes Needed** (already correct)

**Frontend - Update Players Page:**

```typescript
// Before (WRONG):
${(creditBalance / 100).toFixed(2)}

// After (CORRECT):
{creditBalance.toLocaleString()} credits
```

**Files to Update:**
- `apps/admin-web/src/app/dashboard/players/page.tsx` (lines 138-140, 156-175)

#### 1.2 Add DTO Validation

**Create:** `apps/backend/src/credits/dto/credit-adjust.dto.ts`

```typescript
import { IsNumber, IsString, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { CreditReasonCode } from '@prisma/client';

export class CreditAdjustDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(-10000, { message: 'Cannot deduct more than 10,000 credits at once' })
  @Max(10000, { message: 'Cannot add more than 10,000 credits at once' })
  amount: number;

  @IsEnum(CreditReasonCode)
  reasonCode: CreditReasonCode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;

  @IsOptional()
  @IsString()
  relatedEventId?: string;
}
```

**Update Controller:**
```typescript
import { CreditAdjustDto } from './dto/credit-adjust.dto';

@Post('adjust')
@Roles('STAFF', 'OWNER')
async adjustCredits(
  @CurrentUser() user: any,
  @Body() dto: CreditAdjustDto, // Now validated automatically
) {
  return this.creditsService.adjustCredits(user.orgId, dto, user.id);
}
```

#### 1.3 Add Pagination to Transaction History

**Update Service:**

```typescript
async getTransactionHistory(
  orgId: string,
  userId: string,
  options: {
    cursor?: string;
    take?: number;
    reasonCode?: CreditReasonCode;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { cursor, take = 50, reasonCode, startDate, endDate } = options;

  const where: any = {
    orgId,
    userId,
  };

  if (reasonCode) {
    where.reasonCode = reasonCode;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const transactions = await this.prisma.creditLedgerEntry.findMany({
    where,
    take: take + 1, // Fetch one extra to determine if there are more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      creator: { select: { name: true } },
      relatedEvent: { select: { name: true } },
    },
  });

  const hasMore = transactions.length > take;
  const items = hasMore ? transactions.slice(0, -1) : transactions;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}
```

**Update Controller:**

```typescript
@Get('history/:userId')
@Roles('STAFF', 'OWNER')
async getTransactionHistory(
  @CurrentUser() user: any,
  @Param('userId') userId: string,
  @Query('cursor') cursor?: string,
  @Query('take') take?: string,
  @Query('reasonCode') reasonCode?: CreditReasonCode,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  return this.creditsService.getTransactionHistory(user.orgId, userId, {
    cursor,
    take: take ? parseInt(take) : undefined,
    reasonCode,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });
}
```

#### 1.4 Replace alert() with Toast Notifications

**Install Sonner (recommended toast library):**

```bash
cd apps/admin-web
npm install sonner
```

**Setup:** `apps/admin-web/src/app/layout.tsx`

```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
```

**Usage:** Replace all `alert()` with `toast`:

```typescript
import { toast } from 'sonner';

// Before:
alert('Credits adjusted successfully');

// After:
toast.success('Credits adjusted successfully', {
  description: `Added ${amount} credits to ${user.name}`,
});

// For errors:
toast.error('Failed to adjust credits', {
  description: error.message,
  action: {
    label: 'Retry',
    onClick: () => handleAdjustCredits(),
  },
});
```

---

### Phase 2: UI Enhancements (Implement Second)

#### 2.1 Enhanced Credits Page Layout

**File:** `apps/admin-web/src/app/dashboard/credits/page.tsx`

I'll create a completely new version with three-panel layout, filters, and all enhancements.

#### 2.2 Transaction Detail Modal

Create reusable modal component for viewing full transaction details.

#### 2.3 Quick Action Buttons

Add preset amount buttons for common operations.

#### 2.4 Export Functionality

Add CSV/PDF export for transactions.

---

### Phase 3: Advanced Features (Implement Third)

#### 3.1 QR Code Integration

**Generate QR for Player:**
- Encode userId in QR code
- Display in mobile wallet
- Staff scans to redeem

**Scanner in Admin Web:**
- Use `react-qr-scanner` or similar
- Quick redemption flow
- Confirmation before deducting

#### 3.2 Analytics Dashboard

**Metrics to Display:**
- Total credits issued (all time, this month)
- Total credits redeemed
- Average balance per player
- Most active players
- Credits by reason code (pie chart)
- Credits over time (line chart)

#### 3.3 Notification System

**Events to Notify:**
- Credit balance changed
- Low balance warning (< 20 credits)
- Prize awarded
- Large transaction (> 100 credits)

---

## 📋 Implementation Checklist

### Backend Changes

- [ ] Create `CreditAdjustDto` with validation
- [ ] Add pagination to `getTransactionHistory()`
- [ ] Add filtering options (date range, reason code)
- [ ] Create export endpoint (CSV generation)
- [ ] Add QR redemption endpoint
- [ ] Add analytics aggregation queries
- [ ] Write unit tests for all services
- [ ] Write integration tests for controllers

### Admin Web Changes

- [ ] Fix credit display inconsistency (remove /100)
- [ ] Install and setup Sonner for toasts
- [ ] Replace all `alert()` with `toast()`
- [ ] Redesign credits page with three panels
- [ ] Add transaction filtering UI
- [ ] Add pagination controls
- [ ] Add export button
- [ ] Create quick action buttons
- [ ] Add loading skeletons
- [ ] Create transaction detail modal
- [ ] Implement QR scanner
- [ ] Create analytics dashboard page
- [ ] Add keyboard shortcuts
- [ ] Improve mobile responsiveness

### Mobile App Changes

- [ ] Enhance wallet screen design
- [ ] Add QR code generation
- [ ] Add "How it works" section
- [ ] Add full transaction history view
- [ ] Add transaction detail view
- [ ] Implement pull-to-refresh
- [ ] Add empty states
- [ ] Add loading states
- [ ] Test on iOS and Android

### Testing & Documentation

- [ ] Write E2E tests for credit workflows
- [ ] Test with large transaction volumes (10,000+ records)
- [ ] Performance testing
- [ ] Create user guide for staff
- [ ] Create video tutorials
- [ ] Update API documentation
- [ ] Security audit

---

## 🚀 Expected Outcomes

### User Experience

**Before:**
- Confusing credit display (dollars vs credits)
- Generic error messages
- Limited transaction visibility
- No filtering or search
- Clunky adjustment process

**After:**
- Clear, consistent credit display
- Helpful, actionable error messages
- Full transaction history with filters
- Quick preset actions
- Smooth, professional feel

### Performance

**Before:**
- Loads all transactions (could be 10,000+)
- No pagination
- Slow on large datasets

**After:**
- Paginated (50 per page)
- Virtual scrolling
- Fast even with 100,000+ transactions

### Admin Efficiency

**Before:**
- Multiple clicks to adjust credits
- No bulk operations
- Manual record keeping

**After:**
- One-click preset adjustments
- Export for accounting
- Complete audit trail
- Analytics at a glance

---

## 📊 Success Metrics

- **Time to adjust credits:** < 5 seconds (target: 2 seconds)
- **Error rate:** < 1% of transactions
- **User satisfaction:** 4.5+/5 stars
- **Page load time:** < 2 seconds with 1,000 users
- **Transaction history load:** < 1 second per page

---

## 🎯 Next Steps

1. **Seed the database** (do this now!)
2. Implement Phase 1 (critical fixes) - 2 days
3. Test Phase 1 thoroughly
4. Implement Phase 2 (UI enhancements) - 3 days
5. Implement Phase 3 (advanced features) - 4 days
6. Comprehensive testing - 2 days
7. Deploy to production
8. Monitor and iterate

---

**Ready to build this? Let's start with Phase 1!**
