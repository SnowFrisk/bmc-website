import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAllSubmissions,
  useUpdateSubmissionStatus,
  useResetSubmissionStatus,
  useUpdateReviewNote,
  useInsertProblem,
  useUpdateProblemActive,
  useUpdateProblem,
} from '../hooks/useSubmissions'
import { useCurrentProblems, useAllMainProblems, fetchPastProblemById } from '../hooks/useSupabase'
import { startPanelTransition } from '../lib/view-transitions'
import { DIFFICULTY_STYLES } from '../data/difficulty-styles'
import { renderLatex } from '../lib/math-renderer'
import LatexInput from '../components/ui/LatexInput'
import Spinner from '../components/ui/Spinner'
import btnStyles from '../components/ui/buttons.module.css'
import styles from './Admin.module.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

function FormField({ label, children }) {
  return (
    <label className={styles.form__field}>
      <span className={styles.form__label}>{label}</span>
      {children}
    </label>
  )
}

// LaTeX 輸入 + 即時預覽由全站共用組件提供（LatexInput，variant="full"）
// ——Admin 示範用；compact variant 預留俾學生場景（SubmitForm/SpeedBattle 等）。

// ── Password gate ──

function AdminGate({ onUnlock }) {
  const { t } = useTranslation()
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
      <h1 className={styles.gate__title}>{t('admin.gateTitle')}</h1>
      <form onSubmit={handleSubmit} className={styles.gate__form}>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          placeholder={t('admin.gatePlaceholder')}
          className={styles.gate__input}
          autoFocus
        />
        <button type="submit" className={styles.gate__button}>{t('admin.unlock')}</button>
      </form>
      {error && <p className={styles.gate__error}>{t('admin.wrongPassword')}</p>}
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

// edit（edit-mode draft）：{ main, steps }——steps 帶 DB id（更新用）；
// 冇 id 嘅行（新加 / legacy 合成步驟）儲存時插入。冇 edit = 新建模式。
function ProblemForm({ edit = null, onSaved, onCancelEdit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => {
    if (edit) {
      const steps = (edit.steps ?? []).map((s, i) => ({
        title: s.title ?? '',
        latex: s.latex ?? '',
        solution: s.solution ?? '',
        points: s.points ?? defaultPoints(i),
        id: s.id ?? null,
      }))
      return {
        cycle_number: String(edit.main.cycle_number ?? ''),
        mainTitle: edit.main.title ?? '',
        mainLatex: edit.main.latex ?? '',
        mainSolution: edit.main.solution ?? '',
        is_active: edit.main.is_active === true,
        stepsCount: steps.length,
        steps,
      }
    }
    return {
      cycle_number: '',
      mainTitle: '',
      mainLatex: '',
      mainSolution: '',
      is_active: true,
      stepsCount: 3,
      steps: emptySteps(3),
    }
  })
  const [notice, setNotice] = useState(null)
  const { mutate: insert, isPending: inserting } = useInsertProblem()
  const { mutate: update, isPending: updating } = useUpdateProblem()
  const isPending = inserting || updating

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
      setNotice({ kind: 'error', text: t('admin.fillRequired') })
      return
    }
    const activeSteps = form.steps.slice(0, form.stepsCount)
    const missingStepLatex = activeSteps.some(s => !s.latex.trim())
    if (missingStepLatex) {
      setNotice({ kind: 'error', text: t('admin.stepLatexRequired') })
      return
    }
    setNotice(null)
    // 步驟 payload：帶 id 嘅行（edit）保留 id 俾 updateProblemGroup 更新；
    // 新建模式冇 id → 插入
    const payload = {
      main: {
        cycle_number: Number(form.cycle_number),
        difficulty_level_id: null,
        title: form.mainTitle.trim(),
        latex: form.mainLatex.trim(),
        solution: form.mainSolution.trim() || null,
        is_active: form.is_active,
      },
      steps: activeSteps.map((s, i) => ({
        ...(s.id ? { id: s.id } : {}),
        cycle_number: Number(form.cycle_number),
        difficulty_level_id: i + 1,
        points: Math.max(1, Number(s.points) || defaultPoints(i)),
        title: s.title.trim() || `Step ${i + 1}`,
        latex: s.latex.trim(),
        solution: s.solution.trim() || null,
        is_active: form.is_active,
      })),
    }
    const opts = {
      onSuccess: () => {
        if (edit) {
          // 編輯完成 → 返去題目管理 list（列表經 invalidate 已更新）
          onSaved?.()
          return
        }
        setForm({
          cycle_number: '',
          mainTitle: '',
          mainLatex: '',
          mainSolution: '',
          is_active: true,
          stepsCount: 3,
          steps: emptySteps(3),
        })
        setNotice({ kind: 'success', text: t('admin.created', { count: form.stepsCount }) })
      },
      onError: err => setNotice({ kind: 'error', text: `${edit ? t('admin.updateFail') : t('admin.createFail')}${err.message}` }),
    }
    if (edit) update({ id: edit.main.id, ...payload }, opts)
    else insert(payload, opts)
  }

  return (
    <section className={styles.section}>
      <div className={styles.form__headRow}>
        <h2 className={styles.section__title}>{edit ? t('admin.editTitle') : t('admin.formTitle')}</h2>
        {edit && (
          <button type="button" onClick={onCancelEdit} className={styles.review__btn}>
            {t('admin.cancelEdit')}
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>

        {/* 大題 */}
        <div className={styles.form__mainGroup}>
          <div className={styles.form__stepHead}>
            <span>{t('admin.mainGroup')}</span>
          </div>
          <div className={styles.form__row}>
            <FormField label={t('admin.cycleNo')}>
              <input
                type="number"
                min="1"
                value={form.cycle_number}
                onChange={e => setField('cycle_number', e.target.value)}
                className={styles.form__input}
                placeholder={t('admin.cyclePlaceholder')}
              />
            </FormField>
            <FormField label={t('admin.mainTitle')}>
              <input
                type="text"
                value={form.mainTitle}
                onChange={e => setField('mainTitle', e.target.value)}
                className={styles.form__input}
                placeholder={t('admin.mainTitlePlaceholder')}
              />
            </FormField>
          </div>
          <LatexInput
            label={t('admin.mainLatexLabel')}
            value={form.mainLatex}
            onChange={v => setField('mainLatex', v)}
            rows={3}
            placeholder={t('admin.mainLatexPlaceholder')}
          />
          <LatexInput
            label={t('admin.solutionLabel')}
            value={form.mainSolution}
            onChange={v => setField('mainSolution', v)}
            rows={2}
            placeholder={t('admin.solutionPlaceholder')}
          />
          <label className={styles.form__checkboxRow}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setField('is_active', e.target.checked)}
              className={styles.form__checkbox}
            />
            <span>{t('admin.isActive')}</span>
          </label>
        </div>

        {/* 步驟數量 */}
        <div className={styles.form__countRow}>
          <span className={styles.form__label}>{t('admin.stepsCount')}</span>
          <input
            type="number"
            min="1"
            max={MAX_STEPS}
            value={form.stepsCount}
            onChange={e => setStepsCount(e.target.value)}
            className={styles.form__input}
            style={{ width: 72 }}
          />
          <span className={styles.form__label}>{t('admin.stepsRange', { max: MAX_STEPS })}</span>
        </div>

        {/* 步驟 */}
        {form.steps.slice(0, form.stepsCount).map((step, i) => (
          <div key={i} className={styles.form__stepGroup}>
            <div className={styles.form__stepHead}>
              <span>{t('admin.step', { n: i + 1 })}</span>
              <span className={styles.form__ptsRow}>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={step.points}
                  onChange={e => setStep(i, 'points', e.target.value)}
                  className={styles.form__ptsInput}
                  aria-label={t('admin.stepPointsAria', { n: i + 1 })}
                />
                <span className={styles.form__stepPtsLabel}>pts</span>
              </span>
            </div>
            <FormField label={t('admin.stepTitleLabel')}>
              <input
                type="text"
                value={step.title}
                onChange={e => setStep(i, 'title', e.target.value)}
                className={styles.form__input}
                placeholder={t('admin.stepTitlePlaceholder')}
              />
            </FormField>
            <LatexInput
              label={t('admin.stepLatexLabel')}
              value={step.latex}
              onChange={v => setStep(i, 'latex', v)}
              rows={2}
              placeholder={t('admin.stepLatexPlaceholder')}
            />
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
              {t('common.connectingEllipsis')}
            </>
          ) : (
            edit ? t('admin.updateBtn') : t('admin.createBtn', { count: form.stepsCount })
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

// 一行提交：狀態 + 批改動作 + 註批（可加可改）+ 改判。
// 抽做 component 因為註批編輯要 local state（noteOpen / noteDraft）。
function ReviewRow({ s, currentProblemIds, onMark, isMarking, onReset, isResetting, onSaveNote, isSavingNote }) {
  const { t } = useTranslation()
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState(s.review_note ?? '')

  const diff = s.problems?.difficulty_levels
  const stepPoints = s.problems?.points ?? diff?.points ?? 0
  const style = DIFFICULTY_STYLES[s.problems?.difficulty_level_id] ?? DIFFICULTY_STYLES[2]

  function saveNote() {
    onSaveNote({ id: s.id, note: noteDraft })
    setNoteOpen(false)
  }

  function cancelNote() {
    setNoteDraft(s.review_note ?? '')
    setNoteOpen(false)
  }

  return (
    <div className={styles.review__row}>
      <div className={styles.review__meta}>
        <span className={styles.review__name}>
          {s.is_anonymous ? t('leaderboard.anon') : s.student_name}
          {currentProblemIds.has(s.problem_id) && (
            <span className={styles.review__currentTag}>{t('admin.currentTag')}</span>
          )}
        </span>
        <span className={styles.review__subtitle}>
          Cycle {s.problems?.cycle_number}
          {s.problems?.step_number != null && ` · Step ${s.problems.step_number}`}
          {' · '}{s.problems?.title}
          {diff && <span style={{ color: style.color }}>（{diff.label} · {stepPoints} pts）</span>}
        </span>
        {/* 提交 code——學生報 code 求助時直接對返（BMC-Submission-Code.md §4.2C） */}
        <span className={styles.review__code}>Code: {s.access_code}</span>
      </div>

      {/* 學生答案——用同一 renderer 渲染（同 /track 一致），唔顯示 raw LaTeX code */}
      <div
        className={styles.review__answer}
        dangerouslySetInnerHTML={{ __html: renderLatex(s.answer ?? '') }}
      />

      {/* 註批：收埋時顯示已有註批 / 「添加」入口；展開時 textarea + 保存 */}
      {noteOpen ? (
        <div className={styles.review__noteEdit}>
          <textarea
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            rows={2}
            placeholder={t('admin.notePlaceholder')}
            className={styles.review__noteInput}
          />
          <div className={styles.review__noteActions}>
            <button onClick={saveNote} disabled={isSavingNote(s.id)} className={styles.review__btn}>
              {isSavingNote(s.id) ? t('admin.savingNote') : t('admin.saveNote')}
            </button>
            <button onClick={cancelNote} className={styles.review__btn}>{t('common.cancel')}</button>
          </div>
        </div>
      ) : s.review_note ? (
        <p className={styles.review__note}>
          <span className={styles.review__noteLabel}>{t('admin.noteLabel')}：</span>
          {s.review_note}
          <button onClick={() => { setNoteDraft(s.review_note); setNoteOpen(true) }} className={styles.review__noteLink}>
            {t('admin.editNote')}
          </button>
        </p>
      ) : (
        <button onClick={() => setNoteOpen(true)} className={styles.review__noteAdd}>＋ {t('admin.addNote')}</button>
      )}

      <div className={styles.review__actions}>
        {s.is_correct === null ? (
          <>
            <button
              onClick={() => onMark({ id: s.id, isCorrect: true, score: stepPoints })}
              disabled={isMarking(s.id)}
              className={`${styles.review__btn} ${styles['review__btn--ok']} ${isMarking(s.id) ? btnStyles.btnPending : ''}`}
            >
              {isMarking(s.id) ? t('common.connectingEllipsis') : `✓ ${t('admin.markCorrect')}`}
            </button>
            <button
              onClick={() => onMark({ id: s.id, isCorrect: false, score: 0 })}
              disabled={isMarking(s.id)}
              className={`${styles.review__btn} ${styles['review__btn--no']} ${isMarking(s.id) ? btnStyles.btnPending : ''}`}
            >
              {isMarking(s.id) ? t('common.connectingEllipsis') : `✗ ${t('admin.markWrong')}`}
            </button>
          </>
        ) : (
          <>
            <span
              key={s.is_correct ? 'ok' : 'no'}
              className={`${styles.review__status} ${
                s.is_correct
                  ? styles['review__status--ok']
                  : styles['review__status--no']
              }`}
            >
              {s.is_correct ? `✓ ${t('track.status.correct')} · ${s.score} pts` : `✗ ${t('track.status.wrong')}`}
            </span>
            {/* 改判：reset 返做待審核（保留註批），再重新判 */}
            <button
              onClick={() => onReset(s.id)}
              disabled={isResetting(s.id)}
              className={`${styles.review__btn} ${isResetting(s.id) ? btnStyles.btnPending : ''}`}
            >
              {isResetting(s.id) ? t('common.connectingEllipsis') : t('admin.rejudge')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SubmissionReview() {
  const { t } = useTranslation()
  const { data: submissions = [], isLoading, error } = useAllSubmissions()
  const { data: current } = useCurrentProblems()
  const currentProblemIds = new Set((current?.problems ?? []).map(p => p.id))
  const { mutate: mark, isPending: marking, variables: markVars } = useUpdateSubmissionStatus()
  const { mutate: reset, isPending: resetting, variables: resetVars } = useResetSubmissionStatus()
  const { mutate: saveNote, isPending: savingNote, variables: noteVars } = useUpdateReviewNote()
  const isMarking = (id) => marking && markVars?.id === id
  const isResetting = (id) => resetting && resetVars?.id === id
  const isSavingNote = (id) => savingNote && noteVars?.id === id

  if (isLoading) return <p className={styles.section__muted}>{t('common.loading')}</p>
  if (error) return <p className={styles.section__muted} style={{ color: 'var(--red)' }}>{t('common.loadError')}{error.message}</p>

  const pending = submissions.filter(s => s.is_correct === null)
  const reviewed = submissions.filter(s => s.is_correct !== null)

  const rowProps = { currentProblemIds, onMark: mark, isMarking, onReset: reset, isResetting, onSaveNote: saveNote, isSavingNote }

  return (
    <section className={styles.section}>
      <h2 className={styles.section__title}>{t('admin.submissions')}</h2>

      {pending.length > 0 && (
        <>
          <h3 className={styles.section__subtitle}>{t('admin.pending', { count: pending.length })}</h3>
          <div className={styles.review__list}>{pending.map(s => <ReviewRow key={s.id} s={s} {...rowProps} />)}</div>
        </>
      )}

      <h3 className={styles.section__subtitle}>{t('admin.reviewed', { count: reviewed.length })}</h3>
      {reviewed.length === 0 ? (
        <p className={styles.section__muted}>{t('admin.noReviewed')}</p>
      ) : (
        <div className={styles.review__list}>{reviewed.map(s => <ReviewRow key={s.id} s={s} {...rowProps} />)}</div>
      )}
    </section>
  )
}

// ── Problem archive management ──

function ProblemArchive({ onEdit }) {
  const { t } = useTranslation()
  const { data: rows = [], isLoading } = useAllMainProblems()
  const { mutate: toggle, isPending, variables } = useUpdateProblemActive()

  // Only the row whose id matches the in-flight mutation shows "連接中"
  const isToggling = (id) => isPending && variables?.id === id

  // Annotate active state for display (current = is_active true)
  const annotated = rows.map(p => ({ ...p, _active: p.is_active === true }))

  return (
    <section className={styles.section}>
      <h2 className={styles.section__title}>{t('admin.tab.archive')}</h2>
      {isLoading ? (
        <p className={styles.section__muted}>{t('common.loading')}</p>
      ) : annotated.length === 0 ? (
        <p className={styles.section__muted}>{t('admin.noProblems')}</p>
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
                      {t('past.steps', { count: stepCount })}
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
                    {p._active ? t('admin.current') : t('admin.archived')}
                  </span>
                  <button onClick={() => onEdit(p)} className={styles.review__btn}>{t('bank.edit')}</button>
                  <button
                    onClick={() => toggle({ id: p.id, isActive: !p._active })}
                    disabled={isToggling(p.id)}
                    className={`${styles.review__btn} ${isToggling(p.id) ? btnStyles.btnPending : ''}`}
                  >
                    {isToggling(p.id) ? t('common.connectingEllipsis') : (p._active ? t('admin.archive') : t('admin.makeCurrent'))}
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
  const { t } = useTranslation()
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState('new')
  // 編輯模式 draft（{ main, steps }）；null = 出題表單係新建模式
  const [editing, setEditing] = useState(null)

  // Tab 切換用全站 panel-swap View Transition（同 SpeedMath mode 切換一致）
  function switchTab(next) {
    if (next === tab) return
    startPanelTransition(() => setTab(next))
  }

  // 編輯：載入完整題組（大題 + 步驟）入出題表單（edit 模式）。
  // Legacy 單層題目嘅合成步驟同大題同 id——剝走 id，儲存時會插入真實
  // 步驟（唔會覆寫大題 row）。
  async function startEdit(p) {
    try {
      const full = await fetchPastProblemById(p.id)
      if (!full) return
      const steps = (full.steps ?? []).map(s => (s.id === full.id ? { ...s, id: null } : s))
      setEditing({ main: full, steps })
      switchTab('new')
    } catch { /* ignore — 載入失敗留喺題目管理 */ }
  }

  if (!ADMIN_PASSWORD) {
    return (
      <div className={styles.container}>
        <p className={styles.section__muted} style={{ textAlign: 'center', padding: '3rem 0' }}>
          {t('admin.notConfigured')}
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
      <h1 className={styles.pageTitle}>{t('admin.gateTitle')}</h1>

      <nav className={styles.tabs}>
        {[
          { id: 'new', labelKey: 'admin.tab.new' },
          { id: 'review', labelKey: 'admin.tab.review' },
          { id: 'archive', labelKey: 'admin.tab.archive' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { if (t.id === 'new') setEditing(null); switchTab(t.id) }}
            className={`${styles.tab} ${tab === t.id ? styles['tab--active'] : ''}`}
          >
            {t(t.labelKey)}
          </button>
        ))}
      </nav>

      {/* 只有 tab 內容區做 panel-swap 動畫（title + tab nav 保持唔郁）。
          key 令 editing 改變時重 mount 表單（edit ↔ create 切換先會
          重新初始化；同一 edit 目標重開唔會帶舊 input） */}
      <div className={styles.tabPanel}>
        {tab === 'new' && (
          <ProblemForm
            key={editing ? `edit-${editing.main.id}` : 'create'}
            edit={editing}
            onSaved={() => { setEditing(null); switchTab('archive') }}
            onCancelEdit={() => setEditing(null)}
          />
        )}
        {tab === 'review' && <SubmissionReview />}
        {tab === 'archive' && <ProblemArchive onEdit={startEdit} />}
      </div>
    </div>
  )
}
