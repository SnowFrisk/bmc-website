import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { renderLatex } from '../../lib/math-renderer'
import styles from './LatexInput.module.css'

// 全屏動畫時長（同 CSS 一致）——closing state 等 fade-out 播完先 unmount
const MODAL_ANIM_MS = 250

/**
 * LatexPreview —— 無狀態渲染內核。
 * 任何地方想自訂「輸入框同預覽」嘅擺位，都可以直接插呢個。
 * previewClass：透傳額外 class（例如 SpeedBattle 提交後 fade-out）。
 * splitAnswers：多解答案模式——按分號分割，每個答案獨立一行渲染
 * （同 answersMatchAll 嘅分割規則一致：trim + 去空），方便確認
 * 「3; 2; -2」係咪完整分割成三個答案。
 */
export function LatexPreview({ value, placeholder, previewClass, splitAnswers = false }) {
  const { t } = useTranslation()
  const placeholderText = placeholder ?? t('latex.previewPlaceholder')
  const parts = splitAnswers
    ? String(value).split(';').map(s => s.trim()).filter(Boolean)
    : null
  return (
    <div className={`${styles.preview} ${previewClass ?? ''}`}>
      {value.trim() ? (
        splitAnswers ? (
          <div className={styles.previewBody}>
            {parts.map((p, i) => (
              <div
                key={i}
                className={styles.previewLine}
                dangerouslySetInnerHTML={{ __html: renderLatex(p) }}
              />
            ))}
          </div>
        ) : (
          <div
            className={styles.previewBody}
            dangerouslySetInnerHTML={{ __html: renderLatex(value) }}
          />
        )
      ) : (
        <span className={styles.placeholder}>{placeholderText}</span>
      )}
    </div>
  )
}

/**
 * LatexInput —— LaTeX 輸入 + 即時預覽（全站共用）。
 * variant="full"：編輯器——mono textarea + 預覽 toolbar + 全屏（Admin 用）。
 * variant="compact"：短輸入——單行 input（multiline 時 textarea）+ 下方 inline 預覽（學生場景用）。
 * invalid：紅邊框（即時驗證失敗）；previewClass：透傳預覽額外 class；autoFocus：透傳輸入框。
 */
export default function LatexInput({
  label, value, onChange, rows = 3, placeholder, variant = 'full',
  multiline = false, invalid = false, previewClass, autoFocus, splitAnswers = false,
}) {
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)

  // Esc 關閉全屏。closeModal 每次 render 都係新 closure，唔放入
  // dependency 陣列（避免 exhaustive-deps 警告）——邏輯 inline 喺 effect。
  useEffect(() => {
    if (!expanded) return
    function onKey(e) {
      if (e.key === 'Escape') {
        setClosing(true)
        setTimeout(() => { setExpanded(false); setClosing(false) }, MODAL_ANIM_MS)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  function closeModal() {
    if (closing || !expanded) return
    setClosing(true)
    setTimeout(() => { setExpanded(false); setClosing(false) }, MODAL_ANIM_MS)
  }

  const { t } = useTranslation()
  // ── compact：短輸入 + 內嵌預覽 ──
  if (variant === 'compact') {
    const inputClass = `${styles.compact__input} ${invalid ? styles['compact__input--invalid'] : ''}`
    const inputProps = {
      value,
      onChange: e => onChange(e.target.value),
      placeholder,
      spellCheck: false,
      autoFocus,
      className: inputClass,
    }
    return (
      <label className={styles.compact}>
        {label && <span className={styles.label}>{label}</span>}
        {multiline ? (
          <textarea {...inputProps} rows={rows} />
        ) : (
          <input {...inputProps} />
        )}
        <LatexPreview value={value} previewClass={previewClass} splitAnswers={splitAnswers} />
      </label>
    )
  }

  // ── full：編輯器 ──
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        className={styles.input}
      />

      <div className={styles.previewWrap}>
        <div className={styles.toolbar}>
          <span className={styles.toolbarLabel}>{t('latex.preview')}</span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            disabled={!value.trim()}
            className={styles.expand}
          >
            ⛶ {t('latex.fullscreen')}
          </button>
        </div>
        <LatexPreview value={value} />
      </div>

      {/* 全屏 overlay：開 fade-in、關 fade-out——closing state 播完 fade-out
          先 unmount（同 MODAL_ANIM_MS 同步），避免「即場消失」 */}
      {expanded && (
        <div
          className={`${styles.modal} ${closing ? styles['modal--closing'] : ''}`}
          onClick={closeModal}
        >
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.toolbar}>
              <span className={styles.toolbarLabel}>{t('latex.previewFullscreen')}</span>
              <button type="button" onClick={closeModal} className={styles.expand}>
                ✕ {t('latex.close')}
              </button>
            </div>
            <div
              className={styles.modalBody}
              dangerouslySetInnerHTML={{ __html: renderLatex(value) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
