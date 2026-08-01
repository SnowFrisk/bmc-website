import { useState, useEffect } from 'react'
import {useTheme} from '../../hooks/useTheme.js'
// ── catalogue of triangle centres ──

const CENTRES = [
  {
    id: 'centroid',
    name: '重心',
    en: 'Centroid',
    symbol: 'G',
    desc: '三條中線的交點，亦係三角形嘅質量中心。',
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
    desc: '三條高線的交點。',
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
    desc: '三條垂直平分線的交點，外接圓嘅圓心。',
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
    desc: '三條角平分線的交點，內切圓嘅圓心。',
    draw: (ctx, A, B, C) => {
      const a = { x: B.x - A.x, y: B.y - A.y }
      const b = { x: C.x - A.x, y: C.y - A.y }
      const la = Math.sqrt(a.x * a.x + a.y * a.y)
      const lb = Math.sqrt(b.x * b.x + b.y * b.y)
      // Extend the bisector well beyond the triangle
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
  // Outer ring
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2)
  ctx.strokeStyle = cssVar('--potc-theme-color')
  ctx.lineWidth = 0.8
  ctx.stroke()
  // Inner fill
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2)
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
  // Max radius such that a vertex at the furthest point still stays within pad of the edge.
  const halfW = w / 2 - pad
  const halfH = h / 2 - pad
  const maxR = Math.min(halfW, halfH)
  if (maxR <= 20) {
    // Tiny canvas — return small centred triangle as fallback
    return {
      A: { x: w / 2, y: pad + 10 },
      B: { x: pad + 10, y: h - pad - 10 },
      C: { x: w - pad - 10, y: h - pad - 10 },
    }
  }

  // Radius: 62–90 % of the maximum safe radius
  const radius = randomBetween(maxR * 0.62, maxR * 0.90)

  // Centre must be at least (radius + pad) from every edge
  const margin = radius + pad
  const cx = randomBetween(margin, w - margin)
  const cy = randomBetween(margin, h - margin)

  // Three angles with ≥ 45° minimum gap so no side degenerates
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

export default function TodaysCenter() {
  const [centre] = useState(() => CENTRES[Math.floor(Math.random() * CENTRES.length)])
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

      // Triangle — subtle fill so it reads against the background
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.lineTo(C.x, C.y)
      ctx.closePath()
      ctx.fillStyle = cssVar('--geom-fill')
      ctx.fill()

      // Triangle outline — rounded joins, theme-aware colour
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

      // Construction lines
      const P = centre.draw(ctx, A, B, C)

      // Vertices
      for (const pt of [A, B, C]) {
        drawVertex(ctx, pt)
      }

      // Centre point
      drawCentrePoint(ctx, P)

      ctx.restore()
    }

    const frame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(frame)
  }, [centre, triangleVersion, theme])

  if (!centre) return null

  return (
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {/* Cloud keyframes — scoped to this component via unique class name */}
      <style>{`
        @keyframes bmc-cloud-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(14px, -8px) scale(1.05); }
          66% { transform: translate(-6px, 10px) scale(0.97); }
        }
        @keyframes bmc-cloud-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-12px, 6px) scale(1.04); }
        }
        .bmc-cloud-bg {
          background:
            radial-gradient(ellipse 40% 35% at 25% 55%, var(--cloud-a) 0%, transparent 70%),
            radial-gradient(ellipse 35% 45% at 70% 40%, var(--cloud-b) 0%, transparent 70%),
            radial-gradient(ellipse 30% 30% at 55% 70%, var(--cloud-c) 0%, transparent 60%);
          animation: bmc-cloud-drift-1 18s ease-in-out infinite;
        }
        .bmc-cloud-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background:
            radial-gradient(ellipse 30% 25% at 60% 30%, var(--cloud-d) 0%, transparent 65%),
            radial-gradient(ellipse 25% 35% at 30% 65%, var(--cloud-e) 0%, transparent 65%);
          animation: bmc-cloud-drift-2 22s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Label row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        marginBottom: '0.6rem',
        fontSize: 13,
        color: 'var(--text-muted)',
      }}>
        <span style={{
          display: 'inline-block',
          width: 20,
          height: 20,
          borderRadius: 4,
          border: '1px solid var(--text-muted)',
          fontSize: 14,
          lineHeight: '18px',
          textAlign: 'center',
          fontWeight: 500,
        }}>
          {centre.symbol}
        </span>
        <span>{centre.name} / {centre.en}</span>
      </div>

      {/* Window frame */}
      <div
        onClick={() => setTriangleVersion(v => v + 1)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          display: 'block',
          borderRadius: 12,
          cursor: 'pointer',
          border: 'none',
          backgroundColor: 'var(--border)',
          boxShadow: hovered
            ? 'inset 0 0 12px rgba(0,0,0,0.3), 0 0 0 1px var(--potc-theme-color)'
            : 'inset 0 0 12px rgba(0,0,0,0.3), 0 0 0 1px transparent',
          transition: 'box-shadow 0.25s',
        }}
      >
        {/* Cloud layer + canvas */}
        <div
          className="bmc-cloud-bg"
          style={{
            position: 'relative',
            borderRadius: 9,
            overflow: 'hidden',
            width: 240,
            height: 180,
          }}
        >
          <canvas
            id="todays-center-canvas"
            width="240"
            height="180"
            style={{
              display: 'block',
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>

        {/* Refresh hint */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 10,
          zIndex: 2,
          fontSize: 11,
          color: 'var(--text-muted)',
          opacity: hovered ? 0.8 : 0,
          transition: 'opacity 0.25s',
          pointerEvents: 'none',
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.15rem 0.4rem',
          borderRadius: 4,
        }}>
          ↻ 換一個
        </div>
      </div>

      <p style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        marginTop: '0.5rem',
        maxWidth: 260,
      }}>
        {centre.desc}
      </p>
    </section>
  )
}
