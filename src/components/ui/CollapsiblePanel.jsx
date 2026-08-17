import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { renderLatex } from '../../lib/math-renderer'
import styles from './CollapsiblePanel.module.css'

// Shared collapsible chrome: accent color arrives as --panel-accent.
function Panel({ title, children, headerContent, activeColor, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      onClick={() => setOpen(!open)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') setOpen(!open) }}
      className={`${styles.panel} ${open ? styles['panel--open'] : ''}`}
      style={{ '--panel-accent': activeColor }}
    >
      <div className={styles.head}>
        {headerContent ?? <span className={styles.headTitle}>{title}</span>}
        <span className={`${styles.arrow} ${open ? styles['arrow--open'] : ''}`}>▾</span>
      </div>
      <div className={`${styles.body} ${open ? styles['body--open'] : ''}`}>
        <div className={styles.bodyInner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export function CollapsiblePanel(props) {
  return <Panel {...props} />
}

export function CollapsibleLatex({ content, title, ...rest }) {
  const { t } = useTranslation()
  return (
    <Panel title={title ?? t('common.solution')} {...rest}>
      <div dangerouslySetInnerHTML={{ __html: renderLatex(content) }} />
    </Panel>
  )
}
