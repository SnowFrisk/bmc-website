import { useEffect, useRef } from 'react'
import i18n from '../i18n'
import { supabase } from '../lib/supabase'
import { generateQuestionBatch } from '../lib/speed-question-generator'
import { answersMatch, answersMatchAll } from '../lib/answer-match'

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ── Map raw Supabase errors to player-friendly messages ──
// Answers are free-form (numbers or LaTeX), so the UI deliberately does
// NOT block non-numeric input — a wrong answer is a game outcome, not an
// error. But a DB type mismatch (e.g. chosen_value still INT until the
// TEXT migration runs) surfaces as a 400; translate that and other
// transient failures into something the player can act on.
export function friendlyAnswerError(error) {
  const msg = error?.message ?? String(error)
  if (/invalid input syntax for type (integer|int)/i.test(msg)) {
    return i18n.t('speed.error.answerFormat')
  }
  if (/Failed to fetch|NetworkError|network|ECONN/i.test(msg)) {
    return i18n.t('speed.error.network')
  }
  if (/duplicate|23505/i.test(msg)) {
    return i18n.t('speed.error.duplicate')
  }
  return msg
}

// ── Host: create a room with a pre-generated question deck.
// The host joins automatically as a player so they can play along,
// while keeping host controls (advance / tally / end).
// The deck (with answers) is stored in the room so every client can
// show the review at the end; question_data only carries text+timeLimit. ──
export async function createRoom(hostName, questionCount = 10, level = 2, bankQuestions = null) {
  const code = makeCode()
  // bankQuestions is a prepared deck from a question bank (same shape:
  // { text, answer, timeLimit }) — used as-is; otherwise generate random.
  const deck = bankQuestions ?? generateQuestionBatch(questionCount, level)
  const { data, error } = await supabase
    .from('speed_rooms')
    .insert({ code, status: 'waiting', question_data: null, deck })
    .select()
    .single()
  if (error) throw new Error(error.message)

  const { data: hostPlayer, error: pErr } = await supabase
    .from('speed_players')
    .insert({ room_id: data.id, name: hostName || i18n.t('speed.hostDefault') })
    .select()
    .single()
  if (pErr) throw new Error(pErr.message)

  return { room: data, deck, hostPlayer }
}

// ── Host: start the game (first question) ──
export async function startGame(roomId, firstQuestion) {
  const { error } = await supabase
    .from('speed_rooms')
    .update({ status: 'playing', current_question: 1, question_data: firstQuestion })
    .eq('id', roomId)
  if (error) throw new Error(error.message)
}

// ── Host: advance to the next question ──
export async function nextQuestion(roomId, questionIndex, question) {
  const { error } = await supabase
    .from('speed_rooms')
    .update({ current_question: questionIndex, question_data: question })
    .eq('id', roomId)
  if (error) throw new Error(error.message)
}

// ── Host: end the game ──
export async function endGame(roomId) {
  const { error } = await supabase
    .from('speed_rooms')
    .update({ status: 'ended', question_data: null })
    .eq('id', roomId)
  if (error) throw new Error(error.message)
}

// ── Player: join a room by code ──
export async function joinRoom(code, name) {
  const { data: room, error: roomError } = await supabase
    .from('speed_rooms')
    .select('*')
    .eq('code', code)
    .maybeSingle()
  if (roomError) throw new Error(roomError.message)
  if (!room) throw new Error(i18n.t('speed.error.roomNotFound'))
  if (room.status === 'ended') throw new Error(i18n.t('speed.error.roomEnded'))

  const { data: player, error: playerError } = await supabase
    .from('speed_players')
    .insert({ room_id: room.id, name })
    .select()
    .single()
  if (playerError) throw new Error(playerError.message)
  return { room, player }
}

