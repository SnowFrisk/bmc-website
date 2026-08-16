import { useState } from 'react'
import { TOURNAMENTS, PROGRAMS } from '../data/about'
import styles from './About.module.css'

// ── About page ──
// Reading-oriented page: serif headings AND body (Noto Serif TC) — the
// "club chronicle" tone. Cards are accordions: collapsed = one-line
// summary; expanded = full description + official links. Interactive
// elements stay sans-serif via the shared system.

function AccordionItem({ item, open, onToggle }) {
  return (
    <li className={`${styles.item} ${open ? styles['item--open'] : ''}`}>
      <button className={styles.itemHead} onClick={onToggle} type="button" aria-expanded={open}>
        <h3 className={styles.itemName}>{item.name}</h3>
        <span className={styles.itemWhen}>{item.when}</span>
        <span className={`${styles.itemArrow} ${open ? styles['itemArrow--open'] : ''}`}>▸</span>
      </button>
      {/* Always mounted: the body animates height via grid-template-rows
          (0fr → 1fr), so the card grows smoothly instead of snapping. */}
      <div className={`${styles.itemBody} ${open ? styles['itemBody--open'] : ''}`}>
        <div className={styles.itemBodyInner}>
          <div className={styles.itemBodyPad}>
            <p className={styles.itemDesc}>{item.desc}</p>
            {(item.links ?? []).length > 0 && (
              <div className={styles.itemLinks}>
                {item.links.map(l => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className={styles.itemLink}>
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export default function About() {
  const [openId, setOpenId] = useState(null)
  const toggle = id => setOpenId(prev => (prev === id ? null : id))

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>關於我們</h1>
      <p className={styles.lead}>
        Bishop's Math Club（BMC）——一群鍾意數學嘅人：有比賽、有訓練、有得玩。
        我哋參加年度賽事，亦自己搞活動。下面係逐學年嘅編年史。
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tournaments</h2>
        <p className={styles.sectionHint}>
          按學年排序嘅年度賽事列表——撳卡片睇詳細同官方連結。
        </p>
        <ul className={styles.list}>
          {TOURNAMENTS.map(t => (
            <AccordionItem
              key={`t-${t.name}`}
              item={t}
              open={openId === `t-${t.name}`}
              onToggle={() => toggle(`t-${t.name}`)}
            />
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Internal Programs</h2>
        <p className={styles.sectionHint}>
          BMC 自己組織嘅活動——一樣按學年排序。
        </p>
        <ul className={styles.list}>
          {PROGRAMS.map(p => (
            <AccordionItem
              key={`p-${p.name}`}
              item={p}
              open={openId === `p-${p.name}`}
              onToggle={() => toggle(`p-${p.name}`)}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}
