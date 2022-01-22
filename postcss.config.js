module.exports = () => ({
  parser: 'postcss-scss',
  plugins: [
    // require('postcss-nested'),
    require('postcss-import'),
    require('postcss-preset-env')({ stage: 1 }),
  ],
});
