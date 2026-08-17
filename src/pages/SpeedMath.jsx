import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { generateQuestion, DIFFICULTIES } from '../lib/speed-question-generator'
import { startPanelTransition } from '../lib/view-transitions'
import { answersMatch } from '../lib/answer-match'
import { renderLatex } from '../lib/math-renderer'
import SpeedBattle from '../components/speed/SpeedBattle'
import BackButton from '../components/ui/BackButton'
import btnStyles from '../components/ui/buttons.module.css'
import styles from './SpeedMath.module.css'

// ── Solo practice mode ──
// Fill-in the blank, matching the battle mode: type the answer and submit.
// Correctness uses answersMatch, so LaTeX-equivalent answers count too.
// A round is TIME-LIMITED (player picks the minutes): answer as many
// questions as possible before the round clock runs out — the goal is the
// highest score, not an endless streak. The round clock is the ONLY
// timer: questions carry no per-question limit, so each correct answer is
// a flat 200 and speed is rewarded purely by fitting more questions into
// the round. Difficulty + minutes are chosen on separate pages.

// Personal best per (difficulty, minutes) — the "最高分" the round chases.
const BEST_KEY = (level, minutes) => `bmc-solo-best-${level}-${minutes}`
function readBest(level, minutes) {
  try { return Number(localStorage.getItem(BEST_KEY(level, minutes))) || 0 } catch { return 0 }
}
function writeBest(level, minutes, score) {
  try { localStorage.setItem(BEST_KEY(level, minutes), String(score)) } catch { /* ignore */ }
}
const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function SoloMode({ level = 2, minutes = 1, onChangeLevel }) {
  const { t } = useTranslation()
  const currentLevel = DIFFICULTIES.find(d => d.level === level) ?? DIFFICULTIES[1]
  const [question, setQuestion] = useState(() => generateQuestion(level))
  const [roundLeft, setRoundLeft] = useState(minutes * 60)
  const [score, setScore] = useState(0)
  const [answerInput, setAnswerInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [verdict, setVerdict] = useState(null) // true | false | null
  const [correctCount, setCorrectCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [bestScore, setBestScore] = useState(() => readBest(level, minutes))
  const [isNewBest, setIsNewBest] = useState(false)

  // Round phase is DERIVED from the clock — the round ends the moment it
  // reaches 0, so there is no separate phase state to keep in sync.
  const phase = roundLeft <= 0 ? 'results' : 'playing'

  // Advance after a correct/incorrect verdict (player-paced — the round
  // clock keeps running, so dawdling costs round seconds).
  function startNewRound() {
    const q = generateQuestion(level)
    setQuestion(q)
    setAnswerInput('')
    setSubmitted(false)
    setVerdict(null)
  }

  // Play the same settings again from zero.
  function restartRound() {
    const q = generateQuestion(level)
    setQuestion(q)
    setRoundLeft(minutes * 60)
    setScore(0)
    setAnswerInput('')
    setSubmitted(false)
    setVerdict(null)
    setCorrectCount(0)
    setTotal(0)
    setIsNewBest(false)
    setBestScore(readBest(level, minutes))
  }

  // Round clock (player-chosen minutes) — the ONLY timer in a round
  useEffect(() => {
    if (roundLeft <= 0) return
    const t = setTimeout(() => setRoundLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [roundLeft])

  // Round over → save the personal best, show the results screen.
  // Deferred via setTimeout: setState inside an effect body is flagged by
  // react-hooks/purity (cascading renders); the 0ms defer keeps the update
  // out of the synchronous render path (same pattern as SpeedBattle).
  useEffect(() => {
    if (roundLeft > 0) return
    const t = setTimeout(() => {
      if (score > bestScore) {
        writeBest(level, minutes, score)
        setIsNewBest(true)
        setBestScore(score)
      } else {
        setIsNewBest(false)
      }
    }, 0)
    return () => clearTimeout(t)
  }, [roundLeft, score, bestScore, level, minutes])

  // Results stats: the in-flight question counts as wrong if the round
  // clock caught it unanswered.
  const finalTotal = total + (submitted ? 0 : 1)
  const finalPct = finalTotal > 0 ? Math.round((correctCount / finalTotal) * 100) : 0

  function handleSubmit(e) {
    e.preventDefault()
    const value = answerInput.trim()
    if (phase !== 'playing' || !value || submitted) return
    const isCorrect = answersMatch(value, question.answer)
    setSubmitted(true)
    setVerdict(isCorrect)
    setTotal(t => t + 1)
    if (isCorrect) {
      // Flat 200 per correct answer — no per-question clock, so speed is
      // rewarded purely by fitting more questions into the round.
      setScore(s => s + 200)
      setCorrectCount(c => c + 1)
    }
  }

  return (
    <>
      {/* HUD row (no page title — the answering screen is pure focus):
          difficulty pill | round clock | session stats */}
      <div className={styles.solo__hud}>
        <button
          className={styles.solo__levelBtn}
          onClick={onChangeLevel}
          title={t('speed.changeLevelTitle')}
        >
          {currentLevel.icon} {currentLevel.title} {t('speed.change')} →
        </button>
        <div className={`${styles.solo__round} ${phase === 'playing' && roundLeft <= 10 ? styles['solo__round--danger'] : ''}`}>
          {fmtClock(roundLeft)}
        </div>
        <div className={styles.solo__status}>
          <span className={styles.solo__score}>{t('speed.score', { score })}</span>
          <span className={styles.solo__acc}>
            {t('speed.accuracy', { pct: total > 0 ? Math.round((correctCount / total) * 100) : 0 })}
          </span>
        </div>
      </div>

    <div className={styles.solo}>

      {phase === 'results' ? (
        <div className={styles.solo__results}>
          <p className={styles.solo__resultsTitle}>{t('speed.solo.timeUp')}</p>
          <div className={styles.solo__resultsScore}>{score}</div>
          <p className={styles.solo__resultsStats}>
            {t('speed.solo.stats', { correct: correctCount, total: finalTotal, pct: finalPct })}
          </p>
          <p className={`${styles.solo__resultsBest} ${isNewBest ? styles['solo__resultsBest--new'] : ''}`}>
            {isNewBest ? t('speed.solo.newBest', { score: bestScore }) : t('speed.solo.best', { score: bestScore })}
          </p>
          <div className={styles.solo__resultsActions}>
            <button
              className={`${btnStyles.btnPrimary} ${styles.solo__cta}`}
              onClick={restartRound}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              {t('speed.solo.playAgain')}
            </button>
            <button
              className={`${btnStyles.btnSecondary} ${styles.solo__cta}`}
              onClick={onChangeLevel}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              {t('speed.solo.changeLevel')}
            </button>
          </div>
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
              placeholder={t('speed.solo.answerPlaceholder')}
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
              {t('speed.solo.confirm')}
            </button>
          </form>

          {submitted && (
            <div
              className={`${styles.solo__verdict} ${
                verdict ? styles['solo__verdict--ok'] : styles['solo__verdict--wrong']
              }`}
            >
              {verdict ? t('speed.correct') : t('speed.wrong')}
              {!verdict && (
                <span className={styles.solo__verdictAnswer}>
                  {t('speed.solo.correctAnswer', { answer: question.answer })}
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
              {t('speed.solo.next')} →
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
  const { t } = useTranslation()
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
  // Solo practice setup — difficulty (1|2|3) then round length in minutes,
  // each picked on a dedicated page before entering the panel.
  const [difficulty, setDifficulty] = useState(null)
  const [minutes, setMinutes] = useState(null)

  // Back/forward buttons: sync state from the URL the browser navigated to.
  useEffect(() => {
    const onPop = () => setModeState(readModeFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Solo setup back: difficulty picker (clears the round length too, so
  // the player re-picks minutes after switching difficulty).
  function backToDifficulty() {
    startPanelTransition(() => { setDifficulty(null); setMinutes(null) })
  }

  function switchMode(next) {
    startPanelTransition(() => {
      setModeState(next)
      window.history.pushState(null, '', next
        ? `${window.location.pathname}?mode=${next}`
        : window.location.pathname)
    })
  }

  return (
    <div className={styles.container}>
      {mode && (
        <BackButton onClick={() => switchMode(null)}>{t('common.backMenu')}</BackButton>
      )}
      {/* SoloMode renders its own title row (title + session stats HUD);
          menu and battle keep the page-level title. */}
      {mode !== 'solo' && <h1 className={styles.title}>{t('nav.speed')}</h1>}

      {mode === null && (
        <div className={styles.menu}>
          <p className={styles.menu__hint}>{t('speed.pickMode')}</p>
          <div className={styles.menu__cards}>
            <button
              className={styles.menuCard}
              onClick={() => switchMode('solo')}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              <span className={styles.menuCard__icon}>⚡</span>
              <span className={styles.menuCard__title}>{t('speed.soloMode')}</span>
              <span className={styles.menuCard__desc}>{t('speed.soloDesc')}</span>
              <span className={styles.menuCard__action}>{t('speed.start')} →</span>
            </button>
            <button
              className={styles.menuCard}
              onClick={() => switchMode('battle')}
              style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
            >
              <span className={styles.menuCard__icon}>🏆</span>
              <span className={styles.menuCard__title}>{t('speed.battleMode')}</span>
              <span className={styles.menuCard__desc}>{t('speed.battleDesc')}</span>
              <span className={styles.menuCard__action}>{t('speed.enter')} →</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'solo' && !difficulty && (
        <div className={styles.menu}>
          <p className={styles.menu__hint}>{t('speed.pickLevel')}</p>
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
                <span className={styles.menuCard__desc}>{t(d.descKey)}</span>
                <span className={styles.menuCard__action}>{t('speed.start')} →</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'solo' && difficulty && !minutes && (
        <div className={styles.menu}>
          <p className={styles.menu__hint}>{t('speed.pickMinutes')}</p>
          <div className={styles.menu__cards}>
            {[1, 2, 3, 5].map(m => (
              <button
                key={m}
                className={styles.menuCard}
                onClick={() => setMinutes(m)}
                style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
              >
                <span className={styles.menuCard__icon}>⏱</span>
                <span className={styles.menuCard__title}>{t('speed.minutes', { count: m })}</span>
                <span className={styles.menuCard__desc}>{t('speed.minutesDesc', { count: m })}</span>
                <span className={styles.menuCard__action}>{t('speed.start')} →</span>
              </button>
            ))}
          </div>
          <button className={styles.menu__back} onClick={backToDifficulty}>{t('speed.backToLevel')}</button>
        </div>
      )}
      {mode === 'solo' && difficulty && minutes && (
        <SoloMode
          level={difficulty}
          minutes={minutes}
          // Change difficulty from the answering screen: clearing the
          // state shows the difficulty picker again; picking a new level
          // remounts SoloMode, so the session stats reset naturally.
          onChangeLevel={backToDifficulty}
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
