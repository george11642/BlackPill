/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-black': '#0F0F1E',
        'dark-gray': '#1A1A2E',
        'charcoal': '#2A2A3E',
        'neon-pink': '#FF0080',
        'neon-cyan': '#00D9FF',
        'neon-purple': '#B700FF',
        'neon-yellow': '#FFFF00',
        'neon-green': '#00FF41',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B8BACC',
        'text-tertiary': '#6B6D7F',
        'text-disabled': '#4A4C5A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

