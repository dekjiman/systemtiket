import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        },
        primary: {
          50: '#EEF0FF',
          100: '#D7DAFF',
          200: '#B4B9FF',
          300: '#8E94FF',
          400: '#6C5CE7',
          500: '#5A4BD1',
          600: '#4A3CB3',
          700: '#3D2F94',
          800: '#34277C',
          900: '#2D2263',
        },
        accent: {
          DEFAULT: '#00D1B2',
          hover: '#00E6C2',
        },
        dark: {
          50: '#F7F8FC',
          100: '#EEF0F5',
          200: '#DDE0ED',
          300: '#AAB0D5',
          400: '#8890B5',
          500: '#6C71A5',
          600: '#4A4E7A',
          700: '#3A3D63',
          800: '#2A2D4B',
          900: '#1F2240',
          950: '#171A2F',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(108, 92, 231, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
