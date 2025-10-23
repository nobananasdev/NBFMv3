# No Bananas For Me - Design System Documentation

## Overview
This document describes the complete design system for the No Bananas For Me application, including colors, typography, spacing, components, and usage guidelines.

---

## 🎨 Color Palette

### Background Colors
```css
--bg-primary: #060b13      /* Main background - darkest navy */
--bg-secondary: #101826    /* Secondary surfaces */
--bg-tertiary: #1a2535     /* Tertiary surfaces */
--bg-glass: rgba(13, 20, 33, 0.75)        /* Glass effect base */
--bg-glass-hover: rgba(23, 32, 48, 0.85)  /* Glass effect hover */
```

**Usage:**
- `--bg-primary`: Main page background
- `--bg-secondary`: Card backgrounds, panels
- `--bg-tertiary`: Nested elements, scrollbar track
- `--bg-glass`: Transparent overlays, modals
- `--bg-glass-hover`: Hover states for glass elements

### Accent Colors
```css
--accent-primary: #f5b400     /* Primary yellow - main brand color */
--accent-secondary: #facc15   /* Secondary yellow - lighter variant */
--accent-success: #38d49b     /* Success green */
--accent-warning: #f59e0b     /* Warning orange */
--accent-danger: #ef4444      /* Danger red */
```

**Usage:**
- `--accent-primary`: Primary buttons, active states, highlights
- `--accent-secondary`: Hover states, secondary highlights
- `--accent-success`: Success messages, positive ratings
- `--accent-warning`: Warning messages, moderate ratings
- `--accent-danger`: Error messages, negative ratings

### Text Colors
```css
--text-primary: #f8fafc      /* Primary text - brightest */
--text-secondary: #d5dae6    /* Secondary text - medium */
--text-tertiary: #94a3b8     /* Tertiary text - dimmed */
--text-accent: #fde68a       /* Accent text - yellow tint */
```

**Usage:**
- `--text-primary`: Headings, important text
- `--text-secondary`: Body text, descriptions
- `--text-tertiary`: Labels, placeholders, disabled text
- `--text-accent`: Highlighted text, special emphasis

### Border Colors
```css
--border-primary: rgba(148, 163, 184, 0.18)   /* Standard borders */
--border-secondary: rgba(148, 163, 184, 0.1)  /* Subtle borders */
--border-accent: rgba(245, 180, 0, 0.45)      /* Accent borders */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(9, 12, 20, 0.6)
--shadow-md: 0 8px 20px rgba(6, 11, 19, 0.45)
--shadow-lg: 0 18px 40px rgba(5, 9, 16, 0.55)
--shadow-xl: 0 30px 60px rgba(3, 6, 12, 0.65)
--shadow-glow: 0 0 28px rgba(245, 180, 0, 0.35)  /* Yellow glow effect */
```

### Gradients
```css
--gradient-primary: linear-gradient(135deg, #f5b400 0%, #facc15 100%)
--gradient-secondary: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)
--gradient-card: linear-gradient(155deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.82) 100%)
--gradient-glass: linear-gradient(155deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.6) 100%)
--gradient-rating: linear-gradient(135deg, rgba(56, 212, 155, 0.24) 0%, rgba(14, 165, 129, 0.18) 100%)
```

---

## 📝 Typography

### Font Family
```css
font-family: 'Inter', system-ui, sans-serif;
```

**Note:** Inter font must be imported via Google Fonts or next/font for optimal performance.

### Font Sizes (Desktop)
- **Body**: 16px (1rem)
- **Small**: 14px (0.875rem)
- **Extra Small**: 12px (0.75rem)
- **Large**: 18px (1.125rem)
- **XL**: 20px (1.25rem)
- **2XL**: 24px (1.5rem)
- **3XL**: 30px (1.875rem)
- **4XL**: 36px (2.25rem)

