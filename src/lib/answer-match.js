import { parse } from 'mathjs'

// ── LaTeX → math.js syntax converter (supported subset) ──
// Handles the constructs used in club problem sets: fractions, roots,
// common operator aliases, greek constants and function names. Anything
// that does not convert stays as-is and fails mathjs parse → judged
// wrong, which is the desired game outcome for a malformed answer.

const GREEK = {
  '\\alpha': 'alpha',
  '\\beta': 'beta',
  '\\gamma': 'gamma',
  '\\delta': 'delta',
  '\\epsilon': 'epsilon',
  '\\theta': 'theta',
  '\\lambda': 'lambda',
  '\\mu': 'mu',
  '\\pi': 'pi',
  '\\rho': 'rho',
  '\\sigma': 'sigma',
  '\\tau': 'tau',
  '\\phi': 'phi',
  '\\varphi': 'phi',
  '\\omega': 'omega',
  '\\Delta': 'Delta',
  '\\Gamma': 'Gamma',
  '\\Omega': 'Omega',
  '\\infty': 'Infinity',
}

export function latexToMath(input) {
  let s = String(input).trim()
  // strip display/inline math wrappers
  s = s.replace(/^\$\$?|\$\$?$/g, '')
  // grouping commands
  s = s.replace(/\\left|\\right/g, '')
  // spacing commands → space
  s = s.replace(/\\,|\\;|\\!|\\quad|\\qquad/g, ' ')
  // operator aliases (LaTeX and plain unicode)
  s = s.replace(/\\times|\\cdot|\\ast/g, '*')
  s = s.replace(/\\div/g, '/')
  s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/·/g, '*')
  // relational/equality signs (inequality answers)
  s = s.replace(/\\le|\\leq/g, '<=')
  s = s.replace(/\\ge|\\geq/g, '>=')
  s = s.replace(/\\neq/g, '!=')
  // ellipsis are filler, drop them
  s = s.replace(/\\ldots|\\cdots/g, '')
  // absolute value: |x| → abs(x) (single-level)
  s = s.replace(/\|([^|]+)\|/g, 'abs($1)')
  // commands — convert innermost first, so nested brace groups
  // (e.g. \frac{\sqrt{3}}{2}) resolve outer-to-inner
  let prev
  do {
    prev = s
    // innermost \sqrt[n]{x} → nthRoot(x, n), \sqrt{x} → sqrt(x)
    s = s.replace(/\\sqrt(?:\[([^{}]*)\])?\{([^{}]*)\}/g,
      (_, n, body) => (n ? `nthRoot(${body}, ${n})` : `sqrt(${body})`))
    // innermost \frac{a}{b} → ((a)/(b))
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,
      (_, a, b) => `((${a})/(${b}))`)
    // LaTeX single-token shorthands (legal LaTeX, common from players):
    // \frac13 = \frac{1}{3}, \sqrt4 = \sqrt{4}. The character classes
    // exclude { } \ so full-brace forms are never mis-matched.
    s = s.replace(/\\frac([^\\{}])([^\\{}])/g, (_, a, b) => `((${a})/(${b}))`)
    s = s.replace(/\\sqrt([^\\{}])/g, (_, a) => `sqrt(${a})`)
  } while (s !== prev)
  // greek constants
  for (const [k, v] of Object.entries(GREEK)) s = s.split(k).join(v)
  // remaining commands are function names — drop the backslash
  s = s.replace(/\\/g, '')
  // braces are grouping in LaTeX → parens in math.js
  s = s.replace(/\{/g, '(').replace(/\}/g, ')')
  // implicit multiplication before function calls: 2\sqrt{3} → 2*sqrt(3)
  s = s.replace(/([0-9)])(sqrt|nthRoot|sin|cos|tan|log|ln|abs|exp|asin|acos|atan)\(/g, '$1*$2(')
  return s
}

// ── "Simplest form" check ──
// Used when a question demands a fully simplified answer (simplest: true):
// the answer must be value-equivalent AND contain no reducible structure
// (√4 → 2, 2/4 → 1/2, 6/3 → 2). Detect the common reducible patterns:
// sqrt of a perfect square, non-coprime fraction, integer division.
function hasReducibleMath(userInput) {
  try {
    const node = parse(latexToMath(userInput))
    let reducible = false
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
    // latexToMath emits extra parens — unwrap them to reach constants
    const plain = n => { while (n.isParenthesisNode) n = n.content; return n }
    node.traverse(n => {
      if (reducible) return
      if (n.isFunctionNode && n.fn.name === 'sqrt' && n.args.length === 1) {
        const inner = plain(n.args[0])
        if (inner.isConstantNode) {
          const v = Number(inner.value)
          if (v >= 0 && Number.isInteger(Math.sqrt(v))) reducible = true
        }
      }
      if (n.isOperatorNode && n.op === '/') {
        const a = plain(n.args[0])
        const b = plain(n.args[1])
        if (a.isConstantNode && b.isConstantNode) {
          const av = Math.round(Number(a.value))
          const bv = Math.round(Number(b.value))
          if (bv !== 0 && (gcd(Math.abs(av), Math.abs(bv)) > 1 || bv === 1)) reducible = true
        }
      }
      // Powers under 1000 must be evaluated: 5^4 = 625 (reducible),
      // 4^6 = 4096 ≥ 1000 (keep as a power — no big-number mental math).
      if (n.isOperatorNode && n.op === '^') {
        const a = plain(n.args[0])
        const b = plain(n.args[1])
        if (a.isConstantNode && b.isConstantNode) {
          const base = Number(a.value)
          const exp = Number(b.value)
          if (Number.isInteger(base) && Number.isInteger(exp) && exp > 1 && base > 0) {
            if (Math.pow(base, exp) < 1000) reducible = true
          }
        }
      }
    })
    return reducible
  } catch {
    return false // unparseable input is already judged wrong
  }
}

