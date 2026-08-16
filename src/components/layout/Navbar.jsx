import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
  { to: '/problem',   label: '每週一問',  accentVar: '--potc-theme-color'      },
  { to: '/speed',     label: '速算競技場', accentVar: '--speedmath-theme-color' },
  { to: '/resources', label: '數學資源',  accentVar: '--resources-theme-color' },
  { to: '/about',     label: '關於',      accentVar: '--about-theme-color' },
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
    <nav className={styles.navbar} style={{ borderBottomColor: activeBorderColor }}>
      <div className={styles.navbar__container}>
        {/* Logo */}
        <NavLink to="/" className={styles.navbar__logo}>
          ∫ BMC
        </NavLink>

        {/* Nav links */}
        <div className={styles.navbar__nav}>
          {NAV_ITEMS.map(({ to, label, accentVar }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
              }
              style={({ isActive }) => ({
                color: isActive ? `var(${accentVar})` : undefined,
                backgroundColor: isActive
                  ? `color-mix(in srgb, var(${accentVar}) 10%, transparent)`
                  : undefined,
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'To daylight' : 'To nighttime'}
          className={styles.navbar__themeBtn}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
