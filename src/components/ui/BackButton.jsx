import { useTranslation } from 'react-i18next'
import styles from './BackButton.module.css'

// Unified page-level back navigation: always sits at the top-left of the
// content area, above the page title. Text varies by context ("← 返回選單"
// vs "← 返回"), position and style stay consistent across every page.
export default function BackButton({ onClick, children }) {
  const { t } = useTranslation()
  return (
    <button type="button" className={styles.back} onClick={onClick}>
      {children ?? t('common.back')}
    </button>
  )
}
