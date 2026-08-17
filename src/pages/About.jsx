import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TOURNAMENTS, PROGRAMS } from '../data/about'
import styles from './About.module.css'

// ── About page ──
// Reading-oriented page: serif headings AND body (Noto Serif TC) — the
// "club chronicle" tone. Cards are accordions: collapsed = one-line
// summary; expanded = full description + official links. Interactive
// elements stay sans-serif via the shared system.

function AccordionItem({ item, open, onToggle }) {
  const { t } = useTranslation()
  return (
    <li className={`${styles.item} ${open ? styles['item--open'] : ''}`}>
      <button className={styles.itemHead} onClick={onToggle} type="button" aria-expanded={open}>
        <h3 className={styles.itemName}>{item.name}</h3>
        <span className={styles.itemWhen}>{t(item.when)}</span>
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
                    {t(l.label)} ↗
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
  const { t } = useTranslation()
  const [openId, setOpenId] = useState(null)
  const toggle = id => setOpenId(prev => (prev === id ? null : id))

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('about.title')}</h1>
      <p className={styles.lead}>
        {t('about.lead')}
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tournaments</h2>
        <p className={styles.sectionHint}>
          {t('about.tournamentsHint')}
        </p>
        <ul className={styles.list}>
          {TOURNAMENTS.map(t2 => (
            <AccordionItem
              key={`t-${t2.name}`}
              item={t2}
              open={openId === `t-${t2.name}`}
              onToggle={() => toggle(`t-${t2.name}`)}
            />
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Internal Programs</h2>
        <p className={styles.sectionHint}>
          {t('about.programsHint')}
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
