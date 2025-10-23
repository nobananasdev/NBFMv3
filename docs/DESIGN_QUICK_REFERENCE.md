# Design System Quick Reference

Quick reference guide for the most commonly used design elements.

---

## 🎨 Colors

### Most Used Colors
```css
/* Backgrounds */
--bg-primary: #060b13
--bg-glass: rgba(13, 20, 33, 0.75)

/* Accents */
--accent-primary: #f5b400  /* Yellow - main brand */
--accent-success: #38d49b  /* Green */
--accent-danger: #ef4444   /* Red */

/* Text */
--text-primary: #f8fafc    /* Bright white */
--text-secondary: #d5dae6  /* Medium gray */
--text-tertiary: #94a3b8   /* Dim gray */
```

---

## 🔘 Buttons

```tsx
/* Primary Action */
<button className="btn-modern">Sign In</button>

/* Secondary Action */
<button className="btn-secondary">Cancel</button>

/* Action Button (transparent) */
<button className="action-btn">Action</button>

/* Watchlist Button */
<button className="action-btn watchlist-btn">Watchlist</button>

/* Rating Buttons */
<button className="action-btn rate-good">Like</button>
<button className="action-btn rate-mid">Meh</button>
<button className="action-btn rate-bad">Dislike</button>

/* Filter Button */
<button className="filter-btn">Genre</button>
```

---

## 🃏 Cards

```tsx
/* Glass Card */
<div className="glass-card p-6">Content</div>

/* Show Card */
<div className="show-card-modern">Content</div>

/* Minimal Hover Card */
<div className="glass-card minimal-hover p-6">Content</div>
```

---

## 🧭 Navigation

```tsx
/* Navigation Pill */
<button className="nav-pill">Tab</button>
<button className="nav-pill active">Active Tab</button>

/* With Badge */
<div className="relative">
  <button className="nav-pill">Watchlist</button>
  <span className="nav-flash-badge nav-flash-badge--desktop">3</span>
</div>
```

---

## 🏷️ Badges

```tsx
/* Rating Badge */
<div className="rating-badge">8.5</div>

/* NEW Badge */
<span className="new-badge">NEW</span>
```

---

## 📝 Forms

```tsx
/* Search Input */
<input type="text" className="search-input" placeholder="Search..." />

/* Filter Chip */
<button className="chip">Genre</button>
<button className="chip active">Selected</button>

/* Range Slider */
<input type="range" className="slider" min="0" max="100" />
```

---

## 🎭 Animations

```tsx
<div className="animate-fade-in">Fade In</div>
<div className="animate-slide-up">Slide Up</div>
<div className="animate-scale-in">Scale In</div>
<div className="animate-success-bounce">Success!</div>
<div className="skeleton h-48 w-full">Loading...</div>
```

---

## 📐 Spacing

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  12px  (0.75rem)
base: 16px (1rem)
lg:  20px  (1.25rem)
xl:  24px  (1.5rem)
2xl: 32px  (2rem)
3xl: 40px  (2.5rem)
4xl: 48px  (3rem)
```

---

## 🔤 Typography

```tsx
/* Font Sizes */
text-xs    12px
text-sm    14px
text-base  16px
text-lg    18px
text-xl    20px
text-2xl   24px
text-3xl   30px
text-4xl   36px

/* Font Weights */
font-normal    400
font-medium    500
font-semibold  600
font-bold      700
font-extrabold 800
```

---

## 📱 Breakpoints

```
mobile:  < 640px
tablet:  640px - 768px
desktop: > 768px
```

```tsx
/* Mobile First */
<div className="text-sm sm:text-base md:text-lg">
  Responsive Text
</div>
```

---

## 🎨 Gradients

```tsx
/* Primary Gradient (Yellow) */
className="bg-gradient-to-br from-accent-primary to-accent-secondary"

/* Card Gradient */
className="bg-gradient-to-br from-bg-secondary to-bg-tertiary"
```

---

## 🔧 Common Patterns

### Button with Icon
```tsx
<button className="action-btn flex items-center gap-2">
  <Image src="/icons/icon.svg" width={24} height={24} alt="" />
  <span>Label</span>
</button>
```

### Card with Image
```tsx
<div className="show-card-modern overflow-hidden">
  <Image src={poster} width={300} height={450} alt={title} />
  <div className="p-4">
    <h3 className="text-lg font-semibold">{title}</h3>
  </div>
</div>
```

### Modal
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="modal-panel max-w-md w-full mx-4 p-6">
    Content
  </div>
</div>
```

### Grid Layout
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

---

## 💡 Pro Tips

1. **Always use CSS classes** instead of inline styles when possible
2. **Mobile-first approach**: Start with mobile styles, add larger breakpoints
3. **Use design tokens** from [`designTokens.ts`](../src/lib/designTokens.ts) for consistency
4. **Maintain accessibility**: Ensure proper focus states and contrast
5. **Test on mobile**: Minimum 44px touch targets

---

## 📚 Full Documentation

- [Complete Design System](DESIGN_SYSTEM.md)
- [Usage Examples](DESIGN_USAGE_EXAMPLES.md)
- [Design Tokens](../src/lib/designTokens.ts)
- [Global Styles](../src/app/globals.css)
- [Tailwind Config](../tailwind.config.ts)

---

*Last Updated: 2025-10-23*