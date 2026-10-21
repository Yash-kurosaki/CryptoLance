/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Core palette
        bg: {
          primary: '#0a0a0f',
          secondary: '#0f0f1a',
          card: '#13131f',
          hover: '#1a1a2e',
        },
        brand: {
          purple: '#7c3aed',
          violet: '#8b5cf6',
          pink: '#ec4899',
          cyan: '#06b6d4',
          green: '#10b981',
        },
        border: {
          subtle: 'rgba(124, 58, 237, 0.15)',
          active: 'rgba(124, 58, 237, 0.4)',
        },
        text: {
          primary: '#f1f0ff',
          secondary: '#a09ab5',
          muted: '#6b6580',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(236,72,153,0.05) 100%)',
        'gradient-hero': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.3) 0%, transparent 60%)',
      },
      boxShadow: {
        'brand': '0 0 30px rgba(124, 58, 237, 0.2)',
        'brand-sm': '0 0 15px rgba(124, 58, 237, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 60px rgba(124, 58, 237, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
    },
  },
  plugins: [],
};
