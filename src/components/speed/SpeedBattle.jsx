import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fetchQuestionBanks } from '../../lib/speed-bank'
import { DIFFICULTIES } from '../../lib/speed-question-generator'

// Rotating gameplay tips shown in the lobby — players are idle there, so
// it is a natural "teachable moment" for answer-format rules.
const LOBBY_TIPS = [
  '多個答案用分號分隔，例如：3; -3',
  '答案支援 LaTeX，例如：\\frac{1}{2}',
  '等價寫法都算啱：2 + \\sqrt{3} ≡ \\sqrt{3} + 2',
  '答得越快，分數越高！',
  '每人每題只有一次作答機會',
  '答錯唔扣分，但會慢人一步',
]

// Simplest-form rules are only enforced when the bank has the "最簡"
// toggle on — show these tips only for such banks, so players of a
// random-speed-math room are not misled.
const SIMPLEST_TIPS = [
  '最簡形式：√4 要答 2，唔可以留 √4',
  '分數要約分：2/4 要答 1/2',
  '少於 1000 嘅冪要化簡：5^4 答 625；4^6 可以保留（≥1000）',
]

function LobbyTips({ simplest = false }) {
  const tips = [...LOBBY_TIPS, ...(simplest ? SIMPLEST_TIPS : [])]
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % tips.length), 5000)
    return () => clearInterval(t)
  }, [tips.length])
  // key forces a re-mount per tip so the fade-in animation replays
  return <p key={index} className={styles.battle__tip}>💡 {tips[index]}</p>
}
import {
  createRoom, startGame, nextQuestion, endGame,
  joinRoom, submitAnswer, judgeAnswer, fetchPlayers, fetchMyAnswers,
  useRoomChannel, friendlyAnswerError,
} from '../../hooks/useSpeedRoom'
import Spinner from '../ui/Spinner'
import BackButton from '../ui/BackButton'
import btnStyles from '../ui/buttons.module.css'
import styles from './SpeedBattle.module.css'
import { renderLatex } from '../../lib/math-renderer'

