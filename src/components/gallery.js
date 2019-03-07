import * as React from 'react';
import Masonry from 'react-masonry-component';
 
const masonryOptions = {
  itemSelector: '.post-list > li',
  gutter: 16
};
 
class Gallery extends React.Component {
  render() {   
    return (
      <Masonry
        className={'post-list'}
        elementType={'ul'}
        options={masonryOptions}>
        {this.props.children}
      </Masonry>
    );
  }
}

export default Gallery;