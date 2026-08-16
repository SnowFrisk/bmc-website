import { Link } from 'react-router-dom'
import { ANNOUNCEMENTS } from '../data/announcements'
import styles from './Home.module.css'

const NAV_CARDS = [
  {
    to: '/problem',
    icon: '📅',
    title: '每週一問',
    desc: '每週一道數學題——提交答案，上榜攞分',
    accentVar: '--potc-theme-color',
  },
  {
    to: '/speed',
    icon: '⚡',
    title: '速算競技場',
    desc: '單人限時速算 + 即時對戰，同隊友過招',
    accentVar: '--speedmath-theme-color',
  },
  {
    to: '/resources',
    icon: '📚',
    title: '數學資源',
    desc: '常駐書架 + 每週推薦——揀啱工具慳返十年',
    accentVar: '--resources-theme-color',
  },
  {
    to: '/about',
    icon: 'ℹ️',
    title: '關於',
    desc: 'BMC 嘅賽事同活動——逐學年嘅編年史',
    accentVar: '--about-theme-color',
  },
]

export default function Home() {
  return (
    <div className={styles.home__container}>

      {/* ── Hero ── */}
      <section className={styles.home__hero}>
        <div className={styles.home__title}>∫ BMC</div>
        <p className={styles.home__subtitle}>Bishop's Math Club</p>
      </section>

      {/* ── Announcements ── */}
      <section className={styles.home__announcements}>
        <h2 className={styles.home__annTitle}>通告</h2>
        <ul className={styles.home__annList}>
          {ANNOUNCEMENTS.map(a => (
            <li key={a.date + a.text} className={styles.home__annItem}>
              <span className={styles.home__annDate}>{a.date}</span>
              <span className={styles.home__annText}>{a.text}</span>
            </li>
          ))}
        </ul>
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
            <span className={styles.home__navTitle}>{card.title}</span>
            <span className={styles.home__navDesc}>{card.desc}</span>
            <span className={styles.home__navGo}>去睇 →</span>
          </Link>
        ))}
      </section>

    </div>
  )
}
