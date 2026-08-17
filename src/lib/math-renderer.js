import katex from 'katex'

const MAX_CACHE_SIZE = 100
const cache = new Map()

function getCached(key, computeFn) {
  if (cache.has(key)) {
    // Move to end (LRU)
    const value = cache.get(key)
    cache.delete(key)
    cache.set(key, value)
    return value
  }
  const value = computeFn()
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(key, value)
  return value
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 文本模式支援嘅 LaTeX text commands（有限子集）：\textbf → bold、
// \textit/\emph → italic。其餘 command 保持字面（escape 咗）。
const TEXT_COMMAND_RULES = [
  [/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>'],
  [/\\textit\{([^}]*)\}/g, '<em>$1</em>'],
  [/\\emph\{([^}]*)\}/g, '<em>$1</em>'],
]

function renderPlainText(content) {
  let html = escapeHtml(content)
  for (const [re, tag] of TEXT_COMMAND_RULES) {
    html = html.replace(re, tag)
  }
  return html
}

// 冇 $ 分隔時，點判斷係咪 legacy raw LaTeX（舊數據）？
// 用「math 命令特徵」而唔係「有冇 backslash」——普通文本夾雜
// \textbf 等 text command 應該行文本模式，唔可以成段當 display math。
const MATH_COMMAND_RE = /\\(frac|sqrt|int|sum|prod|lim|log|ln|sin|cos|tan|begin|end|left|right|cdot|times|div|pm|infty|pi|alpha|beta|gamma|delta|theta|lambda|leq|geq|neq|approx|rightarrow|to)\b/

function renderInlineSegment(text) {
  const parts = text.split(/(\$[^$]+\$)/g)

  return parts
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1)
        try {
          return katex.renderToString(formula, {
            throwOnError: true,
            displayMode: false,
          })
        } catch {
          return `<span style="color:var(--text-muted)">${escapeHtml(formula)}</span>`
        }
      }
      return renderPlainText(part) // 文本段：escape + \textbf 等 text commands
    })
    .join('')
}

export function renderLatex(content) {
  if (!content) return ''

  return getCached(content, () => {
    const hasDisplayDollar = /\$\$[\s\S]*?\$\$/.test(content)
    const hasInlineDollar = /(?<!\$)\$(?!\$)[^$]+\$(?!\$)/.test(content)

    if (!hasDisplayDollar && !hasInlineDollar) {
      // 冇 $ 分隔：有 math 命令特徵先當 legacy raw LaTeX（舊數據）成段 display；
      // 否則係普通文本（可能夾雜 \textbf 等 text commands）→ 文本模式。
      if (MATH_COMMAND_RE.test(content)) {
        try {
          return katex.renderToString(content, {
            throwOnError: true,
            displayMode: true,
          })
        } catch {
          return '<span style="color:var(--text-muted)">(formula error)</span>'
        }
      }
      return renderPlainText(content)
    }

    // Step 1: split by $$...$$ display blocks
    const segments = content.split(/(\$\$[\s\S]*?\$\$)/g)

    return segments
      .map((seg) => {
        if (seg.startsWith('$$') && seg.endsWith('$$')) {
          const formula = seg.slice(2, -2)
          try {
            return katex.renderToString(formula, {
              throwOnError: true,
              displayMode: true,
            })
          } catch {
            return `<div style="color:var(--text-muted); padding:0.5rem 0">${escapeHtml(formula)}</div>`
          }
        }
        // Plain text or inline $...$ — handle inline rendering
        return renderInlineSegment(seg)
      })
      .join('')
  })
}
