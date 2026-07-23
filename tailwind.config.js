/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#060816',
        glow: '#7c3aed',
        cyan: '#22d3ee'
      },
      boxShadow: {
        soft: '0 20px 45px rgba(34, 211, 238, 0.15)'
      }
    }
  },
  plugins: []
};