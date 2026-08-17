import { useTranslation } from 'react-i18next'
import { useLeaderboard } from '../../hooks/useSubmissions'
import { Skeleton } from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import styles from './Leaderboard.module.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

/**
 * Leaderboard for the current cycle.
 * props:
 *  - cycleNumber: current cycle number
 *  - problems: current-cycle steps (used to resolve problem ids)
 *  - totalSteps: number of steps in the cycle (for x/N completion)
 */
export default function Leaderboard({ cycleNumber, problems, totalSteps }) {
  const { t } = useTranslation()
  const { data = [], isLoading, error } = useLeaderboard(cycleNumber, problems)

  if (error) {
    return (
      <section className={styles.leaderboard}>
        <h2 className={styles.leaderboard__heading}>{t('leaderboard.title')}</h2>
        <p className={styles.leaderboard__empty} style={{ color: 'var(--red)' }}>
          {t('leaderboard.loadError')}{error.message}
        </p>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className={styles.leaderboard}>
        <h2 className={styles.leaderboard__heading}>{t('leaderboard.title')}</h2>
        <div className={styles.leaderboard__list}>
          {[0, 1, 2].map(i => (
            <div key={i} className={styles.leaderboard__skeletonRow}>
              <Skeleton width={22} height={18} />
              <Skeleton width="40%" height={14} />
              <Skeleton width={44} height={13} style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      </section>
    )
  }

  const showEmptyState = data.length === 0

  return (
    <section className={styles.leaderboard}>
      <h2 className={styles.leaderboard__heading}>{t('leaderboard.title')}</h2>

      {showEmptyState ? (
        <EmptyState icon="🏆" title={t('leaderboard.empty')} />
      ) : (
        <div className={styles.leaderboard__list}>
          {data.slice(0, 5).map((entry, i) => (
            <div key={entry.name + i} className={styles.leaderboard__row}>
              <span className={styles.leaderboard__rank}>
                {MEDALS[i + 1] ?? i + 1}
              </span>
              <span className={styles.leaderboard__name}>
                {entry.name}
                {entry.name === '匿名' && (
                  <span className={styles.leaderboard__anonTag}>{t('leaderboard.hidden')}</span>
                )}
              </span>
              <span className={styles.leaderboard__solved}>
                {t('leaderboard.steps', { count: entry.solved, total: totalSteps })}
              </span>
              <span className={styles.leaderboard__score}>
                {entry.score} pts
              </span>
            </div>
          ))}
        </div>
      )}

      <p className={styles.leaderboard__footnote}>
        {t('leaderboard.footnote')}
      </p>
    </section>
  )
}
