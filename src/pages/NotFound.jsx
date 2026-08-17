import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return <div><h1 style={{ color: 'var(--red)' }}>{t('notFound')}</h1></div>
}