// ── Player: submit a fill-in answer (returns the inserted row so the
// sender can broadcast it). is_correct stays NULL — host judges.
// chosenValue is a string: a plain number ("96") or raw LaTeX ("\frac{1}{2}").
export async function submitAnswer({ roomId, playerId, questionIndex, chosenValue }) {
  const { data, error } = await supabase
    .from('speed_answers')
    .insert({
      room_id: roomId,
      player_id: playerId,
      question_index: questionIndex,
      chosen_value: chosenValue,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ── Host: judge one answer against the deck, mark it, award points.
// Returns { isCorrect, score } — the player's (possibly updated) score,
// so the host can broadcast the verdict and score to everyone.
// Comparison is math-aware: exact strings match first, then symbolic
// simplification and numeric tolerance (2+√3 ≡ √3+2, 1/2 ≡ 0.5). ──
export async function judgeAnswer({ answerId, playerId, chosenValue, correctAnswer, simplest = false, timeLeft = null, timeLimit = null }) {
  // correctAnswer may be a string (single answer, backward compatible) or
  // an array (multi-answer bank question — the player must give ALL of
  // them, semicolon-separated; one or a subset is wrong). `simplest`
  // (bank question flag) demands the answer be in simplest form: value-
  // equivalent but reducible input (√4 instead of 2) is judged wrong.
  const options = { simplest }
  const isCorrect = Array.isArray(correctAnswer)
    ? answersMatchAll(chosenValue, correctAnswer, options)
    : answersMatch(chosenValue, correctAnswer, options)
  const { error: updateError } = await supabase
    .from('speed_answers')
    .update({ is_correct: isCorrect })
    .eq('id', answerId)
  if (updateError) return null

  const { data: player, error: fetchError } = await supabase
    .from('speed_players')
    .select('score')
    .eq('id', playerId)
    .single()
  if (fetchError) return null

  let newScore = player.score
  if (isCorrect) {
    // 100 base + up to 100 time bonus, SQUARE-weighted on the remaining
    // ratio (matches solo scoring): fast answers pay off hard, the 100
    // base keeps slow-but-right answers rewarded. The player's remaining
    // time travels with the answered broadcast event.
    let gained = 100
    if (typeof timeLeft === 'number' && typeof timeLimit === 'number' && timeLimit > 0) {
      const ratio = Math.min(1, Math.max(0, timeLeft / timeLimit))
      gained = 100 + Math.round(ratio * ratio * 100)
    }
    newScore = player.score + gained
    const { error } = await supabase
      .from('speed_players')
      .update({ score: newScore })
      .eq('id', playerId)
    if (error) return null
  }
  return { isCorrect, score: newScore }
}

// ── Live subscription hook (client broadcast) ──
// This project's Realtime cannot read DB WAL (postgres_changes and DB
// broadcast triggers both fail silently), but client-to-client broadcast
// works (verified via probe ping). So: DB stays the source of truth
// (fetched on join / refresh), and live updates flow through client
// broadcast events sent by whoever performs the action.
export function useRoomChannel(roomId, roomCode, handlers) {
  const channelRef = useRef(null)
  const handlersRef = useRef(handlers)
  // latest-ref pattern: write after every render (not during it), so the
  // broadcast callback always sees the freshest handlers
  useEffect(() => { handlersRef.current = handlers })

  useEffect(() => {
    if (!roomId && !roomCode) return
    const topic = `room:${roomCode ?? roomId}`
    const channel = supabase
      .channel(topic)
      .on('broadcast', { event: 'speed-event' }, (payload) => {
        const { type, data } = payload.payload ?? {}
        const h = handlersRef.current
        if (!h || !type) return
        switch (type) {
          case 'room-update':   h.onRoomUpdate?.(data); break
          case 'player-joined': h.onPlayerJoin?.(data); break
          case 'answered':      h.onAnswer?.(data); break
          case 'verdict':       h.onAnswerUpdate?.(data); break
          case 'score-update':  h.onScoreUpdate?.(data); break
          case 'transition':    h.onTransition?.(data); break
          default: break
        }
      })
    channel.subscribe()
    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId, roomCode])

  // Send a typed event to every other client in the room.
  // (Self is not echoed — the sender updates its own state directly.)
  // Broadcast is best-effort (DB is the source of truth), so failures are
  // swallowed — e.g. HMR/StrictMode tearing down the channel mid-send
  // causes "listener indicated async response but channel closed".
  const sendEvent = (type, data) => {
    try {
      // sendEvent only ever runs from event handlers / callbacks, never
      // during render — the channel is always initialized by then.
      const ack = channelRef.current?.send({
        type: 'broadcast',
        event: 'speed-event',
        payload: { type, data },
      })
      ack?.catch(() => {})
    } catch {
      /* channel closed — best-effort, ignore */
    }
  }

  return sendEvent
}

// ── Fetch current players (sorted by score) ──
export async function fetchPlayers(roomId) {
  const { data, error } = await supabase
    .from('speed_players')
    .select('*')
    .eq('room_id', roomId)
    .order('score', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Fetch one player's answers (for the review screen) ──
// roomId filter is essential: the same player may have played in older
// rooms, and mixing them would show wrong verdicts in the review.
export async function fetchMyAnswers(playerId, roomId) {
  const { data, error } = await supabase
    .from('speed_answers')
    .select('*')
    .eq('player_id', playerId)
    .eq('room_id', roomId)
    .order('question_index', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
