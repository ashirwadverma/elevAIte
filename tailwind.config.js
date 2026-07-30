/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#060816',
        glow: '#7c3aed',
        violet: '#8b5cf6'
      },
      boxShadow: {
        soft: '0 20px 45px rgba(139, 92, 246, 0.15)'
      }
    }
  },
  plugins: []
};