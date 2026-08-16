import { useState, Fragment, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useCurrentProblems } from '../hooks/useSupabase'
import { ProblemCard } from '../components/problem/ProblemCard'
import SubmitForm from '../components/problem/SubmitForm'
import Leaderboard from '../components/problem/Leaderboard'
import { Skeleton } from '../components/ui/Skeleton'
import { renderLatex } from '../lib/math-renderer'
import styles from './ProblemOfCycle.module.css'

// ── Static fallback — shown when Supabase is not yet configured ──
const FALLBACK_GROUP = {
  id: 'fallback-main',
  cycle_number: 1,
  title: '立方和公式',
  latex: String.raw`對於任意正整數 $n$，證明：$\sum_{k=1}^{n} k^3 = \left( \frac{n(n+1)}{2} \right)^2$`,
  steps: [
    {
      id: 'fallback-s1',
      step_number: 1,
      difficulty_level_id: 1,
      title: '等差求和公式',
      latex: String.raw`證明 $1 + 2 + \cdots + n = \frac{n(n+1)}{2}$。`,
      difficulty_levels: { id: 1, label: 'Easy', points: 3 },
    },
    {
      id: 'fallback-s2',
      step_number: 2,
      difficulty_level_id: 2,
      title: '代入展開',
      latex: String.raw`證明 $\sum_{k=1}^{n} k^3$ 可以寫成 $\left( \frac{n(n+1)}{2} \right)^2$ 嘅形式。`,
      difficulty_levels: { id: 2, label: 'Medium', points: 5 },
    },
    {
      id: 'fallback-s3',
      step_number: 3,
      difficulty_level_id: 3,
      title: '歸納法收尾',
      latex: String.raw`用數學歸納法完成證明。`,
      difficulty_levels: { id: 3, label: 'Hard', points: 8 },
    },
  ],
}

function stepState(stepNumber, activeStep, completedSteps) {
  if (completedSteps.has(stepNumber)) return 'done'
  if (stepNumber === activeStep) return 'active'
  return 'todo'
}

const DOT_CLASS = {
  done: styles['problemCycle__stepDot--done'],
  active: styles['problemCycle__stepDot--active'],
  todo: styles['problemCycle__stepDot--todo'],
}

