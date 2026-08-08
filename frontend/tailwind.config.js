/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Classy B2B custom color palette
        navy: {
          DEFAULT: '#102A43',
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          900: '#102A43',
        },
        ivory: {
          DEFAULT: '#F7F6F2',
        },
        emerald: {
          brand: '#176B4D',
          light: '#E8F3EE',
        },
        text: {
          primary: '#17212B',
          secondary: '#667085',
        },
        border: {
          brand: '#E5E7EB',
        },
        warning: {
          brand: '#B7791F',
        },
        danger: {
          brand: '#C94A4A',
        },
        // Map standard tailwind brand classes to emerald
        brand: {
          50: '#E8F3EE',
          100: '#D1E6DD',
          200: '#A3CDBB',
          500: '#176B4D',
          600: '#13583F',
          700: '#0F4532',
          900: '#102A43',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
