/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        receipt: {
          bg: '#F8F4EF',
          card: '#FFFFFF',
          border: '#E0D9D0',
          dash: '#C8BFB5',
        },
        brand: {
          50: '#FFF3EE',
          100: '#FFE4D6',
          200: '#FFC5A8',
          300: '#FF9A72',
          400: '#FF6B35',
          500: '#E8572A',
          600: '#C94520',
          700: '#A33418',
        },
      },
      fontFamily: {
        receipt: ['"Courier New"', 'Courier', 'monospace'],
      },
      boxShadow: {
        receipt: '0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'receipt-lg': '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

