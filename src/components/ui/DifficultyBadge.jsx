import { DIFFICULTY_STYLES } from '../../data/difficulty-styles'

export function DifficultyBadge({ levelId, label, points, size = 'md' }) {
  const style = DIFFICULTY_STYLES[levelId] ?? DIFFICULTY_STYLES[2]
  const sizeStyles = {
    sm: { fontSize: 11, padding: '0.1rem 0.5rem' },
    md: { fontSize: 12, padding: '0.15rem 0.55rem' },
  }
  const s = sizeStyles[size] ?? sizeStyles.md

  return (
    <span
      style={{
        fontSize: s.fontSize,
        fontWeight: 500,
        color: style.color,
        padding: s.padding,
        borderRadius: 100,
        border: `1px solid ${style.color}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      {label ?? '?'}
      {points !== undefined && (
        <span style={{ opacity: 0.8 }}>{points} pts</span>
      )}
    </span>
  )
}
