/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans    : ["'Inter'", 'sans-serif'],
        display : ["'Plus Jakarta Sans'", 'sans-serif'],
      },
      colors: {
        brand: {
          50 : '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },
      boxShadow: {
        'cyan'   : '0 4px 14px rgba(6,182,212,0.35)',
        'cyan-lg': '0 8px 24px rgba(6,182,212,0.45)',
        'card'   : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(6,182,212,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in'   : 'fadeIn 0.4s ease both',
        'fade-up'   : 'fadeInUp 0.5s ease both',
        'slide-right': 'slideInRight 0.4s ease both',
        'float'     : 'float 3s ease-in-out infinite',
        'spin-slow' : 'spin-slow 10s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn       : { from: { opacity:0 },                        to: { opacity:1 } },
        fadeInUp     : { from: { opacity:0, transform:'translateY(20px)' }, to: { opacity:1, transform:'translateY(0)' } },
        slideInRight : { from: { opacity:0, transform:'translateX(30px)' }, to: { opacity:1, transform:'translateX(0)' } },
        float        : { '0%,100%': { transform:'translateY(0)' },   '50%': { transform:'translateY(-6px)' } },
        pulseGlow    : { '0%,100%': { boxShadow:'0 0 0 0 rgba(6,182,212,0.3)' }, '50%': { boxShadow:'0 0 0 8px rgba(6,182,212,0)' } },
        'spin-slow'  : { from: { transform:'rotate(0deg)' },         to: { transform:'rotate(360deg)' } },
      },
    },
  },
  plugins: [],
};
