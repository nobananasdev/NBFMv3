# Design System Usage Examples

This document provides practical examples of how to use the design system in your components.

---

## 📦 Importing Design Tokens

### TypeScript/JavaScript Components

```typescript
import { colors, spacing, borderRadius, shadows } from '@/lib/designTokens'

// Use in inline styles
const buttonStyle = {
  backgroundColor: colors.accent.primary,
  padding: spacing.base,
  borderRadius: borderRadius.lg,
  boxShadow: shadows.md,
}
```

### CSS/Tailwind Classes

```tsx
// Using Tailwind utility classes
<button className="bg-accent-primary text-white rounded-lg shadow-md px-4 py-2">
  Click Me
</button>

// Using custom CSS classes
<button className="btn-modern">
  Primary Action
</button>
```

---

## 🎨 Button Examples

### Primary Button

```tsx
// Using CSS class
<button className="btn-modern">
  Sign In
</button>

// Using Tailwind
<button className="bg-gradient-to-br from-accent-primary to-accent-secondary text-white font-semibold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
  Sign In
</button>
```

### Secondary Button

```tsx
// Using CSS class
<button className="btn-secondary">
  Cancel
</button>

// Using Tailwind
<button className="bg-bg-glass backdrop-blur-md border border-border-primary text-text-primary font-semibold px-6 py-3 rounded-2xl hover:border-border-accent hover:-translate-y-0.5 transition-all duration-300">
  Cancel
</button>
```

### Action Buttons (Show Cards)

```tsx
// Watchlist button
<button className="action-btn watchlist-btn">
  <Image src="/icons/add-to-watchlist.svg" alt="Add" width={24} height={24} />
  <span>Watchlist</span>
</button>

// Rating buttons
<button className="action-btn rate-good">
  <Image src="/icons/thumbs-up.svg" alt="Like" width={24} height={24} />
  <span>Like It</span>
</button>

<button className="action-btn rate-mid">
  <Image src="/icons/thumbs-down.svg" alt="Dislike" width={24} height={24} />
  <span>Not For Me</span>
</button>

<button className="action-btn rate-bad">
  <Image src="/icons/thumbs-down.svg" alt="Bad" width={24} height={24} />
  <span>Bad</span>
</button>
```

### Filter Buttons

```tsx
<button className="filter-btn">
  Action
</button>

<button className="filter-btn">
  Comedy
</button>
```

---

## 🃏 Card Examples

### Glass Card

```tsx
// Basic glass card
<div className="glass-card p-6">
  <h3 className="text-xl font-bold text-text-primary mb-2">Card Title</h3>
  <p className="text-text-secondary">Card content goes here</p>
</div>

// Glass card with minimal hover
<div className="glass-card minimal-hover p-6">
  <h3 className="text-xl font-bold text-text-primary mb-2">Subtle Card</h3>
  <p className="text-text-secondary">No lift on hover</p>
</div>
```

### Show Card

```tsx
<div className="show-card-modern overflow-hidden">
  <div className="relative">
    <Image 
      src={posterUrl} 
      alt={title}
      width={300}
      height={450}
      className="w-full h-auto"
    />
    <div className="rating-badge">
      <span className="text-accent-primary font-bold">8.5</span>
    </div>
  </div>
  <div className="p-4">
    <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-secondary line-clamp-3">{description}</p>
  </div>
</div>
```

---

## 🏷️ Badge Examples

### Rating Badge

```tsx
<div className="rating-badge">
  <Image src="/badges/imdb-badge.png" alt="IMDb" width={32} height={16} />
  <span className="ml-1 text-accent-primary font-bold">8.5</span>
</div>
```

### NEW Badge

```tsx
<span className="new-badge">
  NEW
</span>
```

### Navigation Badge (Notification)

```tsx
<div className="relative">
  <button className="nav-pill">
    Watchlist
  </button>
  <span className="nav-flash-badge nav-flash-badge--desktop">
    3
  </span>
</div>
```

---

## 🧭 Navigation Examples

### Navigation Pills

```tsx
// Active state
<button className="nav-pill active">
  Discover
</button>

// Inactive state
<button className="nav-pill">
  Watchlist
</button>

// With icon
<button className="nav-pill">
  <Image src="/discovery.svg" alt="" width={20} height={20} />
  <span>Discover</span>
</button>
```

---

## 📝 Form Examples

### Search Input

```tsx
<input
  type="text"
  placeholder="Search shows..."
  className="search-input"
/>
```

### Filter Chips

```tsx
// Inactive chip
<button className="chip">
  Action
</button>

// Active chip
<button className="chip active">
  Comedy
</button>
```

### Range Slider

```tsx
<input
  type="range"
  min="1990"
  max="2024"
  value={year}
  onChange={(e) => setYear(e.target.value)}
  className="slider w-full"
/>
```

---

## 🎭 Animation Examples

### Fade In

```tsx
<div className="animate-fade-in">
  Content fades in with upward motion
</div>
```

### Slide Up

```tsx
<div className="animate-slide-up">
  Content slides up from below
</div>
```

### Success Bounce

```tsx
<div className="animate-success-bounce">
  ✓ Success!
</div>
```

### Loading Skeleton

```tsx
<div className="skeleton h-48 w-full" />
```

---

## 🎨 Color Usage Examples

### Using CSS Variables

