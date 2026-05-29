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
        'neon-green': '#00FF87',
        'electric-purple': '#7B61FF',
        'flame-orange': '#FF6B35',
        'bg-primary': '#0A0A0F',
        'bg-card': '#16161F',
      },
      fontFamily: { 
        display: ['Clash Display', 'sans-serif'], 
        body: ['Satoshi', 'sans-serif'] 
      },
    },
  },
  plugins: [],
}
