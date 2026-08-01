import katex from 'katex'

/**
 * Render content that may contain:
 *   $$...$$   → display-mode KaTeX (multi-line, align, matrix, etc.)
 *   $...$     → inline-mode KaTeX
 *   plain text with no delimiters → legacy display-mode (backward compat)
 *
 * Returns an HTML string safe for dangerouslySetInnerHTML.
 */

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Render a segment that may contain inline $...$ math.
 * Segments that start/end with `$$` have already been stripped
 * by the outer split, so any `$` here is a single-dollar inline delimiter.
 */
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

  const hasDisplayDollar = /\$\$[\s\S]*?\$\$/.test(content)
  const hasInlineDollar  = /(?<!\$)\$(?!\$)[^$]+\$(?!\$)/.test(content)

  if (!hasDisplayDollar && !hasInlineDollar) {
    // Pure display formula — backward compatible with old data
    try {
      return katex.renderToString(content, {
        throwOnError: true,
        displayMode: true,
      })
    } catch {
      return '<span style="color:var(--text-muted)">(formula error)</span>'
    }
  }

  // Step 1: split by $$...$$ display blocks
  // These become display-mode KaTeX; everything else goes through inline processing
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
}
