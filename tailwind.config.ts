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
        shake: 'shake 0.4s ease-in-out 1',
        floatUp: 'floatUp 0.8s ease-out forwards',
        pulseGlow: 'pulseGlow 1.5s ease-in-out infinite',
        attackLunge: 'attackLunge 0.4s ease-in-out 1',
        attackLungeLeft: 'attackLungeLeft 0.4s ease-in-out 1',
        hurtFlash: 'hurtFlash 0.3s ease-in-out 1',
        slideInLeft: 'slideInLeft 0.5s ease-out 1',
        slideInRight: 'slideInRight 0.5s ease-out 1',
        pathFlow: 'pathFlow 2s linear infinite'
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
        },
        floatUp: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(1.2)', opacity: '0' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 16px 8px rgba(245, 158, 11, 0)' }
        },
        attackLunge: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(40px) scale(1.05)' },
          '100%': { transform: 'translateX(0)' }
        },
        attackLungeLeft: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-40px) scale(1.05)' },
          '100%': { transform: 'translateX(0)' }
        },
        hurtFlash: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.6) saturate(0.5)' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        pathFlow: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
