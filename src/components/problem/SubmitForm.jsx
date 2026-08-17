import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSubmitAnswer } from '../../hooks/useSubmissions'
import { DIFFICULTY_STYLES } from '../../data/difficulty-styles'
import LatexInput from '../ui/LatexInput'
import Spinner from '../ui/Spinner'
import btnStyles from '../ui/buttons.module.css'
import styles from './SubmitForm.module.css'

/**
 * Answer submission form.
 * props:
 *  - steps: current-cycle steps (each with id, step_number,
 *    difficulty_level_id, difficulty_levels.{label, points}, title, latex)
 *  - activeStepNumber: currently selected step (1|2|3)
 *  - onSubmitted(stepNumber): callback after a successful submit
 */
export default function SubmitForm({ steps, activeStepNumber, onSubmitted, inline = false }) {
  const activeProblem = steps.find(s => s.step_number === activeStepNumber)
  const difficulty = activeProblem?.difficulty_levels

  const [studentName, setStudentName] = useState('')
  const [answer, setAnswer] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [notice, setNotice] = useState(null) // { kind: 'success'|'error', text }
  // phase: 'form' → 填表；'leaving' → 提交成功、表格淡出中；'done' → 顯示 code 卡
  const [phase, setPhase] = useState('form')
  const [submittedCode, setSubmittedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { mutate, isPending } = useSubmitAnswer()

  if (!activeProblem) return null

  const style = DIFFICULTY_STYLES[activeProblem.difficulty_level_id] ?? DIFFICULTY_STYLES[2]

  function handleSubmit(e) {
    e.preventDefault()
    if (!studentName.trim() && !isAnonymous) {
      setNotice({ kind: 'error', text: t('submit.nameRequired') })
      return
    }
    if (!answer.trim()) {
      setNotice({ kind: 'error', text: t('submit.answerRequired') })
      return
    }

    setNotice(null)
    mutate(
      {
        problem_id: activeProblem.id,
        student_name: isAnonymous ? null : studentName.trim(),
        is_anonymous: isAnonymous,
        answer: answer.trim(),
      },
      {
        onSuccess: (data) => {
          setAnswer('')
          onSubmitted?.(activeProblem.step_number)
          setSubmittedCode(data?.access_code ?? '')
          setPhase('leaving') // 表格 fade out 0.3s，之後先換 code 卡（舊先走、新人）
          setTimeout(() => setPhase('done'), 350)
          setNotice({
            kind: 'success',
            text: t('submit.success'),
          })
        },
        onError: (err) => {
          setNotice({ kind: 'error', text: `${t('submit.failed')}${err.message}` })
        },
      },
    )
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(submittedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard 唔可用（舊瀏覽器）——唔影響主流程，用家可以直接揀字
    }
  }

  return (
    <section
      className={`${styles.submitForm} ${inline ? styles.submitForm__inline : ''}`}
      style={{ borderColor: style.color }}
    >
      <h2 className={styles.submitForm__heading} style={{ color: style.color }}>
        {activeProblem.step_number
          ? `${t('submit.submitAnswer')} · Step ${activeProblem.step_number}（${activeProblem.points ?? difficulty?.points ?? 0} pts）`
          : t('submit.submitAnswer')}
      </h2>

      {phase === 'done' ? (
        /* ── 提交成功 → Code 卡（表格已淡出）──
           code 就係身份憑證：撳一下全揀（user-select: all）、可複製、可跳去 /track 查看/修改。 */
        <div className={styles.submitForm__codeCard} role="status">
          <p className={styles.submitForm__codeTitle}>✓ {t('submit.successShort')}</p>
          <p className={styles.submitForm__code}>{submittedCode}</p>
          <div className={styles.submitForm__codeActions}>
            <button
              type="button"
              onClick={copyCode}
              className={btnStyles.btnSecondary}
              style={{ '--btn-accent': style.color }}
            >
              {copied ? t('submit.copied') : t('submit.copyCode')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/track?code=${submittedCode}`)}
              className={btnStyles.btnPrimary}
              style={{ '--btn-accent': style.color }}
            >
              {t('submit.viewTrack')} →
            </button>
          </div>
          <p className={styles.submitForm__codeHint}>
            ⚠️ {t('submit.saveCodeHint')}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={phase === 'leaving' ? styles.submitForm__fadeOut : undefined}
        >
          {/* Name row: name input (hidden when anonymous) + anonymous toggle */}
          <div className={styles.submitForm__nameRow}>
            {!isAnonymous && (
              <label className={styles.submitForm__field}>
                <span className={styles.submitForm__label}>{t('submit.name')}</span>
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder={t('submit.namePlaceholder')}
                  className={styles.submitForm__input}
                />
              </label>
            )}
            <label className={styles.submitForm__anonRow}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className={styles.submitForm__checkbox}
                style={{ accentColor: style.color }}
              />
              <span className={styles.submitForm__anonLabel}>{t('submit.anonymous')}</span>
            </label>
          </div>

          {/* Answer——LaTeX 輸入 + 即時預覽（共用組件 compact 多行版） */}
          <LatexInput
            variant="compact"
            multiline
            label={t('submit.answerLabel')}
            value={answer}
            onChange={setAnswer}
            rows={4}
            placeholder={t('submit.answerPlaceholder')}
          />

          {/* Submit — accent colour passed via CSS var so :hover can build on it.
              While the request is in flight we swap in a spinner + "正在連接"
              so a slow network reads as work in progress, not a frozen page. */}
          <button
            type="submit"
            disabled={isPending}
            className={`${styles.submitForm__button} ${isPending ? btnStyles.btnPending : ''}`}
            style={{ '--btn-accent': style.color }}
          >
            {isPending ? (
              <>
                <Spinner />
                {t('common.connectingEllipsis')}
              </>
            ) : (
              '提交答案'
            )}
          </button>
        </form>
      )}

      {/* Feedback — stays in the DOM so its height can animate (design system §6.2) */}
      <div
        className={`${styles.submitForm__noticeWrap} ${notice ? styles.submitForm__noticeWrap_open : ''}`}
        aria-live="polite"
      >
        <div className={styles.submitForm__noticeInner}>
          {notice && (
            <p
              className={styles.submitForm__notice}
              style={{
                color: notice.kind === 'success' ? 'var(--green)' : 'var(--red)',
              }}
            >
              {notice.text}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
