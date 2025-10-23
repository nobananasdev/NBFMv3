/**
 * Design Tokens
 * 
 * Centralized design system tokens for consistent styling across the application.
 * These tokens match the CSS variables defined in globals.css
 * 
 * @see docs/DESIGN_SYSTEM.md for complete documentation
 */

export const colors = {
  // Background colors
  bg: {
    primary: '#060b13',
    secondary: '#101826',
    tertiary: '#1a2535',
    glass: 'rgba(13, 20, 33, 0.75)',
    glassHover: 'rgba(23, 32, 48, 0.85)',
  },
  
  // Accent colors
  accent: {
    primary: '#f5b400',
    secondary: '#facc15',
    success: '#38d49b',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  
  // Text colors
  text: {
    primary: '#f8fafc',
    secondary: '#d5dae6',
    tertiary: '#94a3b8',
    accent: '#fde68a',
  },
  
  // Border colors
  border: {
    primary: 'rgba(148, 163, 184, 0.18)',
    secondary: 'rgba(148, 163, 184, 0.1)',
    accent: 'rgba(245, 180, 0, 0.45)',
  },
} as const

export const shadows = {
  sm: '0 1px 2px rgba(9, 12, 20, 0.6)',
  md: '0 8px 20px rgba(6, 11, 19, 0.45)',
  lg: '0 18px 40px rgba(5, 9, 16, 0.55)',
  xl: '0 30px 60px rgba(3, 6, 12, 0.65)',
  glow: '0 0 28px rgba(245, 180, 0, 0.35)',
} as const

export const gradients = {
  primary: 'linear-gradient(135deg, #f5b400 0%, #facc15 100%)',
  secondary: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  card: 'linear-gradient(155deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.82) 100%)',
  glass: 'linear-gradient(155deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.6) 100%)',
  rating: 'linear-gradient(135deg, rgba(56, 212, 155, 0.24) 0%, rgba(14, 165, 129, 0.18) 100%)',
} as const

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  base: '1rem',    // 16px
  lg: '1.25rem',   // 20px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '2.5rem', // 40px
  '4xl': '3rem',   // 48px
} as const

export const borderRadius = {
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.75rem',// 28px
  '4xl': '2rem',   // 32px
  full: '9999px',  // pill shape
} as const

export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
} as const

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.6,
  loose: 2,
} as const

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    normal: '300ms',
    slow: '400ms',
    slower: '500ms',
  },
  timing: {
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
} as const

/**
 * Streaming service logo colors
 */
export const streamingColors = {
  netflix: '#e50914',
  prime: '#00a8e1',
  disney: '#44a1ff',
  hbo: '#8566ff',
  max: '#8566ff',
  apple: '#f5f5f5',
  hulu: '#1ce783',
  paramount: '#5bb4ff',
  peacock: '#facc15',
  generic: colors.text.secondary,
} as const

/**
 * Component-specific tokens
 */
export const components = {
  button: {
    minHeight: {
      mobile: '44px',
      desktop: '40px',
    },
    padding: {
      sm: '0.5rem 1rem',
      base: '0.75rem 1.5rem',
      lg: '1rem 2rem',
    },
  },
  card: {
    borderRadius: {
      mobile: '16px',
      desktop: '20px',
    },
    padding: {
      sm: '1rem',
      base: '1.5rem',
      lg: '2rem',
    },
  },
  input: {
    height: {
      sm: '36px',
      base: '44px',
      lg: '52px',
    },
    padding: '0.75rem 1rem',
  },
} as const

/**
 * Animation durations
 */
export const animations = {
  fadeIn: '0.6s',
  fadeOut: '0.22s',
  slideUp: '0.8s',
  scaleIn: '0.5s',
  glowPulse: '2s',
  float: '6s',
  successBounce: '0.6s',
  countPop: '0.6s',
  shimmer: '2s',
} as const

/**
 * Z-index layers
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const

/**
 * Helper function to get CSS variable reference
 */
export const cssVar = (name: string): string => `var(--${name})`

/**
 * Helper function to create rgba color with custom opacity
 */
export const withOpacity = (color: string, opacity: number): string => {
  // If color is already rgba, replace opacity
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`)
  }
  // If hex color, convert to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return color
}

/**
 * Type exports for TypeScript support
 */
export type ColorToken = typeof colors
export type ShadowToken = typeof shadows
export type GradientToken = typeof gradients
export type SpacingToken = typeof spacing
export type BorderRadiusToken = typeof borderRadius
export type FontSizeToken = typeof fontSize
export type FontWeightToken = typeof fontWeight
export type LineHeightToken = typeof lineHeight
export type TransitionToken = typeof transitions
export type BreakpointToken = typeof breakpoints
export type StreamingColorToken = typeof streamingColors
export type ComponentToken = typeof components
export type AnimationToken = typeof animations
export type ZIndexToken = typeof zIndex