import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { useTrackSubmission, useUpdateTrackedAnswer } from '../hooks/useSubmissions'
import { renderLatex } from '../lib/math-renderer'
import LatexInput from '../components/ui/LatexInput'
import btnStyles from '../components/ui/buttons.module.css'
import styles from './TrackSubmission.module.css'

/**
 * /track — 用提交 code 查看批改狀態 / 修改答案（零登入方案）。
 * 架構考慮（BMC-Submission-Code.md §4.1）：獨立路由而唔係塞入 problem 頁——
 * 職責單一、可深鏈接（?code= 刷新唔 lost）、code 係私人憑證唔污染問題頁 URL。
 */
export default function TrackSubmission() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlCode = (searchParams.get('code') ?? '').trim().toUpperCase()
  const [input, setInput] = useState(urlCode)
  const [activeCode, setActiveCode] = useState(urlCode) // 實際查詢緊嘅 code
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState(null) // { kind: 'success'|'error', text }
  const { t } = useTranslation()

  const { data: sub, isLoading, error, refetch } = useTrackSubmission(activeCode || null)
  const { mutate: saveAnswer, isPending: saving } = useUpdateTrackedAnswer()

  function submitLookup(e) {
    e.preventDefault()
    const code = input.trim().toUpperCase()
    if (!code) return
    // URL 同步 code（replace：唔污染瀏覽器歷史）；query 重新觸發
    setSearchParams({ code }, { replace: true })
    setActiveCode(code)
    setEditing(false)
    setNotice(null)
  }

  function startEdit() {
    setDraft(sub?.answer ?? '')
    setEditing(true)
    setNotice(null)
  }

  function handleSave() {
    if (!draft.trim()) {
      setNotice({ kind: 'error', text: t('track.answerRequired') })
      return
    }
    saveAnswer(
      { code: activeCode, answer: draft },
      {
        onSuccess: () => {
          setEditing(false)
          setNotice({ kind: 'success', text: t('track.saved') })
          refetch()
        },
        onError: (err) => {
          setNotice({ kind: 'error', text: err.message })
        },
      },
    )
  }

  const locale = i18n.language?.startsWith('zh') ? 'zh-TW' : 'en-US'
  const dateStr = sub?.submitted_at
    ? new Date(sub.submitted_at).toLocaleString(locale, {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : ''

  // 訂正規則（2026-08-16 更正）：未批改 → 修改；已批改 + 答錯 + 截止前 → 訂正；
  // 已批改答啱 → 永遠鎖定（答啱冇需要訂正）。
  const endDateMs = sub?.problems?.end_date ? new Date(sub.problems.end_date).getTime() : null
  // eslint-disable-next-line react-hooks/purity -- 「而家」係時間依賴值，訂正按鈕需要反映當刻（後端 update 有相同檢查做保險）
  const canEdit = sub != null && (sub.is_correct === null || (sub.is_correct === false && endDateMs != null && Date.now() < endDateMs))
  const endDateStr = sub?.problems?.end_date
    ? new Date(sub.problems.end_date).toLocaleDateString(locale, { month: '2-digit', day: '2-digit' })
    : null

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('track.title')}</h1>
      <p className={styles.lead}>{t('track.lead')}</p>

      {/* ── Lookup ── */}
      <form onSubmit={submitLookup} className={styles.lookup}>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder={t('track.codePlaceholder')}
          spellCheck={false}
          autoCapitalize="characters"
          className={styles.lookup__input}
        />
        <button type="submit" className={`${styles.lookup__btn} ${btnStyles.btnPrimary}`}>
          {t('track.lookup')}
        </button>
      </form>

      {/* ── 結果 ── */}
      {isLoading && <p className={styles.muted}>{t('common.loading')}</p>}

      {error && <p className={styles.error}>{t('track.lookupFailed')}{error.message}</p>}

      {!isLoading && !error && activeCode && !sub && (
        <p className={styles.muted}>{t('track.notFound')}</p>
      )}

      {sub && (
        <div className={styles.result}>
          {/* Header: 題目元資料 + 狀態 badge */}
          <div className={styles.result__header}>
            <span className={styles.result__title}>
              Cycle {sub.problems?.cycle_number}
              {sub.problems?.step_number != null && ` · Step ${sub.problems.step_number}`}
              {sub.problems?.title ? ` · ${sub.problems.title}` : ''}
            </span>
            <span className={`${styles.badge} ${styles[`badge--${statusKey(sub.is_correct)}`]}`}>
              {statusText(sub.is_correct, sub.score, t)}
            </span>
          </div>

          {/* 題目 */}
          <div
            className={styles.result__problem}
            dangerouslySetInnerHTML={{ __html: renderLatex(sub.problems?.latex ?? '') }}
          />

          {/* 我的答案 */}
          <div className={styles.result__answer}>
            <span className={styles.result__label}>{t('track.myAnswer')}</span>
            <div
              className={styles.result__answerBody}
              dangerouslySetInnerHTML={{ __html: renderLatex(sub.answer) }}
            />
          </div>

          {/* 批改註批（admin 寫嘅評語） */}
          {sub.review_note && (
            <p className={styles.result__note}>
              <span className={styles.result__noteLabel}>{t('track.reviewNote')}：</span>
              {sub.review_note}
            </p>
          )}

          <p className={styles.result__meta}>
            {t('track.score')}{sub.is_correct ? `${sub.score} pts` : '—'}
            {' · '}{t('track.submittedAt')}{dateStr}
            {endDateStr && ` · ${t('track.deadline')}${endDateStr}`}
          </p>

          {/* ── 修改區 ── */}
          {editing ? (
            <div className={styles.edit}>
              {/* 訂正輸入：LaTeX + 即時預覽（共用組件 compact 多行版） */}
              <LatexInput
                variant="compact"
                multiline
                value={draft}
                onChange={setDraft}
                rows={4}
                placeholder={t('submit.answerPlaceholder')}
              />
              <div className={styles.edit__actions}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`${styles.edit__save} ${btnStyles.btnPrimary} ${saving ? btnStyles.btnPending : ''}`}
                >
                  {saving ? t('track.saving') : t('track.saveEdit')}
                </button>
                <button onClick={() => { setEditing(false); setNotice(null) }} className={btnStyles.btnSecondary}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.result__actions}>
              {canEdit ? (
                sub.is_correct === null ? (
                  <button onClick={startEdit} className={btnStyles.btnPrimary}>
                    {t('track.editAnswer')}
                  </button>
                ) : (
                  <>
                    {/* 已批改 + 答錯 + 截止前 → 訂正：訂正後 reset 待批改，要重新審核 */}
                    <button onClick={startEdit} className={btnStyles.btnPrimary}>
                      {t('track.correctAnswer')}
                    </button>
                    <span className={styles.result__lockHint}>{t('track.correctHint')}</span>
                  </>
                )
              ) : (
                <p className={styles.result__locked}>
                  {sub.is_correct === true
                    ? t('track.lockedCorrect')
                    : t('track.lockedDeadline')}
                </p>
              )}
            </div>
          )}

          {notice && (
            <p className={styles.notice} style={{ color: notice.kind === 'success' ? 'var(--green)' : 'var(--red)' }}>
              {notice.text}
            </p>
          )}

          <p className={styles.hint}>⚠️ {t('submit.saveCodeHint')}</p>
        </div>
      )}
    </div>
  )
}

// ── 狀態 badge helpers ──
// 待批改（金）/ 正確（綠）/ 錯誤（紅）——同全站色系一致
function statusKey(isCorrect) {
  if (isCorrect === null) return 'pending'
  return isCorrect ? 'ok' : 'no'
}

function statusText(isCorrect, score, t) {
  if (isCorrect === null) return t('track.status.pending')
  return isCorrect ? `✓ ${t('track.status.correct')} · ${score} pts` : `✗ ${t('track.status.wrong')}`
}
