const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        prism: {
          midnight: '#110b21',
          violet: '#8730f8',
          ember: '#f97316',
          aurora: '#ff6a00'
        }
      }
    }
  },
  plugins: []
};
