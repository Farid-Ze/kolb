/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zenotika: {
          primary: '#10b981',
          primaryDark: '#059669',
          secondary: '#0f172a',
          secondaryAccent: '#1e293b',
          accent: '#f59e0b',
        },
      },
      fontFamily: {
        brand: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(15, 23, 42, 0.65)',
      },
    },
  },
  plugins: [],
}