// ── Equivalence check ──
// 1) Exact trimmed string equality (fast path — plain integer answers).
// 2) Parse both as math.js expressions; identical symbol sets required.
// 3) Probe substitution: substitute several non-trivial values for every
//    symbol and compare numerically within tolerance. Works for numeric
//    expressions (2+√3 ≡ √3+2, 1/2 ≡ 0.5) and algebraic ones (x+x ≡ 2x).
// Anything that fails to parse or evaluate (garbage input, mismatched
// variables) is judged wrong — a wrong answer is a game outcome.

// Validation for bank authors: an answer must be parseable by the SAME
// parser judge uses (latexToMath + mathjs parse) — numbers, LaTeX math
// and algebraic expressions all pass; garbage that judge could never
// evaluate ("hello", "??") is rejected at import time. A bare unknown
// symbol ("hello", "abc", "x") carries no value, so it is rejected too;
// constants (pi, e) and any expression with operations are fine.
const MATH_CONSTANTS = new Set(['pi', 'e', 'i', 'Infinity', 'NaN', 'true', 'false'])

export function isValidAnswer(value) {
  const text = String(value ?? '').trim()
  if (!text) return false
  try {
    const node = parse(latexToMath(text))
    if (node.isSymbolNode && !MATH_CONSTANTS.has(node.name)) return false
    return true
  } catch {
    return false
  }
}

// All-answers mode: a multi-answer question requires EVERY answer — the
// player must type them all (semicolon-separated), no more, no less.
// Each correct answer must be covered by some player answer, AND every
// player answer must match some correct answer (no extras). Example:
// x²=9 → ["3","-3"] — "3" alone is wrong, "3; -3" is right, "3; 5" is
// wrong. Order does not matter; answersMatch gives equivalence per item.
export function answersMatchAll(userInput, answers, options = {}) {
  const userParts = String(userInput).split(';').map(s => s.trim()).filter(Boolean)
  if (userParts.length === 0) return false
  if (!answers.every(a => userParts.some(u => answersMatch(u, a, options)))) return false
  return userParts.every(u => answers.some(a => answersMatch(u, a, options)))
}

const PROBE_VALUES = [1.234567, 0.7319, 2.8642]

// math.js built-in constants that must not be treated as variables
const CONSTANTS = new Set(['pi', 'e', 'i', 'Infinity', 'true', 'false', 'NaN'])

function symbolsOf(node) {
  const symbols = new Set()
  // Walk the tree with context: a FunctionNode's name (e.g. `sqrt`) is a
  // SymbolNode but not a variable — skip it so probe substitution never
  // shadows built-in functions with a number.
  function walk(n) {
    if (n.isSymbolNode && !CONSTANTS.has(n.name)) symbols.add(n.name)
    if (n.isFunctionNode) {
      n.args.forEach(walk)
      return
    }
    n.forEach(child => walk(child))
  }
  walk(node)
  return symbols
}

export function answersMatch(userInput, correctAnswer, { simplest = false } = {}) {
  const norm = (s) => String(s).trim().replace(/\s+/g, '')
  // Exact string match is by definition simplest — return immediately.
  if (norm(userInput) === norm(correctAnswer)) return true

  try {
    const userNode = parse(latexToMath(userInput))
    const correctNode = parse(latexToMath(correctAnswer))

    const userSymbols = symbolsOf(userNode)
    const correctSymbols = symbolsOf(correctNode)
    if (userSymbols.size !== correctSymbols.size) return false
    for (const s of userSymbols) {
      if (!correctSymbols.has(s)) return false
    }

    // compile once, then evaluate per probe (mathjs 15 `evaluate` only
    // accepts strings; compiled nodes take a scope object)
    const userExpr = userNode.compile()
    const correctExpr = correctNode.compile()
    for (const probe of PROBE_VALUES) {
      const scope = {}
      for (const s of userSymbols) scope[s] = probe
      const uv = userExpr.evaluate(scope)
      const cv = correctExpr.evaluate(scope)
      if (typeof uv !== 'number' || typeof cv !== 'number') return false
      if (Math.abs(uv - cv) >= 1e-9) return false
    }

    // Value-equivalent but the question demands the simplest form:
    // a reducible structure (√4, 2/4, 6/3) is judged wrong.
    if (simplest && hasReducibleMath(userInput)) return false

    return true
  } catch {
    return false
  }
}
