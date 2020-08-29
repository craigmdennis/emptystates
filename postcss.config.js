module.exports = () => ({
  syntax: 'postcss-scss',
  parser: require('postcss-comment'),
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('postcss-preset-env')({ stage: 1 }),
  ],
});
