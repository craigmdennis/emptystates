import * as React from 'react';
import Masonry from 'react-masonry-component';
import Preview from '../components/preview'
import styles from './gallery.module.css';
 
const masonryOptions = {
  gutter: 16
};
 
class Gallery extends React.Component {
  render() {

    const childElements = this.props.elements.map(({ node }) => {
      return (
        <div className={styles.gallery__item}>
          <Preview post={node} />
        </div>
      )
    })
   
    return (
      <Masonry
        className={styles.gallery}
        elementType={'div'}
        options={masonryOptions}>

        {childElements}

      </Masonry>
    );
  }
}

export default Gallery;