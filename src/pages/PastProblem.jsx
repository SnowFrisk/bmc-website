import { useParams, Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { ProblemCard, SkeletonCard } from '../components/problem/ProblemCard'
import { usePastProblemById } from '../hooks/useSupabase'
import { BackLink } from '../components/ui/BackLink'
import { CollapsibleLatex } from '../components/ui/CollapsiblePanel'
import styles from './PastProblem.module.css'

export default function PastProblem() {
  const { problemId } = useParams()
  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')

  const { data: problem, isLoading, error } =
    usePastProblemById(isConfigured ? problemId : null)

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={styles.pastProblem__loading}>
        <div className={styles.pastProblem__skeleton} style={{ width: 120, height: 14 }} />
        <div className={styles.pastProblem__skeleton} style={{ width: 260, height: 28 }} />
        <SkeletonCard />
      </div>
    )
  }

  // ── Not found ──
  if (!problem) {
    return (
      <div className={styles.pastProblem__notFound}>
        <p className={styles.pastProblem__notFoundText}>找不到該題目。</p>
        <Link to="/problem/past" className={styles.pastProblem__notFoundLink}>
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
          <span className={styles.pastProblem__badge}>
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
        <div className={styles.pastProblem__steps}>
          {steps.map((s, i) => (
            <ProblemCard
              key={s.id}
              problem={s}
              stepNumber={steps.length > 1 ? i + 1 : undefined}
              active={true}
            />
          ))}
        </div>
      </section>

      {/* Solution — collapsible (default "參考解法" header) */}
      {problem.solution && (
        <CollapsibleLatex
          content={problem.solution}
          activeColor="var(--potc-theme-color)"
        />
      )}

      {/* Error */}
      {error && (
        <p className={styles.pastProblem__error}>
          載入失敗：{error.message}
        </p>
      )}

      <p className={styles.pastProblem__footer}>
        此為過往題目，已截止提交。
      </p>

    </div>
  )
}
