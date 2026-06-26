import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        chinese: { 100: '#dcfce7', 500: '#22c55e', 700: '#15803d' },
        math: { 100: '#dbeafe', 500: '#3b82f6', 700: '#1d4ed8' },
        english: { 100: '#fef9c3', 500: '#eab308', 700: '#a16207' }
      },
      animation: {
        bounceShort: 'bounceShort 0.5s ease-in-out 1',
        shake: 'shake 0.4s ease-in-out 1'
      },
      keyframes: {
        bounceShort: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
