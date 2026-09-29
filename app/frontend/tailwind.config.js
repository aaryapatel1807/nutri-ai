/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand': '#15B2CF',
        'brand-deep': '#0D7F9B',
        'brand-soft': '#B5E5F2',
        'brand-glow': '#4FD3ED',
        'ink': '#1C1917',
        'paper': '#F5F1E8',
        'violet-pop': '#7B61FF',
        'sky-pop': '#3B82F6',
        /* Aurora Pop multicolor system */
        'pop': {
          coral: '#FF6B5E',
          'coral-deep': '#E14E42',
          'coral-soft': '#FFD9D4',
          amber: '#FFB020',
          'amber-deep': '#D98A06',
          'amber-soft': '#FFE9C2',
          violet: '#7B61FF',
          'violet-deep': '#5B3DF0',
          'violet-soft': '#DDD3FF',
          indigo: '#5B5BD6',
          'indigo-deep': '#4343B8',
          'indigo-soft': '#D5D5F5',
          cyan: '#22D3EE',
          'cyan-deep': '#0E9DB8',
          'cyan-soft': '#C8F3FA',
          lime: '#9DCE2C',
          'lime-deep': '#7AA81E',
          'lime-soft': '#E4F4C4',
        },
        /* shadcn tokens — driven by CSS variables in globals.css (warm-tinted for NutriAI) */
        'background': 'oklch(var(--background) / <alpha-value>)',
        'foreground': 'oklch(var(--foreground) / <alpha-value>)',
        'card': {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        'popover': {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        'primary': {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        'secondary': {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        'muted': {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        'accent': {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        'destructive': 'oklch(var(--destructive) / <alpha-value>)',
        'border': 'var(--border)',
        'input': 'oklch(var(--input) / <alpha-value>)',
        'ring': 'oklch(var(--ring) / <alpha-value>)',
      },
      fontFamily: { 
        display: ['Clash Display', 'sans-serif'], 
        body: ['Satoshi', 'sans-serif'] 
      },
    },
  },
  plugins: [],
}
