// Special cases for tags
const processTags = (tag) => {
  switch (tag) {
    case 'ios':
      return 'iOS';
    case 'macos':
      return 'macOS';
    default:
      return tag;
  }
};

export default processTags;
