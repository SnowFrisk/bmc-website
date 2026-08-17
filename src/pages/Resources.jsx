import { useTranslation } from 'react-i18next'
import { RESOURCES, featuredOfTheWeek } from '../data/resources'
import styles from './Resources.module.css'

const CATEGORIES = [
  { id: 'learn',     icon: '📚', labelKey: 'resources.cat.learn',     hintKey: 'resources.cat.learnHint' },
  { id: 'reference', icon: '📖', labelKey: 'resources.cat.reference', hintKey: 'resources.cat.referenceHint' },
  { id: 'make',      icon: '💻', labelKey: 'resources.cat.make',      hintKey: 'resources.cat.makeHint' },
  { id: 'culture',   icon: '🎧', labelKey: 'resources.cat.culture',   hintKey: 'resources.cat.cultureHint' },
]

export default function Resources() {
  const { t } = useTranslation()
  const featured = featuredOfTheWeek(1)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('resources.title')}</h1>
      <p className={styles.hint}>{t('resources.hint')}</p>

      {/* 🔥 Featured — weekly rotation, "watch and move on" */}
      <section className={styles.featured}>
        <h2 className={styles.sectionTitle}>🔥 {t('resources.featured')}</h2>
        <p className={styles.sectionHint}>{t('resources.featuredHint')}</p>
        <div className={styles.featuredGrid}>
          {featured.map(item => (
            <a key={item.title} href={item.url} target="_blank" rel="noreferrer" className={styles.featuredCard}>
              <span className={styles.featuredSource}>{t(item.source)}</span>
              <h3 className={styles.featuredTitle}>{item.title}</h3>
              <p className={styles.featuredNote}>{t(item.note)}</p>
              <span className={styles.featuredGo}>{t('home.go')} →</span>
            </a>
          ))}
        </div>
      </section>

      {/* Permanent shelf — 4 purpose-driven categories */}
      {CATEGORIES.map(cat => {
        const items = RESOURCES.filter(r => r.category === cat.id)
        if (items.length === 0) return null
        return (
          <section key={cat.id} className={styles.section}>
            <h2 className={styles.sectionTitle}>{cat.icon} {t(cat.labelKey)}</h2>
            <p className={styles.sectionHint}>{t(cat.hintKey)}</p>
            <div className={styles.grid}>
              {items.map(item => (
                <a key={item.title} href={item.url} target="_blank" rel="noreferrer" className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <span className={styles.levelBadge}>{t(`resources.level.${item.level}`)}</span>
                  </div>
                  <p className={styles.cardNote}>{t(item.note)}</p>
                  <div className={styles.cardTags}>
                    {(item.tags ?? []).map(tag => <span key={tag} className={styles.tag}>{t(tag)}</span>)}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
