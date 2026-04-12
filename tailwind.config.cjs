module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        'light-bg': '#F9FAFB',
        'light-panel': '#FFFFFF',
        'light-text': '#111827',
        'light-subtle-text': '#6B7280',
        'light-border': '#E5E7EB',
        'light-header': '#FFFFFF',
        'dark-bg': '#111827',
        'dark-panel': '#1F2937',
        'dark-text': '#F3F4F6',
        'dark-subtle-text': '#9CA3AF',
        'dark-border': '#374151',
        'dark-header': '#1F2937',
        'primary': '#3B82F6',
        'primary-hover': '#2563EB',
        'primary-disabled': '#93C5FD',
        'light-hover': '#F3F4F6',
        'dark-hover': '#374151',
      },
      keyframes: {
        enter: {
          '0%': { opacity: 0, transform: 'translateY(1rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-bg': {
          '0%, 100%': { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
          '50%': { backgroundColor: 'rgba(59, 130, 246, 0.4)' },
        },
      },
      animation: {
        enter: 'enter 0.3s ease-out forwards',
        'pulse-bg': 'pulse-bg 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
