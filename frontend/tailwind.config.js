/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['26px', { lineHeight: '32px', fontWeight: '600' }],
        'card-title': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'secondary': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      colors: {
        page: '#F5F6F8',
        surface: '#FFFFFF',
        border: '#E1E4EA',
        'text-main': '#16181D',
        'text-muted': '#5B6270',
        accent: {
          DEFAULT: '#2B4ACB',
          hover: '#223ba4',
          subtle: '#E8ECFB',
        },
        danger: '#B42318',
      },
      borderRadius: {
        'card': '10px',
        'btn': '8px',
      },
      spacing: {
        '40px': '40px',
      },
      maxWidth: {
        'content': '1160px',
      },
    },
  },
  plugins: [],
}
