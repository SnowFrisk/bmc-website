import { useState } from 'react'
import { useAllSubmissions, useUpdateSubmissionStatus, useInsertProblem, useUpdateProblemActive } from '../hooks/useSubmissions'
import { useCurrentProblems, useAllMainProblems } from '../hooks/useSupabase'
import { DIFFICULTY_STYLES } from '../components/problem/ProblemCard'
import Spinner from '../components/ui/Spinner'
import btnStyles from '../components/ui/buttons.module.css'
import styles from './Admin.module.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

function DifficultySelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(Number(e.target.value))} className={styles.form__select}>
      <option value={1}>Easy（3 pts）</option>
      <option value={2}>Medium（5 pts）</option>
      <option value={3}>Hard（8 pts）</option>
    </select>
  )
}

function FormField({ label, children }) {
  return (
    <label className={styles.form__field}>
      <span className={styles.form__label}>{label}</span>
      {children}
    </label>
  )
}

// ── Password gate ──

function AdminGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (input === ADMIN_PASSWORD) {
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <div className={styles.gate}>
      <h1 className={styles.gate__title}>管理後台</h1>
      <form onSubmit={handleSubmit} className={styles.gate__form}>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          placeholder="輸入管理密碼"
          className={styles.gate__input}
          autoFocus
        />
        <button type="submit" className={styles.gate__button}>解鎖</button>
      </form>
      {error && <p className={styles.gate__error}>密碼錯誤。</p>}
    </div>
  )
}

// ── New problem form（大題 + N 個步驟）──

// Default per-step points: 3, 5, 7, 9, 11… (linear, editable by the setter)
const MAX_STEPS = 10
function defaultPoints(i) {
  return 3 + 2 * i
}

function emptySteps(n) {
  return Array.from({ length: n }, (_, i) => ({
    title: '',
    latex: '',
    solution: '',
    points: defaultPoints(i),
  }))
}

