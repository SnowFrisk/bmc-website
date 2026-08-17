import { Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { usePastProblems } from '../hooks/useSupabase'
import { BackLink } from '../components/ui/BackLink'
import EmptyState from '../components/ui/EmptyState'
import styles from './PastList.module.css'

export default function PastList() {
  const { t } = useTranslation()
  const { data: archive = [], isLoading, error } = usePastProblems()

  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  // 冇過往題目（未配置 / 真係未有）→ 空狀態，唔再顯示靜態示範數據
  const items = isConfigured ? archive : []
  const locale = i18n.language?.startsWith('zh') ? 'zh-TW' : 'en-US'

  return (
    <div className={styles.pastList__container}>

      {/* Header */}
      <section>
        <BackLink to="/problem">{t('past.backToProblem')}</BackLink>
        <h1 className={styles.pastList__header}>{t('past.title')}</h1>
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0.25rem 0 0' }}>
            {t('past.loadError')}{error.message}
          </p>
        )}
      </section>

      {/* List */}
      <div className={styles.pastList__list}>
        {isLoading && isConfigured
          ? [0, 1, 2].map(i => (
            <div key={i} style={{
              padding: '0.75rem 1.25rem',
              borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
              display: 'flex', gap: '1rem', alignItems: 'center',
            }}>
              <div style={{ width: 40, height: 12, borderRadius: 4, backgroundColor: 'var(--bg-tertiary)' }} />
              <div style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: 'var(--bg-tertiary)' }} />
              <div style={{ width: 56, height: 14, borderRadius: 4, backgroundColor: 'var(--bg-tertiary)' }} />
            </div>
          ))
          : items.length > 0
            ? items.map(item => {
              const stepCount = item.steps?.length ?? 1
              const dateStr = item.start_date
                ? new Date(item.start_date).toLocaleDateString(locale, {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                  })
                : item.created_at
                  ? new Date(item.created_at).toLocaleDateString(locale, { year: 'numeric', month: '2-digit' })
                  : `Cycle ${item.cycle_number}`

              return (
                <Link
                  key={item.id}
                  to={`/problem/past/${item.id}`}
                  className={styles.pastList__item}
                >
                  {/* Cycle badge */}
                  <span className={styles.pastList__cycle}>
                    Cycle {item.cycle_number}
                  </span>

                  {/* Title */}
                  <span className={styles.pastList__title}>
                    {item.title}
                  </span>

                  {/* Step count badge */}
                  <span style={{
                    fontSize: 11,
                    padding: '0.1rem 0.5rem',
                    borderRadius: 100,
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}>
                    {t('past.steps', { count: stepCount })}
                  </span>

                  {/* Date */}
                  <span className={styles.pastList__date}>
                    {dateStr}
                  </span>

                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
                </Link>
              )
            })
            : (
              <EmptyState icon="🗂" title={t('past.empty')} />
            )
        }
      </div>

    </div>
  )
}
