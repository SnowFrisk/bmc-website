import { useMemo } from 'react'
import { renderLatex } from '../../lib/math-renderer'
import { Skeleton } from '../ui/Skeleton'
import styles from './ProblemCard.module.css'

export const DIFFICULTY_STYLES = {
  1: { color: 'var(--green)',  bg: 'color-mix(in srgb, var(--green) 10%, transparent)' },
  2: { color: 'var(--gold)',   bg: 'color-mix(in srgb, var(--gold) 10%, transparent)'  },
  3: { color: 'var(--red)',    bg: 'color-mix(in srgb, var(--red) 10%, transparent)'   },
}

/**
 * Expandable problem card.
 * `problem` must have: difficulty_level_id, difficulty_levels.{label, points}, title, latex
 * `stepNumber` (optional): when provided, the badge reads "Step N" instead of the difficulty label.
 */
export function ProblemCard({ problem, active, onClick, stepNumber }) {
  const style = DIFFICULTY_STYLES[problem.difficulty_level_id] ?? DIFFICULTY_STYLES[2]
  const renderedLatex = useMemo(() => renderLatex(problem.latex), [problem.latex])

  return (
    <div
      className={`${styles.problemCard} ${active ? styles['problemCard--active'] : ''}`}
      style={{
        borderColor: active ? style.color : undefined,
        backgroundColor: active ? style.bg : undefined,
      }}
    >
      {/* Header row */}
      <div className={styles.problemCard__header}>
        <span
          className={styles.problemCard__badge}
          style={{ color: style.color, borderColor: style.color }}
        >
          {stepNumber ? `Step ${stepNumber}` : (problem.difficulty_levels?.label ?? '?')}
        </span>
        <span className={styles.problemCard__points} style={{ color: style.color }}>
          {problem.points ?? problem.difficulty_levels?.points ?? '?'} pts
        </span>
        <span className={styles.problemCard__title}>
          {problem.title}
        </span>
      </div>

      {/* LaTeX — smooth expand */}
      <div className={`${styles.problemCard__content} ${active ? styles['problemCard__content--open'] : ''}`}>
        <div className={styles.problemCard__contentInner}>
          <div
            dangerouslySetInnerHTML={{ __html: renderedLatex }}
            className={styles.problemCard__latex}
          />
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      borderRadius: 10,
      border: '1px solid var(--border)',
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={64} height={20} borderRadius={100} />
        <Skeleton width={40} height={14} />
        <Skeleton width="45%" height={14} />
      </div>
      <Skeleton width="88%" height={14} />
    </div>
  )
}
