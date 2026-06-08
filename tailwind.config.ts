import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0fe',
          100: '#e4e3fd',
          200: '#ccc9fb',
          300: '#aba6f7',
          400: '#857ff1',
          500: '#6d67e8',
          600: '#5b5bd6',
          700: '#4c4cbf',
          800: '#3f3f9c',
          900: '#34347e',
          950: '#1e1e50',
        },
      },
    },
  },
  plugins: [],
}
export default config