```tsx
// In a styled component or inline style
<div style={{
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-accent)',
}}>
  Content
</div>
```

### Using Tailwind Classes

```tsx
<div className="bg-bg-primary text-text-primary border border-border-accent">
  Content
</div>
```

### Using Design Tokens

```typescript
import { colors } from '@/lib/designTokens'

const style = {
  backgroundColor: colors.bg.primary,
  color: colors.text.primary,
  borderColor: colors.border.accent,
}
```

---

## 🌈 Gradient Examples

### Primary Gradient Button

```tsx
<button className="bg-gradient-to-br from-accent-primary to-accent-secondary text-white font-semibold px-6 py-3 rounded-2xl">
  Gradient Button
</button>
```

### Card with Gradient Background

```tsx
<div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary p-6 rounded-3xl">
  Gradient Card
</div>
```

### Using Design Tokens

```typescript
import { gradients } from '@/lib/designTokens'

<div style={{ background: gradients.primary }}>
  Content
</div>
```

---

## 📱 Responsive Examples

### Mobile-First Approach

```tsx
<div className="
  text-sm sm:text-base md:text-lg
  p-4 sm:p-6 md:p-8
  rounded-2xl sm:rounded-3xl
">
  Responsive content
</div>
```

### Conditional Rendering

```tsx
// Show different content on mobile vs desktop
<div>
  <div className="block sm:hidden">
    Mobile Navigation
  </div>
  <div className="hidden sm:block">
    Desktop Navigation
  </div>
</div>
```

---

## 🎯 Layout Examples

### Hero Section

```tsx
<section className="hero-section">
  <div className="hero-inner">
    <h1 className="hero-headline">
      <span>No Bananas</span>
      <span>For Me</span>
    </h1>
    <p className="hero-subtitle">
      Track your favorite shows without the bananas
    </p>
    <button className="hero-scroll-btn">
      <svg>...</svg>
    </button>
  </div>
</section>
```

### Content Container

```tsx
<div className="container-content mx-auto px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    Content
  </div>
</div>
```

### Grid Layout

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
  {shows.map(show => (
    <ShowCard key={show.id} show={show} />
  ))}
</div>
```

---

## 🔧 Helper Functions

### Using withOpacity

```typescript
import { withOpacity, colors } from '@/lib/designTokens'

// Create semi-transparent version of a color
const style = {
  backgroundColor: withOpacity(colors.accent.primary, 0.5),
}
```

### Using cssVar

```typescript
import { cssVar } from '@/lib/designTokens'

// Reference CSS variable
const style = {
  color: cssVar('text-primary'),
  backgroundColor: cssVar('bg-glass'),
}
```

---

## 🎨 Streaming Service Logos

### Logo with Color

```tsx
import { streamingColors } from '@/lib/designTokens'

<div className="provider-logo">
  <span className="provider-logo--text" style={{ color: streamingColors.netflix }}>
    NETFLIX
  </span>
</div>
```

### Logo Classes

```tsx
<div className="provider-logo">
  <span className="provider-logo--text logo-netflix">NETFLIX</span>
</div>

<div className="provider-logo">
  <span className="provider-logo--text logo-prime">PRIME</span>
</div>

<div className="provider-logo">
  <span className="provider-logo--text logo-disney">DISNEY+</span>
</div>
```

---

## 🎭 Modal/Panel Examples

### Modal Panel

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="modal-panel max-w-md w-full mx-4 p-6">
    <h2 className="text-2xl font-bold text-text-primary mb-4">Modal Title</h2>
    <p className="text-text-secondary mb-6">Modal content goes here</p>
    <div className="flex gap-3">
      <button className="btn-modern flex-1">Confirm</button>
      <button className="btn-secondary flex-1">Cancel</button>
    </div>
  </div>
</div>
```

---

## 🎨 Custom Scrollbar

The custom scrollbar is automatically applied globally. No additional classes needed.

```css
/* Already defined in globals.css */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 4px;
}
```

---

## 📚 Best Practices

### 1. Prefer CSS Classes Over Inline Styles

```tsx
// ✅ Good
<button className="btn-modern">Click Me</button>

// ❌ Avoid
<button style={{ background: 'linear-gradient(...)' }}>Click Me</button>
```

### 2. Use Design Tokens for Consistency

```typescript
// ✅ Good
import { colors, spacing } from '@/lib/designTokens'
const style = { color: colors.text.primary, padding: spacing.base }

// ❌ Avoid
const style = { color: '#f8fafc', padding: '16px' }
```

### 3. Mobile-First Responsive Design

```tsx
// ✅ Good - Mobile first, then larger screens
<div className="text-sm sm:text-base lg:text-lg">

// ❌ Avoid - Desktop first
<div className="text-lg sm:text-base">
```

### 4. Use Semantic Color Names

```tsx
// ✅ Good
<button className="bg-accent-primary">

// ❌ Avoid
<button className="bg-yellow-400">
```

### 5. Maintain Accessibility

```tsx
// ✅ Good - Proper focus states
<button className="btn-modern focus:outline-none focus:ring-2 focus:ring-accent-primary">

// ✅ Good - Sufficient contrast
<p className="text-text-primary">High contrast text</p>

// ❌ Avoid - Low contrast
<p className="text-text-tertiary text-xs">Hard to read</p>
```

---

*For complete design system documentation, see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)*