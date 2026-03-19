/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: '#ff7aa2',
        wine: '#412037',
        cream: '#fff6ef',
        ink: '#28161f',
        mint: '#86d4c3',
        gold: '#ffcf70',
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
        display: ['"STZhongsong"', '"Noto Serif SC"', 'serif'],
      },
      boxShadow: {
        phone: '0 30px 80px rgba(54, 27, 38, 0.28)',
        soft: '0 12px 30px rgba(80, 35, 47, 0.12)',
      },
      backgroundImage: {
        haze:
          'radial-gradient(circle at top, rgba(255, 255, 255, 0.95), rgba(255, 240, 233, 0.65) 35%, rgba(255, 224, 214, 0.35) 65%, rgba(248, 191, 217, 0.4))',
      },
    },
  },
  plugins: [],
}
