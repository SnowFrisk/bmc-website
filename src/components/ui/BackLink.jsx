import { Link } from 'react-router-dom'

export function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 13,
        color: 'var(--text-muted)',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        marginBottom: '1rem',
        transition: 'color 0.2s, gap 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--potc-theme-color)'
        e.currentTarget.style.gap = '0.6rem'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-muted)'
        e.currentTarget.style.gap = '0.35rem'
      }}
    >
      <span>←</span> {children}
    </Link>
  )
}
