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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#FFFDF5',
        card: '#ffffff',
      },
      boxShadow: {
        card: '3px 3px 0px 0px #323232',
        'card-hover': '6px 6px 0px 0px #323232',
        'button-hover': '0 8px 16px rgba(0, 0, 0, 0.15)',
        'button-elevated': '0 12px 24px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        card: '20px',
        button: '8px',
      },
      transitionProperty: {
        'all': 'all',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'ease': 'ease',
        'ease-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}
export default config