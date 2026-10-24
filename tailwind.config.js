/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e3a5f',
          900: '#0f2442',
          950: '#071526',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        tealAccent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 36, 66, 0.05), 0 1px 2px -1px rgba(15, 36, 66, 0.05)',
        'card': '0 4px 6px -1px rgba(15, 36, 66, 0.05), 0 2px 4px -2px rgba(15, 36, 66, 0.05)',
        'elevated': '0 10px 15px -3px rgba(15, 36, 66, 0.08), 0 4px 6px -4px rgba(15, 36, 66, 0.03)',
        'glow-teal': '0 0 20px -3px rgba(20, 184, 166, 0.35)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
      }
    },
  },
  plugins: [],
}
