module.exports = {
  babel: {
    plugins: ["@babel/plugin-proposal-logical-assignment-operators"],
  },
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
}
