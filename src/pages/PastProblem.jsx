import { useParams, Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { ProblemCard, SkeletonCard } from '../components/problem/ProblemCard'
import { usePastProblemById } from '../hooks/useSupabase'
import { BackLink } from '../components/ui/BackLink'
import { CollapsibleLatex } from '../components/ui/CollapsiblePanel'
import styles from './PastProblem.module.css'

export default function PastProblem() {
  const { problemId } = useParams()
  const { t } = useTranslation()
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
        <p className={styles.pastProblem__notFoundText}>{t('past.notFound')}</p>
        <Link to="/problem/past" className={styles.pastProblem__notFoundLink}>
          {t('past.backToArchive')}
        </Link>
      </div>
    )
  }

  const locale = i18n.language?.startsWith('zh') ? 'zh-TW' : 'en-US'
  const dateStr = problem.start_date
    ? new Date(problem.start_date).toLocaleDateString(locale, {
        year: 'numeric', month: '2-digit', day: '2-digit',
      })
    : problem.created_at
      ? new Date(problem.created_at).toLocaleDateString(locale, { year: 'numeric', month: '2-digit' })
      : `Cycle ${problem.cycle_number}`

  const steps = problem.steps?.length > 0 ? problem.steps : [problem]

  return (
    <div className={styles.pastProblem__container}>

      {/* Back link + header */}
      <section>
        <BackLink to="/problem/past">{t('past.backToArchive')}</BackLink>
        <div className={styles.pastProblem__header}>
          <h1 className={styles.pastProblem__title}>
            {problem.title}
          </h1>
          <span className={styles.pastProblem__badge}>
            {t('past.steps', { count: steps.length })}
          </span>
        </div>
        <p className={styles.pastProblem__meta}>
          {dateStr} &nbsp;·&nbsp; Cycle {problem.cycle_number} &nbsp;·&nbsp; {t('past.closed')}
        </p>
      </section>

      {/* Steps — all expanded, read-only */}
      <section>
        <h2 className={styles.pastProblem__sectionTitle}>{t('past.questions')}</h2>
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
          {t('past.loadError')}{error.message}
        </p>
      )}

      <p className={styles.pastProblem__footer}>
        {t('past.closedNote')}
      </p>

    </div>
  )
}
