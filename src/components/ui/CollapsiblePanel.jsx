import { useState } from 'react'
import { renderLatex } from '../../lib/math-renderer'

export function CollapsiblePanel({
  title,
  children,
  activeColor = 'var(--potc-theme-color)',
  defaultOpen = false,
  headerContent,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      onClick={() => setOpen(!open)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') setOpen(!open) }}
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 10,
        border: open
          ? `1px solid ${activeColor}`
          : '1px solid var(--border)',
        backgroundColor: open
          ? `color-mix(in srgb, ${activeColor} 8%, transparent)`
          : 'var(--bg-secondary)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background-color 0.2s',
        outline: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        {headerContent ? (
          headerContent
        ) : (
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: open ? activeColor : 'var(--text-secondary)',
            flex: 1,
            transition: 'color 0.2s',
          }}>
            {title}
          </span>
        )}
        <span style={{
          fontSize: 18,
          color: 'var(--text-muted)',
          transition: 'transform 0.25s, color 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          ...(open && { color: activeColor }),
        }}>
          ▾
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 14, lineHeight: 1.8, paddingTop: '0.75rem' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CollapsibleLatex({
  content,
  activeColor = 'var(--potc-theme-color)',
  defaultOpen = false,
  headerContent,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      onClick={() => setOpen(!open)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') setOpen(!open) }}
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 10,
        border: open
          ? `1px solid ${activeColor}`
          : '1px solid var(--border)',
        backgroundColor: open
          ? `color-mix(in srgb, ${activeColor} 8%, transparent)`
          : 'var(--bg-secondary)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background-color 0.2s',
        outline: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        {headerContent ? (
          headerContent
        ) : (
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: open ? activeColor : 'var(--text-secondary)',
            flex: 1,
            transition: 'color 0.2s',
          }}>
            參考解法
          </span>
        )}
        <span style={{
          fontSize: 18,
          color: 'var(--text-muted)',
          transition: 'transform 0.25s, color 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          ...(open && { color: activeColor }),
        }}>
          ▾
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div
            dangerouslySetInnerHTML={{ __html: renderLatex(content) }}
            style={{ fontSize: 14, lineHeight: 1.8, paddingTop: '0.75rem' }}
          />
        </div>
      </div>
    </div>
  )
}