function ProblemForm() {
  const [form, setForm] = useState({
    cycle_number: '',
    mainTitle: '',
    mainLatex: '',
    mainSolution: '',
    is_active: true,
    stepsCount: 3,
    steps: emptySteps(3),
  })
  const [notice, setNotice] = useState(null)
  const { mutate, isPending } = useInsertProblem()

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function setStep(i, key, value) {
    setForm(prev => {
      const steps = prev.steps.map((s, idx) => (idx === i ? { ...s, [key]: value } : s))
      return { ...prev, steps }
    })
  }

  // Resize the step array: growing appends defaults, shrinking truncates
  // while preserving the steps the setter already filled in.
  function setStepsCount(n) {
    const clamped = Math.max(1, Math.min(MAX_STEPS, Number(n) || 1))
    setForm(prev => {
      const steps = Array.from({ length: clamped }, (_, i) =>
        prev.steps[i] ?? { title: '', latex: '', solution: '', points: defaultPoints(i) }
      )
      return { ...prev, stepsCount: clamped, steps }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.cycle_number || !form.mainTitle.trim() || !form.mainLatex.trim()) {
      setNotice({ kind: 'error', text: '請填寫 Cycle 編號、大題標題同大題內容。' })
      return
    }
    const activeSteps = form.steps.slice(0, form.stepsCount)
    const missingStepLatex = activeSteps.some(s => !s.latex.trim())
    if (missingStepLatex) {
      setNotice({ kind: 'error', text: '每個步驟都要填寫 LaTeX 內容（標題可留空，會自動用 Step N）。' })
      return
    }
    setNotice(null)
    mutate(
      {
        main: {
          cycle_number: Number(form.cycle_number),
          difficulty_level_id: null,
          title: form.mainTitle.trim(),
          latex: form.mainLatex.trim(),
          solution: form.mainSolution.trim() || null,
          is_active: form.is_active,
        },
        steps: activeSteps.map((s, i) => ({
          cycle_number: Number(form.cycle_number),
          difficulty_level_id: i + 1,
          points: Math.max(1, Number(s.points) || defaultPoints(i)),
          title: s.title.trim() || `Step ${i + 1}`,
          latex: s.latex.trim(),
          solution: s.solution.trim() || null,
          is_active: form.is_active,
        })),
      },
      {
        onSuccess: () => {
          setForm({
            cycle_number: '',
            mainTitle: '',
            mainLatex: '',
            mainSolution: '',
            is_active: true,
            stepsCount: 3,
            steps: emptySteps(3),
          })
          setNotice({ kind: 'success', text: `已建立大題 + ${form.stepsCount} 個步驟。` })
        },
        onError: err => setNotice({ kind: 'error', text: `建立失敗：${err.message}` }),
      },
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.section__title}>出題表單</h2>
      <form onSubmit={handleSubmit} className={styles.form}>

        {/* 大題 */}
        <div className={styles.form__mainGroup}>
          <div className={styles.form__stepHead}>
            <span>本週大題</span>
          </div>
          <div className={styles.form__row}>
            <FormField label="Cycle 編號">
              <input
                type="number"
                min="1"
                value={form.cycle_number}
                onChange={e => setField('cycle_number', e.target.value)}
                className={styles.form__input}
                placeholder="例如 2"
              />
            </FormField>
            <FormField label="大題標題">
              <input
                type="text"
                value={form.mainTitle}
                onChange={e => setField('mainTitle', e.target.value)}
                className={styles.form__input}
                placeholder="例如 立方和公式"
              />
            </FormField>
          </div>
          <FormField label="大題內容（LaTeX，用 $...$ 包住公式）">
            <textarea
              value={form.mainLatex}
              onChange={e => setField('mainLatex', e.target.value)}
              rows={3}
              className={styles.form__textarea}
              placeholder={'例如：證明 $\sum_{k=1}^{n} k^3 = \left( \frac{n(n+1)}{2} \right)^2$'}
            />
          </FormField>
          <FormField label="官方解法（可選，LaTeX）">
            <textarea
              value={form.mainSolution}
              onChange={e => setField('mainSolution', e.target.value)}
              rows={2}
              className={styles.form__textarea}
              placeholder="（可留空，之後再補充）"
            />
          </FormField>
          <label className={styles.form__checkboxRow}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setField('is_active', e.target.checked)}
              className={styles.form__checkbox}
            />
            <span>立即設定為本週題目（is_active）</span>
          </label>
        </div>

        {/* 步驟數量 */}
        <div className={styles.form__countRow}>
          <span className={styles.form__label}>步驟數量：</span>
          <input
            type="number"
            min="1"
            max={MAX_STEPS}
            value={form.stepsCount}
            onChange={e => setStepsCount(e.target.value)}
            className={styles.form__input}
            style={{ width: 72 }}
          />
          <span className={styles.form__label}>（1–{MAX_STEPS}）</span>
        </div>

        {/* 步驟 */}
        {form.steps.slice(0, form.stepsCount).map((step, i) => (
          <div key={i} className={styles.form__stepGroup}>
            <div className={styles.form__stepHead}>
              <span>Step {i + 1}</span>
              <span className={styles.form__ptsRow}>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={step.points}
                  onChange={e => setStep(i, 'points', e.target.value)}
                  className={styles.form__ptsInput}
                  aria-label={`Step ${i + 1} 分數`}
                />
                <span className={styles.form__stepPtsLabel}>pts</span>
              </span>
            </div>
            <FormField label="小題標題（可留空，自動用 Step N）">
              <input
                type="text"
                value={step.title}
                onChange={e => setStep(i, 'title', e.target.value)}
                className={styles.form__input}
                placeholder="例如 證明等差求和公式"
              />
            </FormField>
            <FormField label="內容（LaTeX）">
              <textarea
                value={step.latex}
                onChange={e => setStep(i, 'latex', e.target.value)}
                rows={2}
                className={styles.form__textarea}
                placeholder={'例如：證明 $1 + 2 + \\cdots + n = \frac{n(n+1)}{2}$'}
              />
            </FormField>
          </div>
        ))}

        <button
          type="submit"
          disabled={isPending}
          className={`${styles.form__submit} ${isPending ? btnStyles.btnPending : ''}`}
        >
          {isPending ? (
            <>
              <Spinner />
              正在連接…
            </>
          ) : (
            `建立本週題目（大題 + ${form.stepsCount} 步）`
          )}
        </button>

        {notice && (
          <p className={styles.form__notice} style={{ color: notice.kind === 'success' ? 'var(--green)' : 'var(--red)' }}>
            {notice.text}
          </p>
        )}
      </form>
    </section>
  )
}

// ── Submission review ──

