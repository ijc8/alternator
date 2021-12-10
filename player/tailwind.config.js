const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-split": `linear-gradient(to right, ${colors.gray['500']} 50%, rgba(255, 255, 255, 0) 50%)`,
      },
    },
    colors,
  },
  plugins: [],
}
