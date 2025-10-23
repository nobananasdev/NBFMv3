import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Background colors
        bg: {
          primary: '#060b13',
          secondary: '#101826',
          tertiary: '#1a2535',
          glass: 'rgba(13, 20, 33, 0.75)',
          'glass-hover': 'rgba(23, 32, 48, 0.85)',
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
      },
      boxShadow: {
        sm: '0 1px 2px rgba(9, 12, 20, 0.6)',
        md: '0 8px 20px rgba(6, 11, 19, 0.45)',
        lg: '0 18px 40px rgba(5, 9, 16, 0.55)',
        xl: '0 30px 60px rgba(3, 6, 12, 0.65)',
        glow: '0 0 28px rgba(245, 180, 0, 0.35)',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      transitionProperty: {
        all: 'all',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        ease: 'ease',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fadeOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'success-bounce': 'successBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'count-pop': 'countPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(-6px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        successBounce: {
          '0%': { opacity: '0', transform: 'scale(0.3) translateY(20px)' },
          '50%': { opacity: '1', transform: 'scale(1.1) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        countPop: {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config