function SubmissionReview() {
  const { data: submissions = [], isLoading, error } = useAllSubmissions()
  const { data: current } = useCurrentProblems()
  const currentProblemIds = new Set((current?.problems ?? []).map(p => p.id))
  const { mutate: mark, isPending: marking, variables: markVars } = useUpdateSubmissionStatus()
  const isMarking = (id) => marking && markVars?.id === id

  if (isLoading) return <p className={styles.section__muted}>載入中……</p>
  if (error) return <p className={styles.section__muted} style={{ color: 'var(--red)' }}>無法載入：{error.message}</p>

  const pending = submissions.filter(s => s.is_correct === null)
  const reviewed = submissions.filter(s => s.is_correct !== null)

  function renderRow(s) {
    const diff = s.problems?.difficulty_levels
    const stepPoints = s.problems?.points ?? diff?.points ?? 0
    const style = DIFFICULTY_STYLES[s.problems?.difficulty_level_id] ?? DIFFICULTY_STYLES[2]
    return (
      <div key={s.id} className={styles.review__row}>
        <div className={styles.review__meta}>
          <span className={styles.review__name}>
            {s.is_anonymous ? '匿名' : s.student_name}
            {currentProblemIds.has(s.problem_id) && (
              <span className={styles.review__currentTag}>本週</span>
            )}
          </span>
          <span className={styles.review__subtitle}>
            Cycle {s.problems?.cycle_number}
            {s.problems?.step_number != null && ` · Step ${s.problems.step_number}`}
            {' · '}{s.problems?.title}
            {diff && <span style={{ color: style.color }}>（{diff.label} · {stepPoints} pts）</span>}
          </span>
        </div>
        <p className={styles.review__answer}>{s.answer}</p>
        <div className={styles.review__actions}>
          {s.is_correct === null ? (
            <>
              <button
                onClick={() => mark({ id: s.id, isCorrect: true, score: stepPoints })}
                disabled={isMarking(s.id)}
                className={`${styles.review__btn} ${styles['review__btn--ok']} ${isMarking(s.id) ? btnStyles.btnPending : ''}`}
              >
                {isMarking(s.id) ? '連接中…' : '✓ 正確'}
              </button>
              <button
                onClick={() => mark({ id: s.id, isCorrect: false, score: 0 })}
                disabled={isMarking(s.id)}
                className={`${styles.review__btn} ${styles['review__btn--no']} ${isMarking(s.id) ? btnStyles.btnPending : ''}`}
              >
                {isMarking(s.id) ? '連接中…' : '✗ 錯誤'}
              </button>
            </>
          ) : (
            <span
              key={s.is_correct ? 'ok' : 'no'}
              className={`${styles.review__status} ${
                s.is_correct
                  ? styles['review__status--ok']
                  : styles['review__status--no']
              }`}
            >
              {s.is_correct ? `✓ 正確 · ${s.score} pts` : '✗ 錯誤'}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.section__title}>提交紀錄</h2>

      {pending.length > 0 && (
        <>
          <h3 className={styles.section__subtitle}>待審核（{pending.length}）</h3>
          <div className={styles.review__list}>{pending.map(renderRow)}</div>
        </>
      )}

      <h3 className={styles.section__subtitle}>已審核（{reviewed.length}）</h3>
      {reviewed.length === 0 ? (
        <p className={styles.section__muted}>尚未審核任何提交。</p>
      ) : (
        <div className={styles.review__list}>{reviewed.map(renderRow)}</div>
      )}
    </section>
  )
}

// ── Problem archive management ──

function ProblemArchive() {
  const { data: rows = [], isLoading } = useAllMainProblems()
  const { mutate: toggle, isPending, variables } = useUpdateProblemActive()

  // Only the row whose id matches the in-flight mutation shows "連接中"
  const isToggling = (id) => isPending && variables?.id === id

  // Annotate active state for display (current = is_active true)
  const annotated = rows.map(p => ({ ...p, _active: p.is_active === true }))

  return (
    <section className={styles.section}>
      <h2 className={styles.section__title}>題目管理</h2>
      {isLoading ? (
        <p className={styles.section__muted}>載入中……</p>
      ) : annotated.length === 0 ? (
        <p className={styles.section__muted}>尚未建立題目。</p>
      ) : (
        <div className={styles.review__list}>
          {annotated.map(p => {
            const stepCount = p.steps?.length ?? 1
            return (
              <div key={p.id} className={styles.review__row}>
                <div className={styles.review__meta}>
                  <span className={styles.review__name}>
                    Cycle {p.cycle_number} · {p.title}
                    <span className={styles.review__currentTag} style={{ color: 'var(--text-muted)' }}>
                      {stepCount} 步
                    </span>
                  </span>
                </div>
                <div className={styles.review__actions}>
                  {/* key remounts the badge on state change → fades in smoothly */}
                  <span
                    key={p._active ? 'active' : 'archived'}
                    className={`${styles.review__status} ${
                      p._active
                        ? styles['review__status--active']
                        : styles['review__status--archived']
                    }`}
                  >
                    {p._active ? '本週' : '已歸檔'}
                  </span>
                  <button
                    onClick={() => toggle({ id: p.id, isActive: !p._active })}
                    disabled={isToggling(p.id)}
                    className={`${styles.review__btn} ${isToggling(p.id) ? btnStyles.btnPending : ''}`}
                  >
                    {isToggling(p.id) ? '連接中…' : (p._active ? '歸檔' : '設為本週')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Page ──

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState('new')

  if (!ADMIN_PASSWORD) {
    return (
      <div className={styles.container}>
        <p className={styles.section__muted} style={{ textAlign: 'center', padding: '3rem 0' }}>
          未配置 VITE_ADMIN_PASSWORD，管理後台已停用。
        </p>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className={styles.container}>
        <AdminGate onUnlock={() => setUnlocked(true)} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>管理後台</h1>

      <nav className={styles.tabs}>
        {[
          { id: 'new', label: '出題' },
          { id: 'review', label: '審核提交' },
          { id: 'archive', label: '題目管理' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`${styles.tab} ${tab === t.id ? styles['tab--active'] : ''}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'new' && <ProblemForm />}
      {tab === 'review' && <SubmissionReview />}
      {tab === 'archive' && <ProblemArchive />}
    </div>
  )
}
