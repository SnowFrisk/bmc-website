import { useState, Fragment, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useTranslation } from 'react-i18next'
import { useCurrentProblems } from '../hooks/useSupabase'
import { ProblemCard } from '../components/problem/ProblemCard'
import SubmitForm from '../components/problem/SubmitForm'
import { Skeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { renderLatex } from '../lib/math-renderer'
import styles from './ProblemOfCycle.module.css'

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
  const { t } = useTranslation()
  const { data, isLoading, error } = useCurrentProblems()
  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')

  // 冇活躍題目（未配置 / 未有本週題）→ group = null → 顯示空狀態，唔再
  // 用靜態示範數據
  const group = isConfigured && (data?.problems?.length ?? 0) > 0
    ? data.problems[0]
    : null
  const cycleNumber = group?.cycle_number
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

  // 冇活躍題目 → 空狀態（同首頁通告 / 排行榜 / 過往題目共用 EmptyState）
  if (!group) {
    return (
      <div className={styles.problemCycle__container}>
        <section>
          <div className={styles.problemCycle__header}>
            <h1 className={styles.problemCycle__title}>{t('nav.problem')}</h1>
          </div>
          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: '0.25rem 0 0' }}>
              {t('potc.loadError')}{error.message}
            </p>
          )}
        </section>
        <EmptyState icon="📅" title={t('potc.noActive')} hint={t('potc.noActiveHint')} />
      </div>
    )
  }

  return (
    <div className={styles.problemCycle__container}>

      {/* Header */}
      <section>
        <div className={styles.problemCycle__header}>
          <h1 className={styles.problemCycle__title}>{t('nav.problem')}</h1>
          <span className={styles.problemCycle__cycleBadge}>
            Cycle {cycleNumber}
          </span>
        </div>
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0.25rem 0 0' }}>
            {t('potc.loadError')}{error.message}
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
            <span className={styles.problemCycle__mainBadge}>{t('potc.mainBadge')}</span>
            <h2 className={styles.problemCycle__mainTitle}>
              {group.title}
            </h2>
            {pinned && (
              <button
                type="button"
                className={styles.problemCycle__mainToggle}
                onClick={() => setMainExpanded(v => !v)}
                aria-expanded={mainExpanded}
                aria-label={mainExpanded ? t('potc.collapse') : t('potc.expand')}
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
                {t('potc.mainHint', { count: steps.length })}
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
          <h2 className={styles.problemCycle__sectionTitle}>{t('potc.stepsTitle')}</h2>
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
          {t('past.browse')}
          <span style={{ fontSize: 16 }}>→</span>
        </Link>
      </section>

    </div>
  )
}
