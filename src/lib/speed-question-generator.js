// ── Speed Math question generator (fill-in-the-blank) ──
// Produces `text` + numeric `answer`. The answer is stored in the room
// deck on the server side; question_data broadcast to clients contains
// ONLY { text, timeLimit } so players cannot read the answer from JS.

const LEVELS = {
  2: { label: 'Medium', maxA: 120, maxB: 120, ops: ['×'] },
}

// Difficulty metadata shared by the SoloMode and battle pickers
// (desc 係 i18n key——UI 文案集中喺字典；title 本身係英文)
export const DIFFICULTIES = [
  { level: 2, icon: '⚡', title: 'Medium', descKey: 'speed.diff.medium' },
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
    timeLimit: level === 1 ? 15 : level === 2 ? 20 : 10,
  }
}

export function generateQuestionBatch(count = 10, level = 2) {
  return Array.from({ length: count }, () => generateQuestion(level))
}
