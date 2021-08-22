import styles from '../styles/Page.module.css';
import Link from 'next/link';
import PageLayout from '../components/pageLayout';

export default function Page() {
  return (
    <PageLayout
      title="Thank you for sending your message"
      hideContent={true}
      showHero={false}
      loadingState={false}
      darkMain={false}
    >
      <div>
        <div className={styles['flex-grid']}>
          <div className={styles.col} style={{ width: '66.66%' }}>
            <h1>Thank you for sending your message</h1>
            <p>
              I&apos;ll get back to you soon if what you sent requires a reply.
            </p>
            <Link href="/" className="button button-prime-inverted">
              <a>Go back to my homepage</a>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