### Font Sizes (Mobile - max-width: 768px)
- **Body**: 15px
- **Small**: 13px
- **Extra Small**: 11px
- **Large**: 17px
- **XL**: 19px
- **2XL**: 23px
- **3XL**: 29px
- **4XL**: 35px

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

### Line Heights
- **Tight**: 1.25
- **Normal**: 1.5
- **Relaxed**: 1.6
- **Loose**: 2

---

## 🧩 Component Classes

### Buttons

#### Primary Button (`.btn-modern`)
```css
/* Yellow gradient button with shimmer effect */
background: var(--gradient-primary);
border-radius: 1rem (16px);
padding: 0.75rem 1.5rem;
font-weight: 600;
box-shadow: var(--shadow-md);
```

**States:**
- Hover: Lifts 2px, adds glow shadow
- Active: Returns to base position
- Shimmer effect on hover

**Usage:** Main CTAs, primary actions

#### Secondary Button (`.btn-secondary`)
```css
/* Glass effect button */
background: var(--bg-glass);
border: 1px solid var(--border-primary);
border-radius: 1rem;
padding: 0.75rem 1.5rem;
backdrop-filter: blur(10px);
```

**States:**
- Hover: Accent border, lifts 2px

**Usage:** Secondary actions, cancel buttons

#### Action Button (`.action-btn`)
```css
/* Transparent base with hover effects */
background: transparent;
border: none;
border-radius: 1rem;
padding: 0.625rem 1rem;
```

**Variants:**
- `.action-btn.gradient`: Keeps gradient background
- `.action-btn.rate-bad`: Red tinted glass (negative rating)
- `.action-btn.rate-mid`: Orange tinted glass (neutral rating)
- `.action-btn.rate-good`: Green tinted glass (positive rating)
- `.action-btn.watchlist-btn`: Orange-yellow gradient glass

**Usage:** Show cards, rating buttons, watchlist actions

#### Filter Button (`.filter-btn`)
```css
/* Clearer default tone for sidebar filters */
background: rgba(255, 255, 255, 0.12);
border: 1px solid var(--border-primary);
border-radius: 1rem;
padding: 0.625rem 1rem;
```

**States:**
- Hover: Stronger background, accent border

**Usage:** Filter sidebar options

### Navigation

#### Navigation Pills (`.nav-pill`)
```css
/* Transparent base matching action buttons */
background: transparent;
border: 1px solid var(--border-primary);
border-radius: 1rem;
padding: 0.625rem 1rem;
```

**States:**
- Active: Yellow gradient background with glow
- Hover: Subtle lift (2px), glass background

**Usage:** Main navigation tabs (Discover, Watchlist, Rated, New Seasons)

#### Navigation Badge (`.nav-flash-badge`)
```css
/* Animated notification badge */
background: rgba(245, 197, 24, 0.95);
color: #111;
border-radius: 9999px;
padding: 0.18rem 0.55rem;
font-size: 0.68rem;
animation: nav-flash-pop 1.4s ease-out forwards;
```

**Variants:**
- `.nav-flash-badge--desktop`: Top-right positioning
- `.nav-flash-badge--mobile`: Smaller, adjusted positioning

**Usage:** New content notifications on navigation items

### Cards

#### Glass Card (`.glass-card`)
```css
/* Standard glass morphism card */
background: var(--gradient-glass);
backdrop-filter: blur(20px);
border: 1px solid var(--border-primary);
border-radius: 20px;
box-shadow: var(--shadow-lg);
```

**States:**
- Hover: Accent border, glow shadow, lifts 4px

**Variants:**
- `.glass-card.minimal-hover`: No lift, subtle border change only

**Usage:** Content containers, panels

#### Show Card (`.show-card-modern`)
```css
/* TV show/movie card */
background: var(--gradient-card);
backdrop-filter: blur(20px);
border: 1px solid var(--border-primary);
border-radius: 24px;
box-shadow: var(--shadow-lg);
```

**States:**
- Hover: Lifts 2px, accent border