// ══════════════ Unified battle game ══════════════
// Fill-in-the-blank speed battle. Continuous flow: the host device
// auto-advances when the timer runs out or everyone has answered.
// Answers are judged on the host device (the deck stays server-side /
// host-side), so no client ever sees the answer before the review.
export default function SpeedBattle({ onExit, initialRole = null, initialCode = '' }) {
  // initialRole/initialCode let a deep link (`/speed?mode=join&code=…`)
  // skip the role selection and land straight in the join form.
  const [role, setRole] = useState(initialRole)   // 'host' | 'join'
  const [phase, setPhase] = useState(initialRole ? 'setup' : 'role') // role | setup | lobby | playing | review
  const [room, setRoom] = useState(null)
  const [deck, setDeck] = useState([])
  const [player, setPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState(initialCode)
  const [notice, setNotice] = useState(null)
  const [copied, setCopied] = useState(false)

  // Question source for the host: random speed math or a prepared bank
  const [source, setSource] = useState('random') // 'random' | 'bank'
  const [banks, setBanks] = useState([])
  const [bankId, setBankId] = useState('')
  // Chosen difficulty for random speed math (picked on the 'level' phase)
  const [level, setLevel] = useState(2)

  // playing state
  const [question, setQuestion] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answerInput, setAnswerInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [myVerdict, setMyVerdict] = useState(null) // true | false | null
  const [answeredCount, setAnsweredCount] = useState(0)

  // review state
  const [myAnswers, setMyAnswers] = useState([])
  const [roomAnswers, setRoomAnswers] = useState([])
  const [reviewIndex, setReviewIndex] = useState(0) // master–detail: which question is open

  // Leave the battle entirely (review / lobby back button) — reset all state
  function resetAll() {
    setPhase('role')
    setRoom(null)
    setPlayer(null)
    setPlayers([])
    setDeck([])
    setQuestion(null)
    setMyAnswers([])
    setRoomAnswers([])
    setNotice(null)
  }

  const isHostDevice = role === 'host'
  const advancingRef = useRef(false)
  const advanceTimerRef = useRef(null)
  // Local cache of judged answers (answerId → isCorrect). The host judges
  // on its device and the DB update is async; review merges this cache so
  // the per-question verdicts stay correct even if the DB write lags.
  // Kept as state (not a ref): review reads it during render.
  const [verdictCache, setVerdictCache] = useState({})
  // 2s result transition after a question ends: verdict + leader stay on
  // screen (no race with a premature room-update) before auto-advancing.
  const [showTransition, setShowTransition] = useState(false)

  useEffect(() => () => clearTimeout(advanceTimerRef.current), [])

  // Single source of truth for "room state changed": both the host's local
  // optimistic updates (start/advance) and broadcast receipts go through
  // here, so phase/question/timer always stay in sync on every client.
  function applyRoom(r) {
    setRoom(r)
    advancingRef.current = false
    clearTimeout(advanceTimerRef.current)
    setShowTransition(false)
    if (r.status === 'playing' && r.question_data) {
      setPhase('playing')
      setQuestion(r.question_data)
      setQIndex(r.current_question)
      setTimeLeft(r.question_data.timeLimit ?? 12)
      setAnswerInput('')
      setSubmitted(false)
      setMyVerdict(null)
      setAnsweredCount(0)
    }
    if (r.status === 'ended') {
      setPhase('review')
      setReviewIndex(0)
      loadReview(r)
    }
  }

  const sendEvent = useRoomChannel(room?.id, room?.code, {
    onRoomUpdate: (r) => applyRoom(r),
    onPlayerJoin: (p) => {
      setPlayers(prev => [...prev.filter(x => x.id !== p.id), p])
    },
    onAnswer: async (a) => {
      setAnsweredCount(c => c + 1)
      // Host device judges against the deck, then broadcasts verdict + score
      if (isHostDevice) judgeAnswerRow(a)
    },
    onAnswerUpdate: (v) => {
      // verdict: { playerId, answerId, isCorrect }
      if (v.answerId) setVerdictCache(prev => ({ ...prev, [v.answerId]: v.isCorrect }))
      if (v.playerId === player?.id) setMyVerdict(v.isCorrect)
    },
    onTransition: () => setShowTransition(true),
    onScoreUpdate: (s) => {
      setPlayers(prev => prev.map(x => (x.id === s.playerId ? { ...x, score: s.score } : x)))
    },
  })

  // ── Auto-advance (host device only): DB + optimistic local + broadcast ──
  async function advance() {
    if (advancingRef.current || !room) return
    advancingRef.current = true
    let nextRoom
    if (qIndex >= deck.length) {
      nextRoom = { ...room, status: 'ended', question_data: null }
      await endGame(room.id)
    } else {
      nextRoom = { ...room, current_question: qIndex + 1, question_data: deck[qIndex] }
      await nextQuestion(room.id, qIndex + 1, deck[qIndex])
    }
    applyRoom(nextRoom)
    sendEvent('room-update', nextRoom)
  }

  // Question over → show the verdict/leader for 2s, then advance.
  // This fixes the "last answerer never sees their ✓/✗" race: the judge
  // verdict (0.3s) always arrives during the transition window.
  function scheduleAdvance() {
    if (advancingRef.current || showTransition) return
    setShowTransition(true)
    // Show "下一題準備中" on every client, not just the host device —
    // broadcast the transition so all screens stay in sync.
    sendEvent('transition', {})
    clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => {
      setShowTransition(false)
      advance()
    }, 2000)
  }

  // Stable handle for the timeout effects below: they read the current
  // scheduleAdvance through this ref so their dependency arrays stay
  // constant (scheduleAdvance itself is re-created every render).
  const scheduleAdvanceRef = useRef(scheduleAdvance)
  useEffect(() => { scheduleAdvanceRef.current = scheduleAdvance })

  // Timer runs out → show result transition, then advance.
  // NOT gated on `submitted`: once the host has answered, the clock must
  // keep running to its end — otherwise the round hangs forever waiting
  // for the remaining players (players see the timer expire on their end
  // but the host never advances).
  useEffect(() => {
    if (phase !== 'playing' || timeLeft > 0) return
    if (isHostDevice) scheduleAdvanceRef.current()
  }, [timeLeft, phase, isHostDevice])

  // Everyone answered → show result transition, then advance early
  useEffect(() => {
    if (phase !== 'playing' || players.length === 0) return
    if (isHostDevice && answeredCount >= players.length) scheduleAdvanceRef.current()
  }, [answeredCount, players.length, phase, isHostDevice])

  // Local countdown — keeps ticking after you submit, so the timer still
  // reaches zero and the host advances on timeout even if you answered
  // early (see the timeout effect above).
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  // Load question banks for the host's "import a bank" choice.
  useEffect(() => {
    if (role !== 'host' || phase !== 'pick') return
    fetchQuestionBanks()
      .then(b => { setBanks(b); if (b.length > 0) setBankId(String(b[0].id)) })
      .catch(() => { /* non-blocking — host can still play random */ })
  }, [role, phase])

  // ── Setup actions ──
  async function handleCreate() {
    try {
      setNotice(null)
      // Source: prepared bank (deck = bank questions) or random speed math.
      // simplest is a bank-level setting — stamp it onto each deck row so
      // judgeAnswer picks it up without changing the room schema.
      const bank = source === 'bank' ? banks.find(b => b.id === Number(bankId)) : null
      if (source === 'bank' && !bank) throw new Error('請揀一個題庫。')
      const bankDeck = bank
        ? bank.questions.map(q => ({ ...q, simplest: bank.simplest === true }))
        : null
      const { room: r, deck: d, hostPlayer: hp } = await createRoom(name, 5, level, bankDeck)
      setRoom(r)
      setDeck(d)
      setPlayer(hp)
      setPlayers([hp])
      setPhase('lobby')
    } catch (e) {
      setNotice({ kind: 'error', text: e.message })
    }
  }

  async function handleJoin() {
    try {
      setNotice(null)
      const { room: r, player: p } = await joinRoom(code.trim(), name.trim())
      setRoom(r)
      // Deck lives in the room row (review needs the answers too); without
      // it the player side shows "第 x / 0 題".
      setDeck(r.deck ?? [])
      setPlayer(p)
      setPhase('lobby')
      const ps = await fetchPlayers(r.id)
      setPlayers(ps)
      // Tell the host (and anyone else in the room) we joined
      sendEvent('player-joined', p)
    } catch (e) {
      setNotice({ kind: 'error', text: e.message })
    }
  }

  async function handleStart() {
    await startGame(room.id, deck[0])
    const nextRoom = { ...room, status: 'playing', current_question: 1, question_data: deck[0] }
    applyRoom(nextRoom)
    sendEvent('room-update', nextRoom)
  }

  // Share a deep link that drops a player straight into the join form
  // with the room code pre-filled.
  function copyJoinLink() {
    const url = `${window.location.origin}${window.location.pathname}?mode=join&code=${room?.code}`
    navigator.clipboard?.writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => { /* clipboard unavailable — the code is still visible */ })
  }

  // Scene-level phase transitions (role selection ↔ difficulty ↔ setup)
  // use the same View Transition crossfade as the top-level mode switch.
  // Playing and review stay instant: animating every question advance
  // would be noisy. flushSync makes the swap land before the snapshot.
  function goToSetup(nextRole) {
    const apply = () => flushSync(() => { setRole(nextRole); setPhase('setup') })
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  // Host flow: role → question picker (difficulty OR bank, same level) →
  // setup. Join goes straight to setup.
  function goToPick() {
    const apply = () => flushSync(() => { setRole('host'); setPhase('pick') })
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  // Choosing a difficulty = random speed math; choosing a bank = its
  // prepared questions. Both land in setup, source decides the deck.
  function pickRandom(levelChoice) {
    const apply = () => flushSync(() => { setLevel(levelChoice); setSource('random'); setPhase('setup') })
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  function pickBank(bankChoice) {
    const apply = () => flushSync(() => { setBankId(String(bankChoice)); setSource('bank'); setPhase('setup') })
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  function goToRole() {
    const apply = () => flushSync(() => setPhase('role'))
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  // ── Judge one answer row (host device only), broadcast verdict + score.
  // The host judges its OWN answer here too, because self broadcasts are
  // not echoed back — otherwise the host's answer would never be judged.
  async function judgeAnswerRow(row) {
    const q = deck[row.question_index - 1]
    if (!q) return
    const result = await judgeAnswer({
      answerId: row.id,
      playerId: row.player_id,
      chosenValue: row.chosen_value,
      correctAnswer: q.answer,
      simplest: q.simplest === true,
      // Time bonus: the player's remaining seconds travel with the
      // answered broadcast (proportional scoring — see judgeAnswer)
      timeLeft: typeof row.timeLeft === 'number' ? row.timeLeft : null,
      timeLimit: q.timeLimit ?? null,
    })
    if (result) {
      setVerdictCache(prev => ({ ...prev, [row.id]: result.isCorrect }))
      sendEvent('verdict', { playerId: row.player_id, answerId: row.id, isCorrect: result.isCorrect })
      sendEvent('score-update', { playerId: row.player_id, score: result.score })
      // Update locally too when it's our own answer (no self-echo)
      if (row.player_id === player?.id) {
        setMyVerdict(result.isCorrect)
        setPlayers(prev => prev.map(x => (x.id === row.player_id ? { ...x, score: result.score } : x)))
      }
    }
  }

  // ── Answer submission: DB + broadcast so the host can judge ──
  // Answer is a plain string — a number ("96") or raw LaTeX ("\frac{1}{2}").
  async function handleSubmitAnswer() {
    const value = answerInput.trim()
    if (!value || submitted) return
    setSubmitted(true)
    setMyVerdict(null)
    try {
      const row = await submitAnswer({ roomId: room.id, playerId: player.id, questionIndex: qIndex, chosenValue: value })
      // Self broadcast isn't echoed back — bump our own count manually.
      // Attach the remaining time so the host can award the time bonus.
      setAnsweredCount(c => c + 1)
      sendEvent('answered', { ...row, timeLeft })
      // Host judges its own answer immediately (not via the echo)
      if (isHostDevice) judgeAnswerRow({ ...row, timeLeft })
    } catch (e) {
      setSubmitted(false)
      setNotice({ kind: 'error', text: friendlyAnswerError(e) })
    }
  }

  // ── Review load: my answers + all players + all answers (per-question
  //    "x/y answered correctly" counts) ──
  async function loadReview(r) {
    try {
      const [answers, ps, all] = await Promise.all([
        fetchMyAnswers(player.id, r.id),
        fetchPlayers(r.id),
        supabase.from('speed_answers').select('*').eq('room_id', r.id),
      ])
      setMyAnswers(answers)
      setRoomAnswers(all?.data ?? [])
      setPlayers(ps)
      setDeck(r.deck ?? deck)
    } catch { /* ignore */ }
  }

  const leader = players.length > 0
    ? [...players].sort((a, b) => b.score - a.score)[0]
    : null

  // Back button depends on the phase: setup → role selection,
  // review / lobby → leave the battle (reset), role → exit entirely.
  // Shared BackButton keeps position/style identical across all pages.
  const renderBack = () => {
    if (phase === 'pick') {
      return <BackButton onClick={goToRole}>← 返回</BackButton>
    }
    if (phase === 'setup') {
      // Host: back to the question picker (the step before setup — the
      // most likely reason to back out is a wrong question choice).
      // Join: back to the role selection (no picker step).
      return <BackButton onClick={isHostDevice ? goToPick : goToRole}>← 返回</BackButton>
    }
    if (phase === 'review' || phase === 'lobby') {
      return <BackButton onClick={resetAll}>← 返回</BackButton>
    }
    if (phase === 'role' && onExit) {
      return <BackButton onClick={onExit}>← 返回選單</BackButton>
    }
    return null
  }

  // ── Role selection ──
  if (phase === 'role') {
    return (
      <div className={styles.battle}>
        {renderBack()}
        <h2 className={styles.battle__title}>實時對戰</h2>
        <p className={styles.battle__hint}>填空式速算比拼 —— 揀一個角色開始</p>
        <div className={styles.battle__modeRow}>
          <button className={styles.battle__modeCard} onClick={goToPick}
            style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}>
            <span className={styles.battle__modeIcon}>🎛️</span>
            <span className={styles.battle__modeTitle}>主持遊戲</span>
            <span className={styles.battle__modeDesc}>建立房間，你會自動加入做玩家</span>
            <span className={styles.battle__modeAction}>開始 →</span>
          </button>
          <button className={styles.battle__modeCard} onClick={() => goToSetup('join')}
            style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}>
            <span className={styles.battle__modeIcon}>📲</span>
            <span className={styles.battle__modeTitle}>加入遊戲</span>
            <span className={styles.battle__modeDesc}>輸入房號，即時加入對戰</span>
            <span className={styles.battle__modeAction}>加入 →</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Question picker (host only, before setup) ──
  // Difficulty (random speed math) and banks are SAME-level choices:
  // pick one or the other, then land in setup. No "difficulty first,
  // then bank" nesting — a bank already carries its own questions.
  if (phase === 'pick') {
    return (
      <div className={styles.battle}>
        {renderBack()}
        <h2 className={styles.battle__title}>揀題目</h2>

        {/* Difficulty and banks are SAME-level choices, shown side by
            side — no scrolling to reach the bank list. */}
        <div className={styles.battle__pickGrid}>
          <section className={styles.battle__pickCol}>
            <p className={styles.battle__hint}>🎲 隨機速算</p>
            <div className={styles.battle__modeRow}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.level}
                  className={styles.battle__modeCard}
                  onClick={() => pickRandom(d.level)}
                  style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
                >
                  <span className={styles.battle__modeIcon}>{d.icon}</span>
                  <span className={styles.battle__modeTitle}>{d.title}</span>
                  <span className={styles.battle__modeDesc}>{d.desc}</span>
                  <span className={styles.battle__modeAction}>開始 →</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.battle__pickCol}>
            <p className={styles.battle__hint}>📚 導入題庫</p>
            {banks.length === 0 ? (
              <p className={styles.battle__hint}>未有題庫——先去題庫頁建立。</p>
            ) : (
              <div className={styles.battle__bankList}>
                {banks.map(b => (
                  <button
                    key={b.id}
                    className={styles.battle__bankRow}
                    onClick={() => pickBank(b.id)}
                  >
                    <span className={styles.battle__bankName}>{b.name}</span>
                    <span className={styles.battle__bankMeta}>
                      {(b.questions ?? []).length} 題{b.simplest ? ' · 最簡' : ''}
                    </span>
                    <span className={styles.battle__bankUse}>使用 →</span>
                  </button>
                ))}
              </div>
            )}
            <Link to="/bank" className={styles.battle__manageLink}>＋ 去題庫頁管理</Link>
          </section>
        </div>
      </div>
    )
  }

  // ── Setup (name / code) ──
  if (phase === 'setup') {
    return (
      <div className={styles.battle}>
        {renderBack()}
        <h2 className={styles.battle__title}>{isHostDevice ? '建立房間' : '加入對戰'}</h2>
        {!isHostDevice && (
          <input
            className={styles.battle__input}
            placeholder="6 位房號"
            value={code}
            onChange={e => setCode(e.target.value)}
            maxLength={6}
          />
        )}
        <input
          className={styles.battle__input}
          placeholder="你嘅名字（顯示喺排行榜）"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button
          className={`${btnStyles.btnPrimary} ${styles.battle__cta}`}
          onClick={isHostDevice ? handleCreate : handleJoin}
          disabled={!name.trim() || (!isHostDevice && !code.trim())}
          style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
        >
          {isHostDevice ? '建立房間' : '加入'}
        </button>
        {notice && <p className={styles.battle__error}>{notice.text}</p>}
      </div>
    )
  }

  // ── Lobby ──
  if (phase === 'lobby') {
    return (
      <div className={styles.battle}>
        {isHostDevice ? (
          <>
            <h2 className={styles.battle__title}>等待玩家加入</h2>
            <div className={styles.battle__code}>{room?.code}</div>
            <p className={styles.battle__hint}>叫隊員輸入呢個 6 位數字入房</p>
            <button
              className={`${btnStyles.btnSecondary} ${styles.battle__copyBtn}`}
              onClick={copyJoinLink}
            >
              {copied ? '✓ 連結已複製' : '🔗 複製入房連結'}
            </button>
          </>
        ) : (
          <>
            <h2 className={styles.battle__title}>已加入 {room?.code}</h2>
            <p className={styles.battle__hint}>等主持開始遊戲…</p>
          </>
        )}
        <div className={styles.battle__players}>
          {players.map(p => <span key={p.id} className={styles.battle__chip}>{p.name}</span>)}
          {players.length === 0 && <span className={styles.battle__muted}>未有玩家加入…</span>}
        </div>
        {isHostDevice && (
          <button
            className={`${btnStyles.btnPrimary} ${styles.battle__cta}`}
            onClick={handleStart}
            disabled={players.length === 0}
            style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
          >
            開始遊戲（{deck.length} 題）
          </button>
        )}
        <LobbyTips simplest={deck.some(q => q.simplest === true)} />
      </div>
    )
  }

  // ── Review (unified reveal) ──
  if (phase === 'review') {
    const podium = [...players].sort((a, b) => b.score - a.score)
    // DB is_correct is the source of truth; fall back to the in-memory
    // verdict cache when the DB write hasn't landed yet (or RLS blocked it)
    const isCorrectAnswer = (a) => (a.is_correct ?? verdictCache[a.id]) === true
    const correctCount = myAnswers.filter(isCorrectAnswer).length
    const MEDALS = ['🥇', '🥈', '🥉']

    // Current question (master–detail) — derive once so the detail panel
    // and the rail both use the same data.
    const curQ = deck[reviewIndex] ?? deck[0]
    const mine = curQ
      ? myAnswers.find(a => a.question_index === reviewIndex + 1)
      : null
    const mineCorrect = mine ? isCorrectAnswer(mine) : false
    const correctCountForQ = roomAnswers.filter(
      a => a.question_index === reviewIndex + 1 && isCorrectAnswer(a)
    ).length
    return (
      <div className={styles.battle}>
        {renderBack()}
        <h2 className={styles.battle__title}>🏆 結果</h2>

        {/* Personal summary — the most important info on this page */}
        <p className={styles.battle__summary}>
          你答啱 {correctCount} / {deck.length} 題
        </p>

        {/* Podium — vertical rows, medal for top 3, highlight self */}
        <div className={styles.battle__scoreboard}>
          {podium.map((p, i) => (
            <div
              key={p.id}
              className={`${styles.battle__scoreRow} ${p.id === player?.id ? styles['battle__scoreRow--me'] : ''}`}
            >
              <span className={styles.battle__rank}>{MEDALS[i] ?? i + 1}</span>
              <span className={styles.battle__name}>
                {p.name}{p.id === player?.id && '（你）'}
              </span>
              <span className={styles.battle__pts}>{p.score} pts</span>
            </div>
          ))}
        </div>

        <h3 className={styles.battle__reviewTitle}>逐題答案</h3>

        {/* Master–detail: question-number rail on the left, detail panel
            on the right. Rail dots carry state colour (green/red/neutral)
            so the whole round's result is scannable at a glance. */}
        <div className={styles.battle__reviewMaster}>
          <div className={styles.battle__reviewRail}>
            {deck.map((q, i) => {
              const m = myAnswers.find(a => a.question_index === i + 1)
              const ok = m ? isCorrectAnswer(m) : false
              const wrong = m && !ok
              return (
                <button
                  key={i}
                  className={`${styles.battle__reviewDot} ${
                    ok ? styles['battle__reviewDot--ok'] : ''
                  } ${wrong ? styles['battle__reviewDot--wrong'] : ''} ${
                    i === reviewIndex ? styles['battle__reviewDot--active'] : ''
                  }`}
                  onClick={() => setReviewIndex(i)}
                  aria-label={`第 ${i + 1} 題`}
                  aria-current={i === reviewIndex ? 'true' : undefined}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div className={styles.battle__reviewDetail} key={reviewIndex}>
            <p className={styles.battle__reviewMeta}>
              第 {reviewIndex + 1} 題 ·{' '}
              {mine ? (mineCorrect ? '答啱' : '答錯') : '冇作答'}
            </p>
            <div
              className={styles.battle__reviewQ}
              dangerouslySetInnerHTML={{ __html: renderLatex(curQ.text) }}
            />
            <div className={styles.battle__reviewRows}>
              <div className={styles.battle__reviewRow}>
                <span>正確答案</span>
                <span
                  className={styles.battle__reviewAnswer}
                  dangerouslySetInnerHTML={{
                    // Multi-answer bank questions display as "3 或 -3"
                    __html: renderLatex(Array.isArray(curQ.answer)
                      ? curQ.answer.join(' 或 ')
                      : String(curQ.answer)),
                  }}
                />
              </div>
              <div className={styles.battle__reviewRow}>
                <span>你嘅答案</span>
                {mine ? (
                  <span
                    className={
                      mineCorrect
                        ? styles['battle__reviewMine--ok']
                        : styles['battle__reviewMine--wrong']
                    }
                    dangerouslySetInnerHTML={{ __html: renderLatex(String(mine.chosen_value)) }}
                  />
                ) : (
                  <span className={styles.battle__reviewMine}>冇作答</span>
                )}
              </div>
              <div className={styles.battle__reviewRow}>
                <span>全隊表現</span>
                <span className={styles.battle__reviewStat}>
                  {correctCountForQ}/{players.length} 答啱
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing (unified view) ──
  return (
    <div className={styles.battle}>
      {/* Top bar: leader + progress side by side on wider screens,
          wrapping on narrow phones */}
      <div className={styles.battle__topBar}>
        <div className={styles.battle__leader}>
          {leader ? `🏆 暫時領先：${leader.name} ${leader.score}pts` : '等待作答…'}
        </div>
        <div className={styles.battle__qCount}>
          第 {qIndex} / {deck.length} 題 · 已答 {answeredCount} / {players.length}
        </div>
      </div>

      {question && (
        <>
          {/* Question text is LaTeX-capable (题库題): render via KaTeX.
              Plain-text questions (random arithmetic) escape unchanged. */}
          <div
            className={styles.battle__question}
            dangerouslySetInnerHTML={{ __html: renderLatex(question.text) }}
          />

          <div className={`${styles.battle__timer} ${timeLeft <= 5 && !submitted ? styles['battle__timer--danger'] : ''}`}>
            {timeLeft}s
          </div>

          {/* Answer stage: form and verdict overlap in the same cell and
              crossfade on submit — no instant swap, no layout jump. */}
          <div className={styles.battle__answerStage}>
            <form
              className={`${styles.battle__answerForm} ${
                submitted ? styles['battle__answerForm--leaving'] : ''
              }`}
              onSubmit={e => { e.preventDefault(); handleSubmitAnswer() }}
            >
              <input
                type="text"
                inputMode="text"
                className={styles.battle__answerInput}
                value={answerInput}
                onChange={e => { setAnswerInput(e.target.value); if (notice) setNotice(null) }}
                placeholder="輸入答案（多個答案用分號分隔，例如 3; -3；支援 LaTeX，例如 \frac{1}{2}）"
                autoFocus
                spellCheck={false}
              />
              <button
                type="submit"
                className={`${btnStyles.btnPrimary} ${styles.battle__cta}`}
                disabled={!answerInput.trim()}
                style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
              >
                提交
              </button>
            </form>
            <div className={`${styles.battle__verdict} ${
              submitted ? styles['battle__verdict--in'] : ''
            }`}>
              {myVerdict === true && '✅ 正確！'}
              {myVerdict === false && '❌ 答錯'}
              {myVerdict === null && <><Spinner /> 判斷中…</>}
              {myVerdict !== null && (
                <span
                  className={styles.battle__verdictAnswer}
                  dangerouslySetInnerHTML={{ __html: renderLatex(answerInput.trim()) }}
                />
              )}
              {showTransition && (
                <span className={styles.battle__nextHint}>下一題準備中…</span>
              )}
            </div>
          </div>

          {/* Live LaTeX preview under the input — fades out on submit,
              the verdict takes over showing what you answered. */}
          <div className={`${styles.battle__preview} ${
            submitted ? styles['battle__preview--leaving'] : ''
          }`}>
            {answerInput.trim() ? (
              <div
                className={styles.battle__previewBody}
                dangerouslySetInnerHTML={{ __html: renderLatex(answerInput.trim()) }}
              />
            ) : (
              <span className={styles.battle__previewHint}>
                輸入 LaTeX（例如 \frac{1}{2}）即時預覽
              </span>
            )}
          </div>

          {notice && <p className={styles.battle__error}>{notice.text}</p>}
        </>
      )}
    </div>
  )
}
