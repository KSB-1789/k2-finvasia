/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cabinet Grotesk"', '"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Clash Display"', '"Cabinet Grotesk"', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0C0C10',
          50:  '#F4F4F6',
          100: '#E8E8ED',
          200: '#C5C5D0',
          300: '#9898AA',
          400: '#6B6B80',
          500: '#4A4A5C',
          600: '#2E2E3A',
          700: '#1E1E28',
          800: '#141418',
          900: '#0C0C10',
        },
        sage: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
          muted: '#14532D',
          dim: '#052e16',
        },
        violet: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          muted: '#4C1D95',
          dim: '#2e1065',
        },
        amber: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          muted: '#78350F',
          dim: '#451a03',
        },
        rose: {
          DEFAULT: '#F43F5E',
          light: '#FB7185',
          muted: '#881337',
          dim: '#4c0519',
        },
      },
      animation: {
        'in-up': 'inUp 0.3s ease both',
        'in-fade': 'inFade 0.25s ease both',
        'shimmer': 'shimmer 1.8s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        inUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        inFade: { from: { opacity: 0 }, to: { opacity: 1 } },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
}
