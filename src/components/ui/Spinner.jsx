import styles from './buttons.module.css'

/** Small rotating ring shown inside buttons while a request is in flight. */
export default function Spinner() {
  return <span className={styles.spinner} role="status" aria-label="連接中" />
}
