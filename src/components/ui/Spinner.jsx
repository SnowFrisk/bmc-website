import { useTranslation } from 'react-i18next'
import styles from './buttons.module.css'

/** Small rotating ring shown inside buttons while a request is in flight. */
export default function Spinner() {
  const { t } = useTranslation()
  return <span className={styles.spinner} role="status" aria-label={t('common.connecting')} />
}
