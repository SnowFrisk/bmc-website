import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'
import { currentLanguage } from '../../i18n'
import styles from './TodaysCenter.module.css'

// ── catalogue of triangle centres ──

const CENTRES = [
  {
    id: 'centroid',
    name: '重心',
    en: 'Centroid',
    symbol: 'G',
    descKey: 'today.desc.centroid',
    draw: (ctx, A, B, C) => {
      const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
      const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }
      drawDashedLine(ctx, C, midAB)
      drawDashedLine(ctx, A, midBC)
      return { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }
    },
  },
  {
    id: 'orthocenter',
    name: '垂心',
    en: 'Orthocenter',
    symbol: 'H',
    descKey: 'today.desc.orthocenter',
    draw: (ctx, A, B, C) => {
      const footA = footOfPerp(A, B, C)
      drawDashedLine(ctx, A, footA)
      const footB = footOfPerp(B, C, A)
      drawDashedLine(ctx, B, footB)
      return lineIntersection(A, footA, B, footB)
        ?? { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }
    },
  },
  {
    id: 'circumcenter',
    name: '外心',
    en: 'Circumcenter',
    symbol: 'O',
    descKey: 'today.desc.circumcenter',
    draw: (ctx, A, B, C) => {
      const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
      const pAB = perpVector(A, B)
      const LEN = 28
      drawDashedLine(
        ctx,
        { x: midAB.x + pAB.dx * LEN, y: midAB.y + pAB.dy * LEN },
        { x: midAB.x - pAB.dx * LEN, y: midAB.y - pAB.dy * LEN },
      )
      const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }
      const pBC = perpVector(B, C)
      return lineIntersection(
        { x: midAB.x + pAB.dx * LEN, y: midAB.y + pAB.dy * LEN },
        { x: midAB.x - pAB.dx * LEN, y: midAB.y - pAB.dy * LEN },
        { x: midBC.x + pBC.dx * LEN, y: midBC.y + pBC.dy * LEN },
        { x: midBC.x - pBC.dx * LEN, y: midBC.y - pBC.dy * LEN },
      ) ?? { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }
    },
  },
  {
    id: 'incenter',
    name: '內心',
    en: 'Incenter',
    symbol: 'I',
    descKey: 'today.desc.incenter',
    draw: (ctx, A, B, C) => {
      const a = { x: B.x - A.x, y: B.y - A.y }
      const b = { x: C.x - A.x, y: C.y - A.y }
      const la = Math.sqrt(a.x * a.x + a.y * a.y)
      const lb = Math.sqrt(b.x * b.x + b.y * b.y)
      const scale = 120
      const bisA = {
        x: A.x + (a.x / la + b.x / lb) * scale,
        y: A.y + (a.y / la + b.y / lb) * scale,
      }
      drawDashedLine(ctx, A, bisA)
      const lc = Math.sqrt((C.x - B.x) ** 2 + (C.y - B.y) ** 2)
      const sum = la + lb + lc
      return {
        x: (la * C.x + lb * B.x + lc * A.x) / sum,
        y: (la * C.y + lb * B.y + lc * A.y) / sum,
      }
    },
  },
]

// ── shared drawing helpers ──

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function drawDashedLine(ctx, from, to) {
  ctx.save()
  ctx.setLineDash([4, 5])
  ctx.strokeStyle = cssVar('--geom-construction')
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.restore()
}

function drawVertex(ctx, pt) {
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = cssVar('--geom-vertex-halo')
  ctx.fill()
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2)
  ctx.fillStyle = cssVar('--geom-vertex')
  ctx.fill()
}

function drawCentrePoint(ctx, pt) {
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2)
  ctx.strokeStyle = cssVar('--potc-theme-color')
  ctx.lineWidth = 1.1
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, 3.6, 0, Math.PI * 2)
  ctx.fillStyle = cssVar('--potc-theme-color')
  ctx.fill()
}

// ── geometry helpers ──

function footOfPerp(P, Q, R) {
  const dx = R.x - Q.x, dy = R.y - Q.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Q
  const t = ((P.x - Q.x) * dx + (P.y - Q.y) * dy) / len2
  return { x: Q.x + t * dx, y: Q.y + t * dy }
}

