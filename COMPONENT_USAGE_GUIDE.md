# Component Usage Guide

Quick reference for using the new UI components in the Genki TCG project.

---

## 📱 Mobile App Components

### Importing Components
```tsx
import { Button, Card, Badge, Input } from '../components';
import { theme } from '../lib/theme';
```

### Button Component

```tsx
// Primary button (default)
<Button onPress={handleSubmit}>
  Submit
</Button>

// Secondary button
<Button variant="secondary" onPress={handleCancel}>
  Cancel
</Button>

// Outline button
<Button variant="outline" onPress={handleEdit}>
  Edit
</Button>

// Ghost button (transparent)
<Button variant="ghost" onPress={handleClose}>
  Close
</Button>

// Danger button
<Button variant="danger" onPress={handleDelete}>
  Delete
</Button>

// With loading state
<Button loading={isSubmitting} onPress={handleSubmit}>
  Save Changes
</Button>

// Full width
<Button fullWidth onPress={handleLogin}>
  Sign In
</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With accessibility
<Button
  onPress={handleSubmit}
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit your registration"
>
  Submit
</Button>
```

### Card Component

```tsx
// Default card with shadow
<Card>
  <Text>Card content</Text>
</Card>

// Elevated card (more shadow)
<Card variant="elevated">
  <Text>Important content</Text>
</Card>

// Outlined card (border, no shadow)
<Card variant="outlined">
  <Text>Bordered content</Text>
</Card>

// With custom padding
<Card padding="sm">Small padding</Card>
<Card padding="base">Base padding</Card>
<Card padding="xl">Large padding</Card>

// With accessibility
<Card accessibilityRole="button" accessibilityLabel="Event card">
  <Text>Tappable card</Text>
</Card>
```

### Badge Component

```tsx
// Basic badge
<Badge>Default</Badge>

// Status badges
<Badge variant="success">Success</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="neutral">Neutral</Badge>

// Event-specific status badges
<Badge variant="checkedIn">Checked In</Badge>
<Badge variant="notCheckedIn">Not Checked In</Badge>
<Badge variant="paid">Paid</Badge>
<Badge variant="unpaid">Unpaid</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>

// With accessibility
<Badge
  variant="paid"
  accessibilityLabel="Payment status: Paid in full"
>
  Paid
</Badge>
```

### Input Component

```tsx
// Basic input
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
/>

// With error
<Input
  label="Password"
  value={password}
  onChangeText={setPassword}
  error="Password is required"
  secureTextEntry
/>

// With helper text
<Input
  label="Entry Fee"
  value={fee}
  onChangeText={setFee}
  helperText="Enter amount in cents (500 = $5.00)"
  keyboardType="numeric"
/>

// Required field
<Input
  label="Name"
  value={name}
  onChangeText={setName}
  required
/>

// With full accessibility
<Input
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email to receive notifications"
  required
/>
```

### Using Theme

```tsx
import { theme } from '../lib/theme';

// Colors
<View style={{ backgroundColor: theme.colors.primary.main }} />
<Text style={{ color: theme.colors.text.secondary }} />

// Typography
<Text style={{
  fontSize: theme.typography.fontSize.lg,
  fontWeight: theme.typography.fontWeight.bold,
}} />

// Spacing
<View style={{
  padding: theme.spacing.base,
  marginBottom: theme.spacing.xl,
}} />

// Shadows
<View style={{
  ...theme.shadows.md,
  borderRadius: theme.borderRadius.base,
}} />

// Status colors
<View style={{
  backgroundColor: theme.statusColors.paid.background,
}}>
  <Text style={{ color: theme.statusColors.paid.text }}>
    Paid
  </Text>
</View>
```

---

## 🖥️ Admin Dashboard Components

### Importing Components
```tsx
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ResponsiveTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  MobileCard,
  MobileCardRow,
} from '@/components/ui/responsive-table';
```

### StatusBadge Component

```tsx
// Event status badges
<StatusBadge status="SCHEDULED" />
<StatusBadge status="IN_PROGRESS" />
<StatusBadge status="COMPLETED" />
<StatusBadge status="CANCELLED" />

// Player status badges
<StatusBadge status="CHECKED_IN" />
<StatusBadge status="NOT_CHECKED_IN" />

// Payment status badges
<StatusBadge status="PAID" />
<StatusBadge status="UNPAID" />
<StatusBadge status="FREE" />

// Without icon
<StatusBadge status="PAID" showIcon={false} />

// With custom className
<StatusBadge status="COMPLETED" className="ml-2" />
```

### Responsive Table Components

```tsx
// Full responsive table example
<ResponsiveTable ariaLabel="Players table">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {players.map((player) => (
        <TableRow key={player.id}>
          <TableCell className="font-medium">
            {player.name}
          </TableCell>
          <TableCell className="text-gray-600">
            {player.email}
          </TableCell>
          <TableCell>
            <StatusBadge
              status={player.checkedInAt ? 'CHECKED_IN' : 'NOT_CHECKED_IN'}
            />
          </TableCell>
          <TableCell>
            <button className="text-primary hover:underline">
              Edit
            </button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ResponsiveTable>

// Empty state
<ResponsiveTable ariaLabel="Events table">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Date</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {events.length === 0 ? (
        <TableRow>
          <TableCell colSpan={2} className="text-center py-12">
            No events found
          </TableCell>
        </TableRow>
      ) : (
        events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>{event.name}</TableCell>
            <TableCell>{event.date}</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</ResponsiveTable>
```

