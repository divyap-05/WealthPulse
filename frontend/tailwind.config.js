/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#101014',
          surface: '#191820',
          card: '#22202C',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.04)',
        },
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          card: '#F1F5F9',
          border: 'rgba(0, 0, 0, 0.08)',
          hover: 'rgba(0, 0, 0, 0.04)',
        },
        brand: {
          primary: '#8B5CF6',   // Purple/Violet
          secondary: '#A78BFA', // Soft Lavender
          emerald: '#22C55E',   // Positive income / savings
          rose: '#F09AB5',      // Expense accent
          info: '#60A5FA',      // Info blue
          amber: '#FBBF24',     // Warning / alerts
        },
      },
    },
  },
  plugins: [],
};
