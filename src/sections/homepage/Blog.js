import styles from '../../styles/Home.module.css';

import { Element } from 'react-scroll';

const Blog = ({}) => {
  return (
    <section
      className={styles.wrap}
      style={{
        background: '#093054',
        background:
          '-webkit-gradient(left top,right bottom,color-stop(0, #093054),color-stop(100%, #061e35))',
        background: 'linear-gradient(135deg, #093054, #061e35)',
        color: '#fff',
      }}
    >
      <Element name="blog" id="blog" className={styles.container}>
        <div>
          <div id="BlogPostOpenerWrapper">
            <h2>What's going on?</h2>
            <p>
              Below you will find some of the blog posts that I have wrote (if
              that is still working), I used to write a lot and I'm looking to
              write blog posts more about the projects that I am working on.
              There might not be a lot here but I hope that it will at least be
              interesting, at least to me.
            </p>
            <div style={{ minHeight: '160px' }}></div>
          </div>
        </div>
      </Element>
    </section>
  );
};

export default Blog;
