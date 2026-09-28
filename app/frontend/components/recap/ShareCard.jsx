'use client'
import { useRef } from 'react'

const AMBER = '#F5A524'
const AMBER_DEEP = '#F97316'
const BG_TOP = '#1A1714'
const BG_BOT = '#100E0C'
const PAPER = '#FAF7F2'
const MUTED = '#A8A29E'
const HAIRLINE = 'rgba(245,165,36,0.18)'

const W = 1080
const H = 1350

/** Draw the recap card onto a 2D canvas context — mirrors the on-screen design. */
export function drawRecapCard(ctx, d) {
  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, BG_TOP)
  bg.addColorStop(1, BG_BOT)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Amber glow top
  const glow = ctx.createRadialGradient(W / 2, -120, 40, W / 2, -120, 620)
  glow.addColorStop(0, 'rgba(245,165,36,0.28)')
  glow.addColorStop(1, 'rgba(245,165,36,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 560)

  // Ring motif (open ring, Whoop-style)
  ctx.save()
  ctx.translate(W - 150, 170)
  ctx.lineWidth = 26
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(245,165,36,0.16)'
  ctx.beginPath(); ctx.arc(0, 0, 96, 0, Math.PI * 2); ctx.stroke()
  const frac = Math.min(1, (d.sessions || 0) / 12)
  ctx.strokeStyle = AMBER
  ctx.shadowColor = 'rgba(245,165,36,0.7)'
  ctx.shadowBlur = 24
  ctx.beginPath(); ctx.arc(0, 0, 96, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke()
  ctx.restore()
  ctx.shadowBlur = 0

  const cx = 90
  let y = 120

  // Brand
  ctx.fillStyle = AMBER
  ctx.font = '700 34px Arial'
  ctx.fillText('🥗  NUTRIAI', cx, y)
  y += 66

  // Headline
  ctx.fillStyle = PAPER
  ctx.font = '900 92px Arial'
  const lines = d.headlineLines || ['YOUR WEEK', 'IN TRAINING']
  for (const line of lines) { ctx.fillText(line, cx, y); y += 104 }

  // Date range
  y += 14
  ctx.fillStyle = MUTED
  ctx.font = '400 30px Arial'
  ctx.fillText(d.dateLabel || '', cx, y)
  y += 90

  // Divider
  ctx.strokeStyle = HAIRLINE
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(W - cx, y); ctx.stroke()
  y += 64

  // Stat grid 2×2
  const stats = [
    { label: 'SESSIONS', val: String(d.sessions ?? 0) },
    { label: 'KCAL BURNED', val: (d.kcal ?? 0).toLocaleString('en-GB') },
    { label: 'ACTIVE MINUTES', val: String(d.minutes ?? 0) },
    { label: 'VOLUME LIFTED', val: d.volumeKg > 0 ? `${Math.round(d.volumeKg).toLocaleString('en-GB')} kg` : '—' },
  ]
  const colX = [cx, W / 2 + 20]
  stats.forEach((s, i) => {
    const x = colX[i % 2]
    const yy = y + Math.floor(i / 2) * 190
    ctx.fillStyle = AMBER
    ctx.font = '900 84px Arial'
    ctx.fillText(s.val, x, yy)
    ctx.fillStyle = MUTED
    ctx.font = '600 26px Arial'
    ctx.fillText(s.label, x, yy + 44)
  })
  y += 2 * 190 + 40

  // Streaks
  ctx.fillStyle = PAPER
  ctx.font = '700 40px Arial'
  ctx.fillText(`🔥 ${d.workoutStreak ?? 0}-day training streak`, cx, y)
  y += 62
  ctx.fillText(`🍽️ ${d.mealStreak ?? 0}-day logging streak`, cx, y)
  y += 92

  // Top exercises
  ctx.fillStyle = MUTED
  ctx.font = '600 26px Arial'
  ctx.fillText('TOP EXERCISES', cx, y)
  y += 52
  const tops = (d.topExercises || []).slice(0, 4)
  if (tops.length === 0) {
    ctx.fillStyle = 'rgba(168,162,158,0.6)'
    ctx.font = '400 30px Arial'
    ctx.fillText('Log a workout to fill this in 💪', cx, y)
    y += 60
  } else {
    tops.forEach((t, i) => {
      ctx.fillStyle = i === 0 ? AMBER : PAPER
      ctx.font = '700 36px Arial'
      ctx.fillText(`${i + 1}. ${t.name}`, cx, y)
      ctx.fillStyle = MUTED
      ctx.font = '400 30px Arial'
      const detail = t.volumeKg > 0 ? `${t.count}× · ${Math.round(t.volumeKg).toLocaleString('en-GB')} kg` : `${t.count} sessions`
      ctx.fillText(detail, W - cx - ctx.measureText(detail).width, y)
      y += 58
    })
  }

  // Footer
  y = H - 130
  ctx.strokeStyle = HAIRLINE
  ctx.beginPath(); ctx.moveTo(cx, y - 56); ctx.lineTo(W - cx, y - 56); ctx.stroke()
  ctx.fillStyle = MUTED
  ctx.font = '400 28px Arial'
  ctx.fillText('Track nutrition. Predict health. Get fit with AI.', cx, y)
  ctx.fillStyle = AMBER
  ctx.font = '700 28px Arial'
  ctx.fillText('NUTRIAI', cx, y + 48)
}

export default function ShareCard({ data }) {
  const canvasRef = useRef(null)

  const renderToCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    drawRecapCard(ctx, data)
    return canvas
  }

  const downloadPNG = () => {
    const canvas = renderToCanvas()
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nutriai-recap-${new Date().toISOString().slice(0, 10)}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    }, 'image/png')
  }

  const shareCard = async () => {
    const canvas = renderToCanvas()
    if (!canvas) return
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) return
    const file = new File([blob], 'nutriai-recap.png', { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My NutriAI training recap', text: 'My week in training 💪' })
        return
      } catch (e) { /* user dismissed — fall through to download */ }
    }
    downloadPNG()
  }

  const stats = [
    { label: 'SESSIONS', val: data.sessions ?? 0, color: AMBER },
    { label: 'KCAL BURNED', val: (data.kcal ?? 0).toLocaleString('en-GB'), color: '#FF6B35' },
    { label: 'ACTIVE MIN', val: data.minutes ?? 0, color: '#FB923C' },
    { label: 'VOLUME', val: data.volumeKg > 0 ? `${Math.round(data.volumeKg).toLocaleString('en-GB')} kg` : '—', color: '#FFD700' },
  ]

  return (
    <div>
      {/* On-screen card (1080×1350 design, scaled to fit) */}
      <div style={{
        width: '100%', maxWidth: '480px', margin: '0 auto',
        aspectRatio: '1080 / 1350',
        borderRadius: '24px', overflow: 'hidden',
        background: `linear-gradient(180deg, ${BG_TOP}, ${BG_BOT})`,
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.45), 0 0 60px rgba(245,165,36,0.08)',
        position: 'relative', color: PAPER,
        fontFamily: "'Satoshi', sans-serif"
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(420px circle at 50% -60px, rgba(245,165,36,0.25), transparent 70%)'
        }} />
        <div style={{ position: 'relative', padding: '8%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: AMBER, fontWeight: 700, fontSize: 'clamp(0.7rem, 2.6vw, 1rem)', letterSpacing: '0.06em' }}>🥗 NUTRIAI</div>
          <div style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 900, fontSize: 'clamp(1.6rem, 7vw, 2.6rem)',
            lineHeight: 1.05, marginTop: '4%'
          }}>
            {(data.headlineLines || ['YOUR WEEK', 'IN TRAINING']).map((l) => (<div key={l}>{l}</div>))}
          </div>
          <div style={{ color: MUTED, fontSize: 'clamp(0.65rem, 2.4vw, 0.9rem)', marginTop: '2%' }}>{data.dateLabel}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6%', marginTop: '8%' }}>
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{
                  color: s.color, fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 800, fontSize: 'clamp(1.4rem, 6vw, 2.2rem)',
                  fontVariantNumeric: 'tabular-nums'
                }}>{s.val}</div>
                <div style={{ color: MUTED, fontSize: 'clamp(0.55rem, 2vw, 0.72rem)', fontWeight: 600, letterSpacing: '0.08em', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '8%', fontWeight: 700, fontSize: 'clamp(0.8rem, 3vw, 1.05rem)' }}>
            <div>🔥 {data.workoutStreak ?? 0}-day training streak</div>
            <div style={{ marginTop: '6px' }}>🍽️ {data.mealStreak ?? 0}-day logging streak</div>
          </div>

          <div style={{ marginTop: '8%' }}>
            <div style={{ color: MUTED, fontSize: 'clamp(0.55rem, 2vw, 0.72rem)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '8px' }}>TOP EXERCISES</div>
            {(data.topExercises || []).slice(0, 4).map((t, i) => (
              <div key={t.name} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 'clamp(0.7rem, 2.8vw, 0.95rem)', padding: '4px 0',
                color: i === 0 ? AMBER : PAPER, fontWeight: i === 0 ? 700 : 400
              }}>
                <span>{i + 1}. {t.name}</span>
                <span style={{ color: MUTED, fontVariantNumeric: 'tabular-nums' }}>
                  {t.volumeKg > 0 ? `${t.count}× · ${Math.round(t.volumeKg).toLocaleString('en-GB')} kg` : `${t.count} sessions`}
                </span>
              </div>
            ))}
            {(!data.topExercises || data.topExercises.length === 0) && (
              <div style={{ color: 'rgba(168,162,158,0.6)', fontSize: '0.85rem' }}>Log a workout to fill this in 💪</div>
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: `1px solid ${HAIRLINE}`, paddingTop: '4%' }}>
            <div style={{ color: MUTED, fontSize: 'clamp(0.6rem, 2.2vw, 0.8rem)' }}>Track nutrition. Predict health. Get fit with AI.</div>
            <div style={{ color: AMBER, fontWeight: 700, fontSize: 'clamp(0.6rem, 2.2vw, 0.8rem)', marginTop: '4px' }}>NUTRIAI</div>
          </div>
        </div>
      </div>

      {/* Hidden render canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
        <button onClick={downloadPNG} style={{
          padding: '12px 28px', borderRadius: '14px', border: 'none',
          background: 'linear-gradient(135deg, #F5A524, #F97316)',
          color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem',
          boxShadow: '0 8px 28px rgba(245,165,36,0.35)'
        }}>⬇️ Download PNG</button>
        <button onClick={shareCard} style={{
          padding: '12px 28px', borderRadius: '14px',
          border: '1px solid rgba(245,165,36,0.4)',
          background: 'rgba(245,165,36,0.1)',
          color: '#F5A524', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
        }}>📤 Share</button>
      </div>
    </div>
  )
}
