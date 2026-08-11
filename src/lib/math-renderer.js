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
      return escapeHtml(part)
    })
    .join('')
}

export function renderLatex(content) {
  if (!content) return ''

  return getCached(content, () => {
    const hasDisplayDollar = /\$\$[\s\S]*?\$\$/.test(content)
    const hasInlineDollar = /(?<!\$)\$(?!\$)[^$]+\$(?!\$)/.test(content)

    if (!hasDisplayDollar && !hasInlineDollar) {
      // Contains backslashes → legacy raw LaTeX (old data), render as display.
      // Otherwise it's plain text — escape it instead of forcing KaTeX,
      // so plain-text steps render at the same size as everything else.
      if (content.includes('\\')) {
        try {
          return katex.renderToString(content, {
            throwOnError: true,
            displayMode: true,
          })
        } catch {
          return '<span style="color:var(--text-muted)">(formula error)</span>'
        }
      }
      return escapeHtml(content)
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
