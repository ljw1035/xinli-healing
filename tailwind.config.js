/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['PingFang-SC', 'Noto Sans SC', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        primary: {
          light: '#A9CCE3',
          DEFAULT: '#7FB3D5',
        },
        background: {
          DEFAULT: '#F4F6F7',
          paper: '#FFFFFF',
        },
        text: {
          DEFAULT: '#2C3E50',
        }
      }
    },
  },
  plugins: [],
}
