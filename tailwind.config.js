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
        nord: {
          polar: {
            deep: '#1A1E24',   // deep arctic fjord night
            night: '#242933',  // base background
            0: '#2E3440',      // surface / base dark
            1: '#3B4252',      // card surface
            2: '#434C5E',      // elevated / hover surface
            3: '#4C566A',      // muted divider / border
          },
          snow: {
            0: '#D8DEE9',      // muted text / mist
            1: '#E5E9F0',      // soft snow white
            2: '#ECEFF4',      // crisp bright snow
          },
          frost: {
            teal: '#8FBCBB',   // sea foam / glacier mint
            ice: '#88C0D0',    // signature frost blue
            blue: '#81A1C1',   // fjord soft blue
            deep: '#5E81AC',   // deep ocean blue
          },
          aurora: {
            red: '#BF616A',    // arctic berry red
            orange: '#D08770', // cloudberry orange
            yellow: '#EBCB8B', // birch wood honey amber
            green: '#A3BE8C',  // pine / moss sage green
            purple: '#B48EAD', // heather lavender
          },
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(36, 41, 51, 0.4)',
        'glass-hover': '0 12px 40px 0 rgba(36, 41, 51, 0.6)',
        'glow': '0 0 25px -5px rgba(136, 192, 208, 0.35)',
        'glow-aurora': '0 0 25px -5px rgba(163, 190, 140, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
