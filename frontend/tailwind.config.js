/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        groww: {
          green: "#00D09C",
          greenHover: "#00B386",
          greenLight: "#E8FAF4",
          red: "#EB5B3C",
          redHover: "#D94B2C",
          redLight: "#FDF2F0",
          blue: "#387ED1",
          blueLight: "#EDF5FF",
          amber: "#F59E0B",
          amberLight: "#FEF3C7",
          dark: "#0F172A",
          darkSecondary: "#1E293B",
          darkMuted: "#475569",
          slate: "#64748B",
          border: "#E2E8F0",
          card: "#FFFFFF",
          bg: "#F8FAFC",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'groww': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'groww-hover': '0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}