function perpVector(P, Q) {
  const dx = Q.x - P.x, dy = Q.y - P.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return { dx: -dy / len, dy: dx / len }
}

function lineIntersection(P1, P2, Q1, Q2) {
  const d1x = P2.x - P1.x, d1y = P2.y - P1.y
  const d2x = Q2.x - Q1.x, d2y = Q2.y - Q1.y
  const det = d1x * d2y - d1y * d2x
  if (Math.abs(det) < 1e-6) return null
  const t = ((Q1.x - P1.x) * d2y - (Q1.y - P1.y) * d2x) / det
  return { x: P1.x + t * d1x, y: P1.y + t * d1y }
}

function randomBetween(a, b) {
  return a + (b - a) * Math.random()
}

function randomTriangle(w, h, pad) {
  const halfW = w / 2 - pad
  const halfH = h / 2 - pad
  const maxR = Math.min(halfW, halfH)
  if (maxR <= 20) {
    return {
      A: { x: w / 2, y: pad + 10 },
      B: { x: pad + 10, y: h - pad - 10 },
      C: { x: w - pad - 10, y: h - pad - 10 },
    }
  }

  const radius = randomBetween(maxR * 0.62, maxR * 0.90)
  const margin = radius + pad
  const cx = randomBetween(margin, w - margin)
  const cy = randomBetween(margin, h - margin)

  const MIN_GAP = Math.PI / 4
  const a0 = Math.random() * Math.PI * 2
  const a1 = a0 + MIN_GAP + Math.random() * (Math.PI - MIN_GAP)
  const a2 = a1 + MIN_GAP + Math.random() * (Math.PI - MIN_GAP)

  return {
    A: { x: cx + radius * Math.cos(a0), y: cy + radius * Math.sin(a0) },
    B: { x: cx + radius * Math.cos(a1), y: cy + radius * Math.sin(a1) },
    C: { x: cx + radius * Math.cos(a2), y: cy + radius * Math.sin(a2) },
  }
}

// ── component ──

// Weekly rotation: the same centre for the whole ISO week (advances every
// Monday), so the club can discuss one centre per week instead of a
// random one per page load.
function weekIndex(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.floor((now - start) / (7 * 86400000))
}

export default function TodaysCenter() {
  const [centre] = useState(() => CENTRES[weekIndex() % CENTRES.length])
  const [triangleVersion, setTriangleVersion] = useState(0)
  const [hovered, setHovered] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (!centre) return

    const draw = () => {
      const canvas = document.getElementById('todays-center-canvas')
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      ctx.save()

      const { A, B, C } = randomTriangle(w, h, 35)

      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.lineTo(C.x, C.y)
      ctx.closePath()
      ctx.fillStyle = cssVar('--geom-fill')
      ctx.fill()

      ctx.strokeStyle = cssVar('--geom-stroke')
      ctx.lineWidth = 1.0
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.lineTo(C.x, C.y)
      ctx.closePath()
      ctx.stroke()

      const P = centre.draw(ctx, A, B, C)

      for (const pt of [A, B, C]) {
        drawVertex(ctx, pt)
      }

      drawCentrePoint(ctx, P)

      ctx.restore()
    }

    const frame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(frame)
  }, [centre, triangleVersion, theme])

  const { t } = useTranslation()
  if (!centre) return null

  const name = currentLanguage() === 'zh' ? centre.name : centre.en

  return (
    <section className={styles.todaysCenter}>
      <div className={styles.todaysCenter__labelRow}>
        <span className={styles.todaysCenter__symbol}>
          {centre.symbol}
        </span>
        <span>{name}</span>
      </div>

      <div
        onClick={() => setTriangleVersion(v => v + 1)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${styles.todaysCenter__window} ${hovered ? styles['todaysCenter__window--hovered'] : ''}`}
      >
        <div
          className={`${styles.todaysCenter__canvasWrapper} ${styles.todaysCenter__cloudBg}`}
        >
          <canvas
            id="todays-center-canvas"
            width="240"
            height="180"
            className={styles.todaysCenter__canvas}
          />
        </div>

        <div className={styles.todaysCenter__refreshHint}>
          ↻ {t('today.rotate')}
        </div>
      </div>

      <p className={styles.todaysCenter__desc}>
        {t(centre.descKey)}
      </p>
    </section>
  )
}
