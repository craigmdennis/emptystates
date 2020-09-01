module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
  },
  purge: ['./src/pages/submit.js', './src/pages/thanks.js'],
  theme: {
    extend: {
      colors: {
        // Make sure these match in base.css
        'primary-bg': 'var(--primaryBackground)',
        'primary-text-color': 'var(--primaryColor)',
        'secondary-text-color': 'var(--secondaryColor)',
      },
    },
    variants: {},
    plugins: [],
  },
};
