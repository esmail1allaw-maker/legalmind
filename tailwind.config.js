export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 50px rgba(15, 23, 42, 0.08)'
      },
      keyframes: {
        scaleUp: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        scaleUp: 'scaleUp 180ms ease-out'
      }
    }
  },
  plugins: []
};