**Usage:** TV show and movie cards

### Badges

#### Rating Badge (`.rating-badge`)
```css
/* IMDb rating display */
background: transparent;
border: 1px solid rgba(245, 197, 24, 0.9);
border-radius: 9999px;
padding: 0.375rem 0.6rem;
position: absolute;
top: 1rem;
right: 1rem;
```

**Usage:** Show card rating display

#### NEW Badge (`.new-badge`)
```css
/* New content indicator */
background: linear-gradient(135deg, rgba(250, 204, 21, 0.52) 0%, rgba(250, 204, 21, 0.36) 100%);
color: black;
border-radius: 0.75rem;
padding: 0.375rem 0.75rem;
font-size: 0.625rem (10px);
backdrop-filter: blur(10px);
box-shadow: var(--shadow-md), 0 0 18px rgba(245, 158, 11, 0.35);
```

**States:**
- Hover: Enhanced glow shadow

**Usage:** New season indicators

### Forms

#### Search Input (`.search-input`)
```css
/* Search field styling */
background: var(--bg-glass);
border: 1px solid var(--border-primary);
border-radius: 1rem;
padding: 0.75rem 1rem;
backdrop-filter: blur(10px);
```

**States:**
- Focus: Accent border, subtle glow

**Usage:** Search panels, filter inputs

#### Filter Chips (`.chip`)
```css
/* Filter tag styling */
background: var(--bg-glass);
border: 1px solid var(--border-primary);
border-radius: 9999px;
padding: 0.375rem 0.75rem;
font-size: 0.75rem;
backdrop-filter: blur(10px);
```

**States:**
- Hover: Accent border, lifts 1px
- Active: Yellow gradient background with glow

**Usage:** Genre filters, streaming service filters

#### Range Slider (`.slider`)
```css
/* Custom range input */
background: var(--bg-tertiary);
height: 6px;
border-radius: 3px;
```

**Thumb:**
```css
background: var(--gradient-primary);
height: 20px;
width: 20px;
border-radius: 50%;
box-shadow: var(--shadow-md);
```

**Usage:** Year range filters, rating filters

### Special Elements

#### Hero Section (`.hero-section`)
```css
/* Landing hero with gradient background */
padding: clamp(3.5rem, 12vw, 7.5rem) 0 clamp(2rem, 6vw, 4rem);
position: relative;
```

**Elements:**
- `.hero-headline`: Large uppercase title with yellow glow
- `.hero-subtitle`: Secondary description text
- `.hero-scroll-btn`: Animated scroll indicator button

**Usage:** Homepage hero section

#### Provider Logos (`.provider-logo`)
```css
/* Streaming service logo container */
display: flex;
align-items: center;
justify-content: center;
min-height: 1.35rem;
```

