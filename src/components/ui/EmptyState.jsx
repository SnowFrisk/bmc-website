import styles from './EmptyState.module.css'

// ── 全站空狀態組件 ──
// 冇活躍題目 / 冇通告 / 排行榜冇人 / 冇過往題目…… 全部共用同一個視覺
// 語言（Soft UI 虛線卡片 + 居中 muted 文字），內容由 props 注入。
export default function EmptyState({ icon = '📭', title, hint }) {
  return (
    <div className={styles.empty} role="status">
      {icon && <span className={styles.empty__icon}>{icon}</span>}
      <p className={styles.empty__title}>{title}</p>
      {hint && <p className={styles.empty__hint}>{hint}</p>}
    </div>
  )
}
