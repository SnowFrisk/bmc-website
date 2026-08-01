import { Link } from 'react-router-dom'
import TodaysCenter from '../components/ui/TodaysCenter'

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2.5rem',
      padding: '3rem 0 1rem',
    }}>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 44,
          fontWeight: 500,
          marginBottom: '0.4rem',
          letterSpacing: '-1px',
          fontFamily: 'Lora, Noto Serif TC, Georgia, serif',
          color: 'var(--text-primary)',
        }}>
          ∫ BMC
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Bishop's Math Club
        </p>
        <Link
          to="/problem"
          className="home-cta"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.6rem',
            borderRadius: 8,
            border: '1px solid var(--potc-theme-color)',
            color: 'var(--potc-theme-color)',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background-color 0.25s, gap 0.25s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--potc-theme-color) 14%, transparent)'
            e.currentTarget.style.gap = '0.75rem'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.gap = '0.5rem'
          }}
        >
          本週題目
          <span style={{ fontSize: 16, transition: 'transform 0.25s' }}>→</span>
        </Link>
      </section>

      {/* ── Today's triangle centre ── */}
      <TodaysCenter />

    </div>
  )
}