// ── Page-level skeleton ────────────────────────────────────────
// Clones the final layout (main card + step rail + step group +
// leaderboard) so containers keep their exact size — only the inner
// text is replaced by grey blocks. No layout jump on load.
function PageSkeleton() {
  return (
    <div className={styles.problemCycle__container}>

      {/* Main problem card */}
      <section className={styles.problemCycle__mainCard} style={{ width: '100%' }}>
        <div className={styles.problemCycle__mainRow}>
          <Skeleton width={72} height={20} borderRadius={100} />
          <Skeleton width="55%" height={18} />
        </div>
        <div className={styles.problemCycle__mainBody}>
          <div className={styles.problemCycle__mainBodyInner}>
            <Skeleton width="80%" height={15} style={{ marginTop: 12 }} />
          </div>
        </div>
      </section>

      {/* Step rail — mirrors the real two-row structure */}
      <section className={styles.problemCycle__stepsWrap} style={{ width: '100%' }}>
        <div className={styles.problemCycle__stepsTrack}>
          {[0, 1, 2].map(i => (
            <Fragment key={i}>
              {i > 0 && <div className={styles.problemCycle__stepLine} />}
              <div className={styles.problemCycle__stepItem}>
                <div
                  className={styles.problemCycle__stepDot}
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)' }}
                />
              </div>
            </Fragment>
          ))}
        </div>
        <div className={styles.problemCycle__stepsLabels}>
          {[0, 1, 2].map(i => (
            <Fragment key={i}>
              {i > 0 && <div className={styles.problemCycle__stepLabelSpacer} />}
              <span className={styles.problemCycle__stepLabel}>
                <Skeleton width={36} height={10} style={{ margin: '0 auto' }} />
              </span>
            </Fragment>
          ))}
        </div>
      </section>

      {/* Step card + submit form (one unit) */}
      <section style={{ width: '100%' }}>
        <div className={styles.problemCycle__stepGroup} style={{ width: '100%' }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 10,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skeleton width={64} height={20} borderRadius={100} />
              <Skeleton width={40} height={14} />
              <Skeleton width="45%" height={14} />
            </div>
            <Skeleton width="88%" height={14} />
          </div>
          <div style={{
            padding: '1.75rem',
            borderRadius: '0 0 10px 10px',
            border: '1px solid var(--border)',
            borderTop: 'none',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <Skeleton width={130} height={16} />
            <Skeleton width="100%" height={38} />
            <Skeleton width="100%" height={72} />
            <Skeleton width={110} height={40} borderRadius={8} style={{ alignSelf: 'flex-end' }} />
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section style={{ width: '100%' }}>
        <Skeleton width={120} height={17} />
        <div style={{
          marginTop: 10,
          borderRadius: 10,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.75rem 1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <Skeleton width={22} height={18} />
              <Skeleton width="40%" height={14} />
              <Skeleton width={44} height={13} style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function ProblemOfCycle() {
  const { data, isLoading, error } = useCurrentProblems()
  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')

  const group = isConfigured && (data?.problems?.length ?? 0) > 0
    ? data.problems[0]
    : FALLBACK_GROUP
  const cycleNumber = isConfigured ? (data?.cycleNumber ?? 1) : FALLBACK_GROUP.cycle_number
  const steps = group?.steps ?? []

  // Legacy format (a single-tier row with no real steps) renders without
  // the main-problem card and step rail.
  const isGroupFormat = steps.some(s => s.id !== group?.id)

  const [activeStep, setActiveStep] = useState(steps[0]?.step_number ?? 1)
  const [completedSteps, setCompletedSteps] = useState(() => new Set())
  const activeProblem = steps.find(s => s.step_number === activeStep) ?? steps[0]

  // Collapsing sticky header: when the main card is pinned to the top of the
  // viewport it shrinks to a compact bar so it does not cover step content.
  const mainCardRef = useRef(null)
  const [pinned, setPinned] = useState(false)
  // When pinned, the main problem collapses to a header row; the body
  // (latex + hint) is revealed on demand via the chevron.
  const [mainExpanded, setMainExpanded] = useState(false)

  useEffect(() => {
    const STICKY_TOP = 64 // navbar (56) + 8px breathing room
    const handleScroll = () => {
      const el = mainCardRef.current
      if (!el) return
      setPinned(el.getBoundingClientRect().top <= STICKY_TOP)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function markStepDone(stepNumber) {
    setCompletedSteps(prev => new Set(prev).add(stepNumber))
  }

  // Step rail is pure navigation — no scrolling. The step card fades out,
  // the content swaps, then the new card fades in.
  const [isSwapping, setIsSwapping] = useState(false)
  const swapTimer = useRef(null)

  useEffect(() => () => clearTimeout(swapTimer.current), [])

  function handleStepClick(stepNumber) {
    if (stepNumber === activeStep || isSwapping) return
    setIsSwapping(true)
    clearTimeout(swapTimer.current)
    swapTimer.current = setTimeout(() => {
      setActiveStep(stepNumber)
      setIsSwapping(false)
    }, 200) // fade-out duration
  }

  const mainLatex = useMemo(() => renderLatex(group?.latex ?? ''), [group?.latex])

  // Full-page skeleton while loading — the skeleton clones the complete
  // layout so nothing shifts when real content arrives.
  if (isLoading && isConfigured) {
    return <PageSkeleton />
  }

  return (
    <div className={styles.problemCycle__container}>

      {/* Header */}
      <section>
        <div className={styles.problemCycle__header}>
          <h1 className={styles.problemCycle__title}>每週一問</h1>
          <span className={styles.problemCycle__cycleBadge}>
            Cycle {cycleNumber}
          </span>
        </div>
        {!isConfigured && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
            （目前顯示靜態示範數據 — 配置 Supabase 後將顯示真實題目）
          </p>
        )}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0.25rem 0 0' }}>
            無法載入題目：{error.message}
          </p>
        )}
      </section>

      {/* Main problem — sticky, only in group format.
          Once pinned it collapses to a header row; the body (latex + hint)
          becomes a chevron-toggled dropdown with a translucent panel. */}
      {isGroupFormat && (
        <section
          ref={mainCardRef}
          className={`${styles.problemCycle__mainCard} ${pinned ? styles['problemCycle__mainCard--pinned'] : ''}`}
        >
          <div className={styles.problemCycle__mainRow}>
            <span className={styles.problemCycle__mainBadge}>本週大題</span>
            <h2 className={styles.problemCycle__mainTitle}>{group.title}</h2>
            {pinned && (
              <button
                type="button"
                className={styles.problemCycle__mainToggle}
                onClick={() => setMainExpanded(v => !v)}
                aria-expanded={mainExpanded}
                aria-label={mainExpanded ? '收起大題說明' : '展開大題說明'}
              >
                <span className={`${styles.problemCycle__mainChevron} ${mainExpanded ? styles['problemCycle__mainChevron--open'] : ''}`}>
                  ▾
                </span>
              </button>
            )}
          </div>
          <div
            className={`${styles.problemCycle__mainBody} ${
              pinned && !mainExpanded ? styles['problemCycle__mainBody--collapsed'] : ''
            } ${pinned && mainExpanded ? styles['problemCycle__mainBody--panel'] : ''}`}
          >
            <div className={styles.problemCycle__mainBodyInner}>
              <div
                className={styles.problemCycle__mainLatex}
                dangerouslySetInnerHTML={{ __html: mainLatex }}
              />
              <p className={styles.problemCycle__mainHint}>
                {steps.length} 個小步驟，逐步逼近 · 揀一個步驟開始
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Step rail — two rows: track (dots + connector) above labels,
          so the connector aligns with the dot centres */}
      {isGroupFormat && (
        <section className={styles.problemCycle__stepsWrap} style={{ width: '100%' }}>
          <div className={styles.problemCycle__stepsTrack}>
            {steps.map((s, i) => (
              <Fragment key={s.id}>
                {i > 0 && <div className={styles.problemCycle__stepLine} />}
                <button
                  className={styles.problemCycle__stepItem}
                  onClick={() => handleStepClick(s.step_number)}
                >
                  <span className={`${styles.problemCycle__stepDot} ${DOT_CLASS[stepState(s.step_number, activeStep, completedSteps)]}`}>
                    {completedSteps.has(s.step_number) ? '✓' : s.step_number}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className={styles.problemCycle__stepsLabels}>
            {steps.map((s, i) => (
              <Fragment key={s.id}>
                {i > 0 && <div className={styles.problemCycle__stepLabelSpacer} />}
                <span className={styles.problemCycle__stepLabel}>
                  {s.points ?? s.difficulty_levels?.points ?? ''} pts
                </span>
              </Fragment>
            ))}
          </div>
        </section>
      )}

      {/* Single step card — shows the active step; step rail above is the
          navigation. SubmitForm stays fixed below the card so the question
          and the answer input are always on screen together. */}
      <section>
        {isGroupFormat && (
          <h2 className={styles.problemCycle__sectionTitle}>解題步驟</h2>
        )}
        <div
          key={activeProblem?.step_number ?? 'step'}
          className={`${styles.problemCycle__stepGroup} ${
            isSwapping
              ? styles['problemCycle__stepFadeOut']
              : styles.problemCycle__stepFadeIn
          }`}
        >
          <ProblemCard
            problem={activeProblem}
            stepNumber={isGroupFormat ? activeProblem?.step_number : undefined}
            active
          />
          <SubmitForm
            steps={steps}
            activeStepNumber={activeProblem?.step_number ?? 1}
            onSubmitted={markStepDone}
            inline
          />
        </div>
      </section>

      <Leaderboard
        cycleNumber={cycleNumber}
        problems={steps}
        totalSteps={steps.length}
      />

      {/* Link to past problems */}
      <section style={{ textAlign: 'center' }}>
        <Link
          to="/problem/past"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.6rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'border-color 0.2s, gap 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--potc-theme-color)'
            e.currentTarget.style.color = 'var(--potc-theme-color)'
            e.currentTarget.style.gap = '0.75rem'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.gap = '0.5rem'
          }}
        >
          瀏覽過往題目
          <span style={{ fontSize: 16 }}>→</span>
        </Link>
      </section>

    </div>
  )
}
