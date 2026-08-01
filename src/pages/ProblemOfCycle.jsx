import { useState } from 'react'
import { Link } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useCurrentProblems } from '../hooks/useSupabase'
import { ProblemCard, SkeletonCard } from '../components/problem/ProblemCard'

// ── Static fallback — shown when Supabase is not yet configured ──
const FALLBACK_PROBLEMS = [
  {
    id: 'fallback-easy',
    difficulty_level_id: 1,
    title: '等差數列求和',
    latex: '計算 $1 + 2 + 3 + \\cdots + 100$ 的和。',
    difficulty_levels: { id: 1, label: 'Easy', points: 3 },
  },
  {
    id: 'fallback-medium',
    difficulty_level_id: 2,
    title: '證明 \u221a2 為無理數',
    latex: '證明$\\sqrt{2}$是無理數。',
    difficulty_levels: { id: 2, label: 'Medium', points: 5 },
  },
  {
    id: 'fallback-hard',
    difficulty_level_id: 3,
    title: '立方和公式',
    latex: String.raw`對於任意正整數 $n$，證明：$\sum_{k=1}^{n} k^3 = \left( \frac{n(n+1)}{2} \right)^2$`,
    difficulty_levels: { id: 3, label: 'Hard', points: 8 },
  },
]

// ── Page ─────────────────────────────────────────────────────

export default function ProblemOfCycle() {
  const { problems: liveProblems, cycleNumber, loading, error } = useCurrentProblems()

  // Use live data if available; fall back to static when Supabase isn't configured
  const isConfigured = import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  const problems = isConfigured && liveProblems.length > 0 ? liveProblems : FALLBACK_PROBLEMS
  const displayCycle = cycleNumber ?? 1

  const [activeLevel, setActiveLevel] = useState(1) // 1 = Easy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Header */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
            每週一問
          </h1>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Cycle {displayCycle}
          </span>
        </div>
        {!isConfigured && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
            （目前顯示靜態示範數據 — 配置 Supabase 後將顯示真實題目）
          </p>
        )}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0.25rem 0 0' }}>
            無法載入題目：{error}
          </p>
        )}
      </section>

      {/* Problems */}
      <section>
        <h2 style={{ fontSize: 17, margin: '0 0 1rem', color: 'var(--text-primary)' }}>
          本週題目
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading && isConfigured
            ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
            : problems.map(p => (
              <ProblemCard
                key={p.id}
                problem={p}
                active={activeLevel === p.difficulty_level_id}
                onClick={() => setActiveLevel(p.difficulty_level_id)}
              />
            ))
          }
        </div>
      </section>

      {/* Submit placeholder — Day 5 */}
      <section style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 10,
        border: '1px dashed var(--border)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          答案提交功能將於下一階段開放。本週題目截止後會公佈答案。
        </p>
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
          瀏覽過往題目
          <span style={{ fontSize: 16 }}>→</span>
        </Link>
      </section>

    </div>
  )
}
