import type { Config } from 'tailwindcss';

const color = (name: string) => `rgb(var(--rgb-${name}) / <alpha-value>)`;
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: color('primary'),
        'on-primary': color('on-primary'),
        'on-secondary': color('on-secondary'),
        'primary-strong': color('primary-strong'),
        'primary-hover': color('primary-hover'),
        secondary: color('secondary'),
        accent: color('accent'),
        canvas: color('canvas'),
        surface: color('surface'),
        border: color('border'),
        ink: color('ink'),
        muted: color('muted'),
        subtle: color('subtle'),
        success: color('success'),
        warning: color('warning'),
        danger: color('danger'),
        info: color('info'),
      },
      fontFamily: { sans: ['var(--font-sans)', 'sans-serif'], display: ['var(--font-display)', 'sans-serif'], mono: ['var(--font-mono)', 'monospace'] },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-relaxed)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-snug)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
        '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)' }],
      },
      spacing: { section: 'var(--space-section)', container: 'var(--space-container)', 18: '4.5rem', 22: '5.5rem' },
      borderRadius: { xs: 'var(--radius-xs)', sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)', '2xl': 'var(--radius-2xl)' },
      boxShadow: { soft: 'var(--shadow-soft)', card: 'var(--shadow-card)', elevated: 'var(--shadow-elevated)', focus: 'var(--shadow-focus)' },
      transitionTimingFunction: { premium: 'var(--ease-premium)' },
      transitionDuration: { 250: '250ms', 350: '350ms' },
      keyframes: { 'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } } },
      animation: { 'accordion-down': 'accordion-down 200ms ease-out' },
    },
  },
  plugins: [],
};
export default config;
