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
          '"Avenir Next"',
          '"SF Pro Display"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        'light-bg': '#F6F3EC',
        'light-panel': '#FFFDF7',
        'light-text': '#17201D',
        'light-subtle-text': '#59635F',
        'light-border': '#E6DED0',
        'light-header': '#FFFDF7',
        'dark-bg': '#101815',
        'dark-panel': '#18231F',
        'dark-text': '#EEF4EF',
        'dark-subtle-text': '#A9B7AF',
        'dark-border': '#2B3A33',
        'dark-header': '#16201C',
        'primary': '#0F766E',
        'primary-hover': '#0D9488',
        'primary-disabled': '#99F6E4',
        'light-hover': '#EFE8DA',
        'dark-hover': '#23332D',
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
