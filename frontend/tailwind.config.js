/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kisan: {
          50: '#f2fbf4',
          100: '#e1f6e6',
          200: '#c4edd0',
          300: '#95deab',
          400: '#5ec57e',
          500: '#38a95c',
          600: '#288847',
          700: '#226c3a',
          800: '#1e5631',
          900: '#19472a',
          950: '#0a2715',
        },
        earth: {
          50: '#faf6f0',
          100: '#f3ece0',
          200: '#e6d8c0',
          300: '#d5bd9b',
          400: '#c39f75',
          500: '#b48558',
          600: '#a6724b',
          700: '#8a5b3e',
          800: '#714b36',
          900: '#5c3e2e',
        }
      },
    },
  },
  plugins: [],
};
