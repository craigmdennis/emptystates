import _ from 'lodash';

const displayTag = (tag) => {
  switch (tag) {
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

export default displayTag;
