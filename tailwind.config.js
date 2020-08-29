module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
  },
  purge: [],
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
