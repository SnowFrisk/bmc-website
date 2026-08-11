import { Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { usePastProblems } from '../hooks/useSupabase'
import { BackLink } from '../components/ui/BackLink'
import styles from './pages.module.css'

// Static fallback when Supabase isn't configured
const FALLBACK_ARCHIVE = [
  {
    id: 0,
    cycle_number: 0,
    title: '調和數列的發散性',
    difficulty_level_id: 3,
    difficulty_levels: { label: 'Hard' },
    created_at: '2026-05-01',
  },
  {
    id: -1,
    cycle_number: -1,
    title: '費馬小定理',
    difficulty_level_id: 2,
    difficulty_levels: { label: 'Medium' },
    created_at: '2026-04-01',
  },
]

export default function PastList() {
  const { data: archive = [], isLoading, error } = usePastProblems()

  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  const items = isConfigured && archive.length > 0 ? archive : FALLBACK_ARCHIVE

  return (
    <div className={styles.pastList__container}>

      {/* Header */}
      <section>
        <BackLink to="/problem">返回每週一問</BackLink>
        <h1 className={styles.pastList__header}>過往題目</h1>
        {!isConfigured && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
            （目前顯示靜態示範數據 — 配置 Supabase 後將顯示真實題目）
          </p>
        )}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0.25rem 0 0' }}>
            無法載入：{error.message}
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
            ? items.map((item, i) => {
              const stepCount = item.steps?.length ?? 1
              const dateStr = item.start_date
                ? new Date(item.start_date).toLocaleDateString('zh-TW', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                  })
                : item.created_at
                  ? new Date(item.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit' })
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
                    {stepCount} 步
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
              <p style={{
                fontSize: 14, color: 'var(--text-muted)',
                textAlign: 'center', padding: '2rem',
              }}>
                尚無過往題目。
              </p>
            )
        }
      </div>

    </div>
  )
}
