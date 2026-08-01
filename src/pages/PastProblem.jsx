import { useParams, Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useState } from 'react'
import { renderLatex } from '../lib/math-renderer'
import { ProblemCard, SkeletonCard, DIFFICULTY_STYLES } from '../components/problem/ProblemCard'
import { usePastProblemById } from '../hooks/useSupabase'

export default function PastProblem() {
  const { problemId } = useParams()
  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')

  const { problem, loading, error } =
    usePastProblemById(isConfigured ? problemId : null)

  const [solutionOpen, setSolutionOpen] = useState(false)

  // ── Loading ──
  if (loading) {
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

  const lid = problem.difficulty_level_id
  const style = DIFFICULTY_STYLES[lid] ?? DIFFICULTY_STYLES[2]
  const dateStr = problem.start_date
    ? new Date(problem.start_date).toLocaleDateString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      })
    : problem.created_at
      ? new Date(problem.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit' })
      : `Cycle ${problem.cycle_number}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Back link + header */}
      <section>
        <Link
          to="/problem/past"
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginBottom: '1rem',
            transition: 'color 0.2s, gap 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--potc-theme-color)'
            e.currentTarget.style.gap = '0.6rem'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.gap = '0.35rem'
          }}
        >
          <span>←</span> 返回過往題目
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
            {problem.title}
          </h1>
          <span style={{
            fontSize: 12,
            padding: '0.15rem 0.55rem',
            borderRadius: 100,
            color: style.color,
            border: `1px solid ${style.color}`,
          }}>
            {problem.difficulty_levels?.label ?? '?'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          {dateStr} &nbsp;·&nbsp; Cycle {problem.cycle_number} &nbsp;·&nbsp; 已截止
        </p>
      </section>

      {/* Problem card — always expanded */}
      <section>
        <h2 style={{ fontSize: 17, margin: '0 0 1rem', color: 'var(--text-primary)' }}>
          題目
        </h2>
        <ProblemCard problem={problem} active={true} onClick={() => {}} />
      </section>

      {/* Solution — collapsible */}
      {problem.solution && (
        <div
          onClick={() => setSolutionOpen(!solutionOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') setSolutionOpen(!solutionOpen) }}
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 10,
            border: solutionOpen
              ? '1px solid var(--potc-theme-color)'
              : '1px solid var(--border)',
            backgroundColor: solutionOpen
              ? 'color-mix(in srgb, var(--potc-theme-color) 8%, transparent)'
              : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background-color 0.2s',
            outline: 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: solutionOpen ? 'var(--potc-theme-color)' : 'var(--text-secondary)',
              flex: 1,
              transition: 'color 0.2s',
            }}>
              參考解法
            </span>
            <span style={{
              fontSize: 18,
              color: 'var(--text-muted)',
              transition: 'transform 0.25s, color 0.2s',
              transform: solutionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              ...(solutionOpen && { color: 'var(--potc-theme-color)' }),
            }}>
              ▾
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateRows: solutionOpen ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.3s ease',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div
                dangerouslySetInnerHTML={{ __html: renderLatex(problem.solution) }}
                style={{ fontSize: 14, lineHeight: 1.8, paddingTop: '0.75rem' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', margin: 0 }}>
          載入失敗：{error}
        </p>
      )}

      <p style={{
        fontSize: 12, color: 'var(--text-muted)',
        textAlign: 'center', margin: 0, padding: '0.5rem 0',
      }}>
        此為過往題目，已截止提交。
      </p>

    </div>
  )
}
