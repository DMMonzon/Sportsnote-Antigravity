/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './views/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6d5dfc',
        onPrimary: '#ffffff',
        secondary: '#c6ff00',
        onSecondary: '#1c1236',
        surface: '#f4f4f7',
        brandDark: '#1c1236',
        brandGlass: 'rgba(255, 255, 255, 0.12)',
        textLow: 'rgba(255, 255, 255, 0.7)',
        textMuted: '#6b7280',
      },
      screens: {
        xs: '480px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'], // Para textos generales y subtítulos
        display: ['"Montserrat"', '"Plus Jakarta Sans"', 'sans-serif'], // Para títulos pesados como EQUIPOS
        mono: ['"JetBrains Mono"', 'monospace'],
        contrail: ['"Montserrat"', '"Plus Jakarta Sans"', 'sans-serif'],
        lato: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'md3': '28px',
      },
    },
  },
  plugins: [],
};
