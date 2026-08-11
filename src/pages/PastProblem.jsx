import { useParams, Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useState, useMemo } from 'react'
import { renderLatex } from '../lib/math-renderer'
import { ProblemCard, SkeletonCard } from '../components/problem/ProblemCard'
import { usePastProblemById } from '../hooks/useSupabase'
import { BackLink } from '../components/ui/BackLink'
import { CollapsibleLatex } from '../components/ui/CollapsiblePanel'
import styles from './pages.module.css'

export default function PastProblem() {
  const { problemId } = useParams()
  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')

  const { data: problem, isLoading, error } =
    usePastProblemById(isConfigured ? problemId : null)

  const [solutionOpen, setSolutionOpen] = useState(false)

  const renderedSolution = useMemo(() => {
    if (!problem?.solution) return ''
    return renderLatex(problem.solution)
  }, [problem?.solution])

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ height: 14, width: 120, borderRadius: 4, backgroundColor: 'var(--bg-tertiary)' }} />
        <div style={{ height: 28, width: 260, borderRadius: 4, backgroundColor: 'var(--bg-tertiary)' }} />
        <SkeletonCard />
      </div>
    )
  }

  // ── Not found ──
  if (!problem) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>找不到該題目。</p>
        <Link to="/problem/past" style={{ color: 'var(--potc-theme-color)', fontSize: 14 }}>
          ← 返回過往題目
        </Link>
      </div>
    )
  }

  const dateStr = problem.start_date
    ? new Date(problem.start_date).toLocaleDateString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      })
    : problem.created_at
      ? new Date(problem.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit' })
      : `Cycle ${problem.cycle_number}`

  const steps = problem.steps?.length > 0 ? problem.steps : [problem]

  return (
    <div className={styles.pastProblem__container}>

      {/* Back link + header */}
      <section>
        <BackLink to="/problem/past">返回過往題目</BackLink>
        <div className={styles.pastProblem__header}>
          <h1 className={styles.pastProblem__title}>
            {problem.title}
          </h1>
          <span style={{
            fontSize: 12,
            padding: '0.15rem 0.55rem',
            borderRadius: 100,
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            {steps.length} 步
          </span>
        </div>
        <p className={styles.pastProblem__meta}>
          {dateStr} &nbsp;·&nbsp; Cycle {problem.cycle_number} &nbsp;·&nbsp; 已截止
        </p>
      </section>

      {/* Steps — all expanded, read-only */}
      <section>
        <h2 className={styles.pastProblem__sectionTitle}>題目</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {steps.map((s, i) => (
            <ProblemCard
              key={s.id}
              problem={s}
              stepNumber={steps.length > 1 ? i + 1 : undefined}
              active={true}
              onClick={() => {}}
            />
          ))}
        </div>
      </section>

      {/* Solution — collapsible */}
      {problem.solution && (
        <CollapsibleLatex
          content={problem.solution}
          activeColor="var(--potc-theme-color)"
          defaultOpen={false}
          headerContent={
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              flex: 1,
            }}>
              參考解法
            </span>
          }
        />
      )}

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', margin: 0 }}>
          載入失敗：{error.message}
        </p>
      )}

      <p className={styles.pastProblem__footer}>
        此為過往題目，已截止提交。
      </p>

    </div>
  )
}
