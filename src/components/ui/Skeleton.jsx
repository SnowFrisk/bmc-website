import styles from './ui.module.css'

export function Skeleton({ width = '100%', height = 14, borderRadius = 4, className = '', style }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--bg-tertiary)',
        ...style,
      }}
    />
  )
}
