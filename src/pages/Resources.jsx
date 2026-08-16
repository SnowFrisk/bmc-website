import { RESOURCES, featuredOfTheWeek } from '../data/resources'
import styles from './Resources.module.css'

const CATEGORIES = [
  { id: 'learn',     icon: '📚', label: '學習與備賽', hint: '學嘢、操練、準備競賽' },
  { id: 'reference', icon: '📖', label: '查閱與參考', hint: '查概念、睇研究' },
  { id: 'make',      icon: '💻', label: '造與玩',     hint: '動手試、寫程式' },
  { id: 'culture',   icon: '🎧', label: '聽與聊',     hint: '數學史、新聞、社區' },
]

const LEVEL_LABELS = {
  beginner: '入門',
  intermediate: '中級',
  advanced: '進階',
  observe: '觀摩',
}

export default function Resources() {
  const featured = featuredOfTheWeek(1)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>數學資源</h1>
      <p className={styles.hint}>揀啱工具，慳返十年。常駐書架 + 每週轉換嘅精選。</p>

      {/* 🔥 Featured — weekly rotation, "watch and move on" */}
      <section className={styles.featured}>
        <h2 className={styles.sectionTitle}>🔥 本週推薦</h2>
        <p className={styles.sectionHint}>每週自動轉換——睇完就過，保持新鮮。</p>
        <div className={styles.featuredGrid}>
          {featured.map(item => (
            <a key={item.title} href={item.url} target="_blank" rel="noreferrer" className={styles.featuredCard}>
              <span className={styles.featuredSource}>{item.source}</span>
              <h3 className={styles.featuredTitle}>{item.title}</h3>
              <p className={styles.featuredNote}>{item.note}</p>
              <span className={styles.featuredGo}>去睇 →</span>
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
            <h2 className={styles.sectionTitle}>{cat.icon} {cat.label}</h2>
            <p className={styles.sectionHint}>{cat.hint}</p>
            <div className={styles.grid}>
              {items.map(item => (
                <a key={item.title} href={item.url} target="_blank" rel="noreferrer" className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <span className={styles.levelBadge}>{LEVEL_LABELS[item.level]}</span>
                  </div>
                  <p className={styles.cardNote}>{item.note}</p>
                  <div className={styles.cardTags}>
                    {(item.tags ?? []).map(t => <span key={t} className={styles.tag}>{t}</span>)}
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
