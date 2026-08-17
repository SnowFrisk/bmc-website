import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'
import { setAppLanguage, currentLanguage } from '../../i18n'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
  { to: '/problem',   labelKey: 'nav.problem',  accentVar: '--potc-theme-color'      },
  { to: '/speed',     labelKey: 'nav.speed',    accentVar: '--speedmath-theme-color' },
  { to: '/resources', labelKey: 'nav.resources', accentVar: '--resources-theme-color' },
  { to: '/about',     labelKey: 'nav.about',    accentVar: '--about-theme-color' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const location = useLocation()
  const lang = currentLanguage()

  // Find which accent colour belongs to the current route
  const activeItem = NAV_ITEMS.find(item => location.pathname.startsWith(item.to))
  const activeBorderColor = activeItem
    ? `var(${activeItem.accentVar})`
    : 'var(--border)'

  function toggleLanguage() {
    setAppLanguage(lang === 'en' ? 'zh' : 'en')
  }

  return (
    <nav className={styles.navbar} style={{ borderBottomColor: activeBorderColor }}>
      <div className={styles.navbar__container}>
        {/* Logo */}
        <NavLink to="/" className={styles.navbar__logo}>
          BMC
        </NavLink>

        {/* Nav links */}
        <div className={styles.navbar__nav}>
          {NAV_ITEMS.map(({ to, labelKey, accentVar }) => (
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
              {t(labelKey)}
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