### Mobile Card Alternative

For better mobile UX, you can use card-based layouts instead of tables:

```tsx
// Desktop: Table, Mobile: Cards
<div>
  {/* Desktop Table (hidden on mobile) */}
  <div className="hidden md:block">
    <ResponsiveTable>
      {/* Table content */}
    </ResponsiveTable>
  </div>

  {/* Mobile Cards (hidden on desktop) */}
  <div className="md:hidden">
    {players.map((player) => (
      <MobileCard key={player.id}>
        <MobileCardRow label="Name" value={player.name} />
        <MobileCardRow label="Email" value={player.email} />
        <MobileCardRow
          label="Status"
          value={<StatusBadge status={player.status} />}
        />
        <MobileCardRow
          label="Actions"
          value={
            <button className="text-primary">Edit</button>
          }
        />
      </MobileCard>
    ))}
  </div>
</div>
```

---

## ♿ Accessibility Best Practices

### Mobile (React Native)

```tsx
// ✅ Good: Proper accessibility
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Delete event"
  accessibilityHint="Double tap to delete this event permanently"
>
  <Text>Delete</Text>
</TouchableOpacity>

// ❌ Bad: No accessibility
<TouchableOpacity onPress={handlePress}>
  <Text>Delete</Text>
</TouchableOpacity>

// ✅ Good: Accessible input
<Input
  label="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
  error={error}
  accessibilityLabel="Password"
  required
/>

// ❌ Bad: No labels or error announcements
<TextInput
  value={password}
  onChangeText={setPassword}
  secureTextEntry
/>

// ✅ Good: Status badge with label
<Badge
  variant="paid"
  accessibilityLabel="Payment status: Paid in full"
>
  Paid
</Badge>

// ❌ Bad: Emoji without text alternative
<Text>🎮</Text>

// ✅ Good: Emoji with accessible alternative
<Text accessibilityLabel="Game type: Trading Card Game">
  🎮
</Text>
```

### Admin Dashboard (Next.js)

```tsx
// ✅ Good: Proper ARIA labels
<button
  onClick={handleDelete}
  aria-label="Delete event"
  className="focus:ring-2 focus:ring-primary"
>
  <TrashIcon className="h-5 w-5" aria-hidden="true" />
</button>

// ❌ Bad: Icon-only button without label
<button onClick={handleDelete}>
  <TrashIcon className="h-5 w-5" />
</button>

// ✅ Good: Semantic table
<table aria-label="Players list">
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
    </tr>
  </thead>
  <tbody>
    {/* rows */}
  </tbody>
</table>

// ✅ Good: Status with multiple indicators
<StatusBadge status="PAID" showIcon={true} />
// Renders: [✓ Icon] + [Green Background] + "Paid" text
// = Color + Icon + Text (triple redundancy for accessibility)

// ❌ Bad: Color-only status
<span className="text-green-600">Paid</span>
```

---

## 🎨 Styling Conventions

### Mobile
- Use `theme.*` instead of hardcoded values
- Use StyleSheet.create() for all styles
- Use component props for variants (don't create custom styles)
- Keep styles at the bottom of the file

```tsx
// ✅ Good
<Button variant="primary" size="lg">Submit</Button>

// ❌ Bad
<TouchableOpacity style={{ backgroundColor: '#4F46E5', padding: 16 }}>
  <Text style={{ color: '#FFFFFF' }}>Submit</Text>
</TouchableOpacity>
```

### Admin Dashboard
- Use Tailwind utility classes
- Use StatusBadge for status indicators
- Use ResponsiveTable for data tables
- Add focus:ring-2 for all interactive elements

```tsx
// ✅ Good
<StatusBadge status="PAID" />

// ❌ Bad
<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
  Paid
</span>
```

---

## 🚀 Quick Start Checklist

When creating a new screen/page:

### Mobile
- [ ] Import theme and components
- [ ] Use Button instead of TouchableOpacity
- [ ] Use Input instead of TextInput
- [ ] Use Card for containers
- [ ] Use Badge for status indicators
- [ ] Add accessibilityRole to all interactive elements
- [ ] Add accessibilityLabel to all buttons
- [ ] Add accessibilityHint for context
- [ ] Use theme.* for all colors/spacing
- [ ] Test with screen reader (TalkBack/VoiceOver)

### Admin Dashboard
- [ ] Add aria-label to all buttons
- [ ] Use StatusBadge for status indicators
- [ ] Use ResponsiveTable for data tables
- [ ] Add focus:ring-2 to interactive elements
- [ ] Add role="main", role="banner", etc.
- [ ] Test keyboard navigation (Tab, Enter, Esc)
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Verify mobile responsiveness

---

## 📚 Additional Resources

- **Mobile Theme:** `apps/mobile/lib/theme.ts`
- **Mobile Components:** `apps/mobile/components/`
- **Admin Components:** `apps/admin-web/src/components/ui/`
- **Tailwind Config:** `apps/admin-web/tailwind.config.ts`
- **Implementation Details:** `UI_UX_IMPROVEMENTS_IMPLEMENTED.md`

---

**Last Updated:** 2025-11-13
