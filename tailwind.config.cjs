/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#07111C',
          900: '#0A1929',
          800: '#0F1E2F',
          700: '#1A2B3D',
        },
        porcelain: {
          100: '#E8EDF2',
          200: '#748A9D',
        },
        verified: '#2A9D8F',
        flagged: '#E63946',
        pending: '#F4A261',
        },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
