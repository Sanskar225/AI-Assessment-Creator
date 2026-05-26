/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF0E8',
          100: '#FFD9BF',
          400: '#F97316',
          500: '#E8510A',
          600: '#D14608',
        },
        sidebar: '#1A1A1A',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
};
