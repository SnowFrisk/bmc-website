import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'

const NAV_ITEMS = [
  { to: '/problem',   label: '每週一問',  accentVar: '--potc-theme-color'      },
  { to: '/speed',     label: '速算競技場', accentVar: '--speedmath-theme-color' },
  { to: '/resources', label: '數學資源',  accentVar: '--resources-theme-color' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  // Find which accent colour belongs to the current route
  const activeItem = NAV_ITEMS.find(item => location.pathname.startsWith(item.to))
  const activeBorderColor = activeItem
    ? `var(${activeItem.accentVar})`
    : 'var(--border)'

  return (
    <nav style={{
      backgroundColor: 'var(--bg-secondary)',
      // Single straight line whose colour reflects the active section
      borderBottom: `1.5px solid ${activeBorderColor}`,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '0 1.5rem',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}>
        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            ∫ BMC
          </span>
        </NavLink>

        {/* Nav links — no individual bottom border, colour only */}
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, accentVar }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                padding: '0.35rem 0.85rem',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none',
                color: isActive ? `var(${accentVar})` : 'var(--text-secondary)',
                backgroundColor: isActive
                  ? `color-mix(in srgb, var(${accentVar}) 10%, transparent)`
                  : 'transparent',
                transition: 'color 0.15s, background-color 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Theme toggle — borderless, text-only */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'To daylight' : 'To nighttime'}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.35rem 0.4rem',
            cursor: 'pointer',
            fontSize: 16,
            color: 'var(--text-muted)',
            transition: 'color 0.15s',
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}