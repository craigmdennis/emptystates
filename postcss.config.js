// in postcss.config.js
const postcssPresetEnv = require('postcss-preset-env');
const atImport = require('postcss-import');

module.exports = () => ({
  syntax: 'postcss-scss',
  parser: require('postcss-comment'),
  plugins: [
    atImport(),
    postcssPresetEnv({
      stage: 0,
    }),
  ],
});
