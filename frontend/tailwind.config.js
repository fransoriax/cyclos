/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f5',
          100: '#e1ede6',
          200: '#c5dcd0',
          300: '#9bc2b2',
          400: '#6da08d',
          500: '#4e8371',
          600: '#3c6959',
          700: '#325449',
          800: '#2a443c',
          900: '#243932',
          950: '#0f1c18', // Deepest emerald-black
        },
        accentGreen: {
          300: '#6ee7b7', // Sage glow
          400: '#34d399', // Mint glow
          500: '#10b981', // Radiant Emerald
          600: '#059669',
        },
        darkBg: {
          pure: '#060a08', // Pure organic darkness
          card: '#0f1713', // Notion/Linear glass-like card background
          hover: '#192520', // Hover card background
          border: '#1b2c24', // Subtle leaf-vein borders
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-emerald-lg': '0 0 25px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
