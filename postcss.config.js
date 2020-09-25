module.exports = () => ({
  syntax: 'postcss-scss',
  parser: require('postcss-comment'),
  plugins: [
    // require('postcss-nested'),
    require('postcss-import'),
    require('postcss-preset-env')({ stage: 1 }),
  ],
});
