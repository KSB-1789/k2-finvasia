/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        k2: {
          bg: '#0A0A0F',
          card: '#111118',
          border: '#1E1E2E',
          purple: '#8B5CF6',
          'purple-light': '#A78BFA',
          green: '#10B981',
          'green-light': '#34D399',
          coral: '#F43F5E',
          'coral-light': '#FB7185',
          gold: '#F59E0B',
          cyan: '#06B6D4',
          muted: '#6B7280',
          text: '#E2E8F0',
          'text-dim': '#94A3B8',
        }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-purple': 'radial-gradient(at 40% 20%, hsla(270,60%,30%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,60%,25%,0.2) 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
