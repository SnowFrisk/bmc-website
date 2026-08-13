// ── Speed Math question generator (fill-in-the-blank) ──
// Produces `text` + numeric `answer`. The answer is stored in the room
// deck on the server side; question_data broadcast to clients contains
// ONLY { text, timeLimit } so players cannot read the answer from JS.

const LEVELS = {
  1: { label: 'Easy',   maxA: 12, maxB: 12, ops: ['+', '-'] },
  2: { label: 'Medium', maxA: 120, maxB: 120, ops: ['×'] },
  3: { label: 'Hard',   maxA: 40, maxB: 20, ops: ['+', '-', '×', '÷'] },
}

// Difficulty metadata shared by the SoloMode and battle pickers
export const DIFFICULTIES = [
  { level: 1, icon: '🌱', title: 'Easy',   desc: '簡單加減，15 秒一題' },
  { level: 2, icon: '⚡', title: 'Medium', desc: '四則混合，12 秒一題' },
  { level: 3, icon: '🔥', title: 'Hard',   desc: '大數乘除，10 秒一題' },
]

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function evaluate(a, b, op) {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '×': return a * b
    case '÷': return Math.round(a / b)
    default: return a + b
  }
}

export function generateQuestion(level = 1) {
  const cfg = LEVELS[level] ?? LEVELS[1]
  const a = randInt(2, cfg.maxA)
  const b = randInt(2, cfg.maxB)
  const op = pick(cfg.ops)

  // Division yields whole numbers for readability
  const safeA = op === '÷' ? a * b : a
  const answer = evaluate(safeA, b, op)

  return {
    text: `${safeA} ${op} ${b} = ?`,
    answer,
    timeLimit: level === 1 ? 15 : level === 2 ? 12 : 10,
  }
}

export function generateQuestionBatch(count = 10, level = 2) {
  return Array.from({ length: count }, () => generateQuestion(level))
}
