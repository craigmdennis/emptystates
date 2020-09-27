import _ from 'lodash';

const displayTagNameCorrectly = (tag) => {
  const lowerTag = tag.toLowerCase();

  switch (lowerTag) {
    case 'ios':
      return 'iOS';

    case 'macos':
      return 'macOS';

    case 'ipad':
      return 'iPad';

    default:
      return _.capitalize(tag);
  }
};

export default displayTagNameCorrectly;
