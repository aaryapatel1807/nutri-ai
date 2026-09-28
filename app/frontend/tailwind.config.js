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
        'brand': '#F97316',
        'brand-deep': '#EA580C',
        'brand-soft': '#FDBA74',
        'brand-glow': '#FB923C',
        'ink': '#1C1917',
        'muted': '#78716C',
        'paper': '#F5F1E8',
        'card': 'rgba(255,255,255,0.62)',
        'violet-pop': '#7B61FF',
        'sky-pop': '#3B82F6',
      },
      fontFamily: { 
        display: ['Clash Display', 'sans-serif'], 
        body: ['Satoshi', 'sans-serif'] 
      },
    },
  },
  plugins: [],
}
