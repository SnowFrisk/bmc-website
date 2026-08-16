import { useState } from 'react'
import { useSubmitAnswer } from '../../hooks/useSubmissions'
import { DIFFICULTY_STYLES } from '../../data/difficulty-styles'
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

  const { mutate, isPending } = useSubmitAnswer()

  if (!activeProblem) return null

  const style = DIFFICULTY_STYLES[activeProblem.difficulty_level_id] ?? DIFFICULTY_STYLES[2]

  function handleSubmit(e) {
    e.preventDefault()
    if (!studentName.trim() && !isAnonymous) {
      setNotice({ kind: 'error', text: '請填寫姓名，或選擇匿名提交。' })
      return
    }
    if (!answer.trim()) {
      setNotice({ kind: 'error', text: '請填寫答案。' })
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
        onSuccess: () => {
          setAnswer('')
          onSubmitted?.(activeProblem.step_number)
          setNotice({
            kind: 'success',
            text: '提交成功！答案將於本週截止後揭曉。',
          })
        },
        onError: (err) => {
          setNotice({ kind: 'error', text: `提交失敗：${err.message}` })
        },
      },
    )
  }

  return (
    <section
      className={`${styles.submitForm} ${inline ? styles.submitForm__inline : ''}`}
      style={{ borderColor: style.color }}
    >
      <h2 className={styles.submitForm__heading} style={{ color: style.color }}>
        {activeProblem.step_number
          ? `提交答案 · Step ${activeProblem.step_number}（${activeProblem.points ?? difficulty?.points ?? 0} pts）`
          : '提交答案'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Name row: name input (hidden when anonymous) + anonymous toggle */}
        <div className={styles.submitForm__nameRow}>
          {!isAnonymous && (
            <label className={styles.submitForm__field}>
              <span className={styles.submitForm__label}>姓名</span>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="你的名字"
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
            <span className={styles.submitForm__anonLabel}>匿名提交</span>
          </label>
        </div>

        {/* Answer */}
        <label className={styles.submitForm__field}>
          <span className={styles.submitForm__label}>答案 / 思路</span>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={4}
            placeholder="寫低你嘅答案同解題思路……"
            className={styles.submitForm__textarea}
          />
        </label>

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
              正在連接…
            </>
          ) : (
            '提交答案'
          )}
        </button>
      </form>

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
