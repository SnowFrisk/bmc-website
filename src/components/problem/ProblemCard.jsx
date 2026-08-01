import { useState } from 'react'
import { renderLatex } from '../../lib/math-renderer'

export const DIFFICULTY_STYLES = {
  1: { color: 'var(--green)',  bg: 'color-mix(in srgb, var(--green) 10%, transparent)' },
  2: { color: 'var(--gold)',   bg: 'color-mix(in srgb, var(--gold) 10%, transparent)'  },
  3: { color: 'var(--red)',    bg: 'color-mix(in srgb, var(--red) 10%, transparent)'   },
}

/**
 * Expandable problem card.
 * `problem` must have: difficulty_level_id, difficulty_levels.{label, points}, title, latex
 */
export function ProblemCard({ problem, active, onClick }) {
  const style = DIFFICULTY_STYLES[problem.difficulty_level_id] ?? DIFFICULTY_STYLES[2]
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick() }}
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 10,
        border: active
          ? `1px solid ${style.color}`
          : hovered
            ? `1px solid color-mix(in srgb, ${style.color} 50%, transparent)`
            : '1px solid var(--border)',
        backgroundColor: active ? style.bg : 'var(--bg-secondary)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background-color 0.2s',
        outline: 'none',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          fontSize: 12, fontWeight: 500,
          color: style.color,
          padding: '0.15rem 0.55rem',
          borderRadius: 100,
          border: `1px solid ${style.color}`,
        }}>
          {problem.difficulty_levels?.label ?? '?'}
        </span>
        <span style={{ fontSize: 12, color: style.color, fontWeight: 500 }}>
          {problem.difficulty_levels?.points ?? '?'} pts
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', flex: 1 }}>
          {problem.title}
        </span>
        <span style={{
          fontSize: 18,
          color: 'var(--text-muted)',
          transition: 'transform 0.25s, color 0.2s',
          transform: active ? 'rotate(180deg)' : 'rotate(0deg)',
          ...(active && { color: style.color }),
        }}>
          ▾
        </span>
      </div>

      {/* LaTeX — smooth expand */}
      <div style={{
        display: 'grid',
        gridTemplateRows: active ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div
            dangerouslySetInnerHTML={{ __html: renderLatex(problem.latex) }}
            style={{ fontSize: 15, lineHeight: 1.8, paddingTop: '0.75rem' }}
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
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <div style={{ width: 48, height: 20, borderRadius: 100, backgroundColor: 'var(--bg-tertiary)' }} />
      <div style={{ width: 32, height: 14, borderRadius: 4, backgroundColor: 'var(--bg-tertiary)' }} />
      <div style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: 'var(--bg-tertiary)' }} />
    </div>
  )
}
