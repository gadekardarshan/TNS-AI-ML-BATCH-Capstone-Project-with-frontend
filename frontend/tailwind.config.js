/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0284C7',
          600: '#0284C7',
          700: '#0369A1',
          900: '#0C4A6E',
        },
      },
    },
  },
  plugins: [],
}
