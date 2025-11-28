/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        pastel: {
          pink: '#fce7f3',
          blue: '#dbeafe',
          green: '#d1fae5',
          yellow: '#fef3c7',
          purple: '#e9d5ff',
        }
      }
    },
  },
  plugins: [],
}