**Logo Classes:**
- `.logo-netflix`: Red (#e50914)
- `.logo-prime`: Blue (#00a8e1)
- `.logo-disney`: Light blue (#44a1ff)
- `.logo-hbo`, `.logo-max`: Purple (#8566ff)
- `.logo-apple`: White (#f5f5f5)
- `.logo-hulu`: Green (#1ce783)
- `.logo-paramount`: Sky blue (#5bb4ff)
- `.logo-peacock`: Yellow (#facc15)
- `.logo-generic`: Secondary text color

**Usage:** Show card streaming availability

---

## 🎭 Animations

### Fade In (`.animate-fade-in`)
```css
animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
/* Fades in with slight upward movement */
```

### Fade Out (`.animate-fade-out`)
```css
animation: fadeOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
/* Fades out with slight upward movement */
```

### Slide Up (`.animate-slide-up`)
```css
animation: slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
/* Slides up from below with fade */
```

### Scale In (`.animate-scale-in`)
```css
animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
/* Scales from 90% to 100% with fade */
```

### Glow Pulse (`.animate-glow-pulse`)
```css
animation: glowPulse 2s ease-in-out infinite;
/* Pulsing glow effect */
```

### Float (`.animate-float`)
```css
animation: float 6s ease-in-out infinite;
/* Gentle floating motion */
```

### Success Bounce (`.animate-success-bounce`)
```css
animation: successBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
/* Bouncy success animation */
```

### Count Pop (`.animate-count-pop`)
```css
animation: countPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
/* Number counter pop effect */
```

### Shimmer (`.animate-shimmer`)
```css
animation: shimmer 2s linear infinite;
/* Loading shimmer effect */
```

---

## 📐 Spacing System

### Padding/Margin Scale
- `0.25rem` (4px) - xs
- `0.5rem` (8px) - sm
- `0.75rem` (12px) - md
- `1rem` (16px) - base
- `1.25rem` (20px) - lg
- `1.5rem` (24px) - xl
- `2rem` (32px) - 2xl
- `2.5rem` (40px) - 3xl
- `3rem` (48px) - 4xl

### Border Radius
- `0.25rem` (4px) - sm
- `0.5rem` (8px) - base
- `0.75rem` (12px) - md
- `1rem` (16px) - lg
- `1.25rem` (20px) - xl
- `1.5rem` (24px) - 2xl
- `9999px` - full (pill shape)

---

## 🎯 Usage Guidelines

### When to Use Each Button Type

1. **Primary Button (`.btn-modern`)**
   - Main call-to-action
   - Form submissions
   - Important actions (Sign In, Sign Up)

2. **Secondary Button (`.btn-secondary`)**
   - Cancel actions
   - Alternative options
   - Less important actions

3. **Action Button (`.action-btn`)**
   - Show card interactions
   - Rating actions
   - Watchlist toggles
   - Quick actions

4. **Filter Button (`.filter-btn`)**
   - Sidebar filter options
   - Multi-select filters

### Color Usage Best Practices

1. **Maintain Contrast**: Ensure text has sufficient contrast against backgrounds
2. **Consistent Accent**: Use `--accent-primary` for all primary interactive elements
3. **Semantic Colors**: Use success/warning/danger colors appropriately
4. **Glass Effects**: Use for overlays and floating elements

### Accessibility

1. **Focus States**: All interactive elements have visible focus indicators
2. **Touch Targets**: Minimum 44px height on mobile for buttons
3. **Color Contrast**: All text meets WCAG AA standards
4. **Keyboard Navigation**: All interactive elements are keyboard accessible

### Responsive Design

1. **Mobile First**: Base styles optimized for mobile
2. **Breakpoints**:
   - Mobile: < 640px
   - Tablet: 640px - 768px
   - Desktop: > 768px
3. **Font Scaling**: Automatic font size reduction on mobile
4. **Touch Optimization**: Larger touch targets on mobile

---

## 🔧 Maintenance

### Adding New Colors
1. Add CSS variable to `:root` in [`globals.css`](globals.css:6-40)
2. Document in this file
3. Update Tailwind config if needed

### Adding New Components
1. Create component class in [`globals.css`](globals.css:78-796)
2. Document usage in this file
3. Add examples to component files

### Modifying Existing Styles
1. Update CSS variable or component class
2. Test across all breakpoints
3. Update documentation
4. Check for breaking changes in components

---

## 📚 Related Files

- [`globals.css`](globals.css) - Main stylesheet with all design tokens
- [`tailwind.config.ts`](../tailwind.config.ts) - Tailwind configuration
- [`layout.tsx`](../src/app/layout.tsx) - Root layout with font loading

---

## 🐛 Known Issues

1. **Font Loading**: Inter font is referenced but not properly imported
   - **Fix**: Add Google Fonts link or use next/font/google
   
2. **Tailwind Config Mismatch**: Tailwind config has outdated color values
   - **Fix**: Align with CSS variables in globals.css

3. **Missing Design Tokens**: Some values are hardcoded in components
   - **Fix**: Extract to CSS variables for consistency

---

*Last Updated: 2025-10-23*