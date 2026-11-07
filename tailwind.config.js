/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8fe8',
          600: '#0270c5',
          700: '#0359a0',
          800: '#074c83',
          900: '#0c406d',
          950: '#082848',
        },
      },
    },
  },
  plugins: [],
};
