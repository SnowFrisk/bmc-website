import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ANNOUNCEMENTS } from '../data/announcements'
import EmptyState from '../components/ui/EmptyState'
import styles from './Home.module.css'

const NAV_CARDS = [

  {
    to: '/about',
    icon: 'ℹ️',
    titleKey: 'nav.about',
    descKey: 'home.about.desc',
    goKey: 'home.about.go',
    accentVar: '--about-theme-color',
  },
  {
    to: '/problem',
    icon: '📅',
    titleKey: 'nav.problem',
    descKey: 'home.problem.desc',
    goKey: 'home.problem.go',
    accentVar: '--potc-theme-color',
  },
  {
    to: '/speed',
    icon: '⚡',
    titleKey: 'nav.speed',
    descKey: 'home.speed.desc',
    goKey: 'home.speed.go',
    accentVar: '--speedmath-theme-color',
  },
  {
    to: '/resources',
    icon: '📚',
    titleKey: 'nav.resources',
    descKey: 'home.resources.desc',
    goKey: 'home.resources.go',
    accentVar: '--resources-theme-color',
  },
]

export default function Home() {
  const { t } = useTranslation()
  const is_announcement_empty = ANNOUNCEMENTS.length === 0

  return (
    <div className={styles.home__container}>

      {/* ── Hero ── */}
      <section className={styles.home__hero}>
        <div className={styles.home__title}>BMC</div>
        <p className={styles.home__subtitle}>Bishop's Math Club</p>
      </section>

      {/* ── Announcements ── */}
      <section className={styles.home__announcements}>
        <h2 className={styles.home__annTitle}>{t('home.annTitle')}</h2>
        {is_announcement_empty ? (
          <EmptyState icon="📢" title={t('home.announcements.empty')} />
        ) : (
          <ul className={styles.home__annList}>
            {ANNOUNCEMENTS.map(a => (
              <li key={a.date + a.text} className={styles.home__annItem}>
                <span className={styles.home__annDate}>{a.date}</span>
                <span className={styles.home__annText}>{a.text}</span>
              </li>
          ))}
        </ul>
        )}
      </section>

      {/* ── Navigation cards ── */}
      <section className={styles.home__navCards}>
        {NAV_CARDS.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className={styles.home__navCard}
            style={{ '--nav-accent': `var(${card.accentVar})` }}
          >
            <span className={styles.home__navIcon}>{card.icon}</span>
            <span className={styles.home__navTitle}>{t(card.titleKey)}</span>
            <span className={styles.home__navDesc}>{t(card.descKey)}</span>
            <span className={styles.home__navGo}>{t(card.goKey)} →</span>
          </Link>
        ))}
      </section>

    </div>
  )
}
