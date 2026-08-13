import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { generateQuestion, DIFFICULTIES } from '../lib/speed-question-generator'
import { answersMatch } from '../lib/answer-match'
import { renderLatex } from '../lib/math-renderer'
import SpeedBattle from '../components/speed/SpeedBattle'
import BackButton from '../components/ui/BackButton'
import btnStyles from '../components/ui/buttons.module.css'
import styles from './SpeedMath.module.css'

// ── Solo practice mode ──
// Fill-in the blank, matching the battle mode: type the answer and submit.
// Correctness uses answersMatch, so LaTeX-equivalent answers count too.
// The difficulty is chosen on a separate page before entering — it stays
// fixed for the whole session (no mid-answer level switching).

function SoloMode({ level = 2, onChangeLevel }) {
  const currentLevel = DIFFICULTIES.find(d => d.level === level) ?? DIFFICULTIES[1]
  const [question, setQuestion] = useState(() => generateQuestion(level))
  // Start the clock at THIS question's limit (Medium 12s / Hard 10s, not 15)
  const [timeLeft, setTimeLeft] = useState(question.timeLimit)
  const [score, setScore] = useState(0)
  const [answerInput, setAnswerInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [verdict, setVerdict] = useState(null) // true | false | null
  const [correctCount, setCorrectCount] = useState(0)
  const [total, setTotal] = useState(0)
  const timerRef = useRef(null)

  function startNewRound() {
    // Persist an unanswered round (the time-up screen counted it via
    // accuracyTotal) into `total` so later rounds keep it in the
    // denominator.
    if (roundOver) setTotal(t => t + 1)
    const q = generateQuestion(level)
    setQuestion(q)
    setTimeLeft(q.timeLimit)
    setAnswerInput('')
    setSubmitted(false)
    setVerdict(null)
  }

  useEffect(() => {
    if (submitted || timeLeft <= 0) return
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [submitted, timeLeft])

  // Unanswered questions count against accuracy. Derived view: while the
  // time-up screen shows, treat the current round as one (wrong) question;
  // startNewRound then persists it into `total` so later rounds keep it
  // in the denominator.
  const roundOver = timeLeft === 0 && !submitted
  const accuracyTotal = total + (roundOver ? 1 : 0)

  function handleSubmit(e) {
    e.preventDefault()
    const value = answerInput.trim()
    if (!value || submitted) return
    const isCorrect = answersMatch(value, question.answer)
    setSubmitted(true)
    setVerdict(isCorrect)
    setTotal(t => t + 1)
    if (isCorrect) {
      // 100 base + up to 100 time bonus, SQUARE-weighted on the remaining
      // ratio: answering in the first third of the clock (~145-200) pays
      // off hard, dawdling to the end still keeps the 100 base. Fair
      // across difficulties (Easy 15s / Hard 10s both cap at 200).
      const ratio = Math.min(1, Math.max(0, timeLeft / question.timeLimit))
      setScore(s => s + 100 + Math.round(ratio * ratio * 100))
      setCorrectCount(c => c + 1)
    }
  }

  return (
    <>
      {/* HUD row (no page title — the answering screen is pure focus):
          difficulty pill | timer | session stats */}
      <div className={styles.solo__hud}>
        <button
          className={styles.solo__levelBtn}
          onClick={onChangeLevel}
          title="換難度"
        >
          {currentLevel.icon} {currentLevel.title} 換 →
        </button>
        <div className={`${styles.solo__timer} ${timeLeft <= 5 && !submitted ? styles['solo__timer--danger'] : ''}`}>
          {timeLeft}s
        </div>
        <div className={styles.solo__status}>
          <span className={styles.solo__score}>分數 {score}</span>
          <span className={styles.solo__acc}>
            正確率 {accuracyTotal > 0 ? Math.round((correctCount / accuracyTotal) * 100) : 0}%
          </span>
        </div>
      </div>

    <div className={styles.solo}>

      {roundOver ? (
        <div className={styles.solo__timeUp}>
          <p>時間到！</p>
          <button
            className={`${btnStyles.btnPrimary} ${styles.solo__cta}`}
            onClick={startNewRound}
            style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
          >
            下一題
          </button>
        </div>
      ) : (
        <>
          <div className={styles.solo__stage}>
            <div
              className={styles.solo__question}
              dangerouslySetInnerHTML={{ __html: renderLatex(question.text) }}
            />
          </div>

          <form className={styles.solo__answerForm} onSubmit={handleSubmit}>
            <input
              type="text"
              inputMode="decimal"
              className={styles.solo__answerInput}
              value={answerInput}
              onChange={e => setAnswerInput(e.target.value)}
              placeholder="輸入答案"
              autoFocus
              spellCheck={false}
              disabled={submitted}
            />
            <button
              type="submit"
              className={`${btnStyles.btnPrimary} ${styles.solo__cta}`}
              disabled={!answerInput.trim() || submitted}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              確認
            </button>
          </form>

          {submitted && (
            <div
              className={`${styles.solo__verdict} ${
                verdict ? styles['solo__verdict--ok'] : styles['solo__verdict--wrong']
              }`}
            >
              {verdict ? '✅ 正確！' : '❌ 答錯'}
              {!verdict && (
                <span className={styles.solo__verdictAnswer}>
                  正確答案：{question.answer}
                </span>
              )}
            </div>
          )}

          {submitted && (
            <button
              className={`${btnStyles.btnPrimary} ${styles.solo__cta}`}
              onClick={startNewRound}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              下一題 →
            </button>
          )}
        </>
      )}
    </div>
    </>
  )
}

// ── Page ──

const MODES = ['solo', 'battle', 'join']

// Read the mode from the URL (used on first mount and on back/forward).
function readModeFromUrl() {
  const m = new URLSearchParams(window.location.search).get('mode')
  return MODES.includes(m) ? m : null
}

export default function SpeedMath() {
  // Mode is plain React state, mirroring the URL as a shadow:
  //   /speed                → menu
  //   /speed?mode=solo      → solo practice
  //   /speed?mode=battle    → battle (role selection)
  //   /speed?mode=join&code=123456 → battle join screen, code pre-filled
  // The URL is kept in sync with history.pushState (NOT React Router
  // navigation — its async startTransition raced the View Transition
  // snapshot and the swap rolled back to the menu mid-transition).
  // The same flushSync+setState pattern already works inside SpeedBattle,
  // so this guarantees the transition snapshots the NEW DOM.
  const [mode, setModeState] = useState(readModeFromUrl)
  // Chosen difficulty for solo practice (1|2|3) — picked on a dedicated
  // page before entering the panel.
  const [difficulty, setDifficulty] = useState(null)

  // Back/forward buttons: sync state from the URL the browser navigated to.
  useEffect(() => {
    const onPop = () => setModeState(readModeFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function switchMode(next) {
    const apply = () => {
      flushSync(() => setModeState(next))
      window.history.pushState(null, '', next
        ? `${window.location.pathname}?mode=${next}`
        : window.location.pathname)
    }
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  return (
    <div className={styles.container}>
      {mode && (
        <BackButton onClick={() => switchMode(null)}>← 返回選單</BackButton>
      )}
      {/* SoloMode renders its own title row (title + session stats HUD);
          menu and battle keep the page-level title. */}
      {mode !== 'solo' && <h1 className={styles.title}>速算競技場</h1>}

      {mode === null && (
        <div className={styles.menu}>
          <p className={styles.menu__hint}>揀一種玩法</p>
          <div className={styles.menu__cards}>
            <button
              className={styles.menuCard}
              onClick={() => switchMode('solo')}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              <span className={styles.menuCard__icon}>⚡</span>
              <span className={styles.menuCard__title}>單人練習</span>
              <span className={styles.menuCard__desc}>限時速算，訓練心算反應</span>
              <span className={styles.menuCard__action}>開始 →</span>
            </button>
            <button
              className={styles.menuCard}
              onClick={() => switchMode('battle')}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              <span className={styles.menuCard__icon}>🏆</span>
              <span className={styles.menuCard__title}>實時對戰</span>
              <span className={styles.menuCard__desc}>Kahoot 式比拼，同隊員即時過招</span>
              <span className={styles.menuCard__action}>進入 →</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'solo' && !difficulty && (
        <div className={styles.menu}>
          <p className={styles.menu__hint}>揀難度</p>
          <div className={styles.menu__cards}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.level}
                className={styles.menuCard}
                onClick={() => setDifficulty(d.level)}
                style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
              >
                <span className={styles.menuCard__icon}>{d.icon}</span>
                <span className={styles.menuCard__title}>{d.title}</span>
                <span className={styles.menuCard__desc}>{d.desc}</span>
                <span className={styles.menuCard__action}>開始 →</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'solo' && difficulty && (
        <SoloMode
          level={difficulty}
          // Change difficulty from the answering screen: clearing the
          // state shows the difficulty picker again; picking a new level
          // remounts SoloMode, so the session stats reset naturally.
          onChangeLevel={() => {
            const apply = () => flushSync(() => setDifficulty(null))
            if (document.startViewTransition) document.startViewTransition(apply)
            else apply()
          }}
        />
      )}
      {/* Battle manages its own back navigation (role → setup), so it
          only exposes the top-level exit; SpeedBattle renders the back
          button according to its internal phase. `mode=join` skips the
          role selection straight into the join form with the code filled. */}
      {(mode === 'battle' || mode === 'join') && (
        <SpeedBattle
          onExit={() => switchMode(null)}
          initialRole={mode === 'join' ? 'join' : null}
          initialCode={new URLSearchParams(window.location.search).get('code') ?? ''}
        />
      )}
    </div>
  )
}
