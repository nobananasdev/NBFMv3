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
      fontSize: {
        'xs-mobile': '8px',      // xs (12px) - 4px
        'sm-mobile': '10px',     // sm (14px) - 4px
        'base-mobile': '12px',   // base (16px) - 4px
        'lg-mobile': '14px',     // lg (18px) - 4px
        'xl-mobile': '16px',     // xl (20px) - 4px
        '2xl-mobile': '20px',    // 2xl (24px) - 4px
        '3xl-mobile': '26px',    // 3xl (30px) - 4px
        '4xl-mobile': '32px',    // 4xl (36px) - 4px
        '5xl-mobile': '44px',    // 5xl (48px) - 4px
        '6xl-mobile': '56px',    // 6xl (60px) - 4px
        '7xl-mobile': '68px',    // 7xl (72px) - 4px
        '8xl-mobile': '92px',    // 8xl (96px) - 4px
        '9xl-mobile': '124px',   // 9xl (128px) - 4px
      },
      colors: {
        background: '#FFFDF5',
        card: '#ffffff',
      },
      boxShadow: {
        card: '3px 3px 0px 0px #323232',
        'card-hover': '6px 6px 0px 0px #323232',
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