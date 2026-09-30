'use client'
import { useState, useEffect, useRef } from 'react'
import {
  motion, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion,
} from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Camera, MessageCircle, Dumbbell, Flame, ArrowRight, ChevronDown, Activity, Zap,
} from 'lucide-react'
import { auth } from '../lib/api'

/* ═══════════════════════════════════════════════════════════════════
   NutriAI — cinematic 3D storytelling landing.
   Dark-first. Electric blue rationed (CTAs, rings, key numerals only).
   Reduced-motion: static composed states, no scroll-driven animation.
   ═══════════════════════════════════════════════════════════════════ */

const AMBER = '#FF6B5E'
const AMBER_DEEP = '#FFB020'
const CHARCOAL = '#141210'
const CHARCOAL_2 = '#1A1714'
const PAPER = '#F5F1E8'
const INK = '#1C1917'
const CREAM = '#F5EFE4'
const MUTED = '#A8A29E'
const HAIRLINE = 'rgba(255,107,94,0.12)'

const LANDING_CSS = `
.nl-root { background:${CHARCOAL}; color:${CREAM}; font-family:'Satoshi',sans-serif; overflow-x:clip; }
.nl-root ::selection { background:rgba(255,107,94,.35); color:#141210; }
.nl-campaign { font-family:'Clash Display',sans-serif; font-weight:700; text-transform:uppercase; line-height:.92; letter-spacing:-.015em; }
.nl-squeeze { display:inline-block; transform:scaleX(.84); transform-origin:left center; }
@media (max-width:768px){ .nl-squeeze { transform-origin:center; } }
.nl-tnum { font-variant-numeric:tabular-nums; }
.nl-kicker { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.14em; }
.nl-hairline { border:1px solid ${HAIRLINE}; }
.nl-hairline-t { border-top:1px solid ${HAIRLINE}; }
.nl-cta { background:linear-gradient(135deg,#FF6B5E,#FFB020 52%,#7B61FF); color:#FFFFFF; font-weight:800; border:none; border-radius:14px; cursor:pointer; transition:transform .15s ease, box-shadow .2s ease; box-shadow:0 0 0 rgba(255,107,94,0); white-space:nowrap; }
.nl-cta:hover { box-shadow:0 0 32px rgba(255,107,94,.35); }
.nl-cta:active { transform:scale(.97); }
.nl-cta:disabled { opacity:.6; cursor:wait; }
.nl-input { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:13px 16px; color:${CREAM}; font-size:.95rem; outline:none; box-sizing:border-box; transition:border-color .15s ease; }
.nl-input::placeholder { color:#6B6560; }
.nl-input:focus { border-color:rgba(255,107,94,.55); }
.nl-input:disabled { opacity:.6; }
.nl-glass { background:linear-gradient(160deg, rgba(34,29,24,.94), rgba(24,20,17,.9)); backdrop-filter:blur(14px) saturate(1.25); -webkit-backdrop-filter:blur(14px) saturate(1.25); border:1px solid rgba(255,255,255,.16); box-shadow:inset 0 1px 0 rgba(255,255,255,.09), 0 18px 44px rgba(20,14,10,.38); }
@keyframes nl-scan { 0%{top:8%} 50%{top:88%} 100%{top:8%} }
@keyframes nl-floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes nl-cue { 0%,100%{transform:translateY(0);opacity:.9} 50%{transform:translateY(10px);opacity:.4} }
@keyframes nl-pulse-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
.nl-scanline { animation:nl-scan 3.2s ease-in-out infinite; }
.nl-floaty { animation:nl-floaty 7s ease-in-out infinite; }
.nl-cue { animation:nl-cue 1.8s ease-in-out infinite; }
.nl-pulse-glow { animation:nl-pulse-glow 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .nl-scanline, .nl-floaty, .nl-cue, .nl-pulse-glow { animation:none !important; }
}
@media (max-width:768px) {
  .nl-hero-copy-inner { max-width:none !important; }
  .nl-visual { width:100% !important; top:auto !important; bottom:0 !important; height:64% !important; }
  .nl-hero-ring { right:-30% !important; top:6% !important; opacity:.45; transform:scale(.62); transform-origin:top right; }
  .nl-fcard-a { left:4% !important; right:auto !important; bottom:4% !important; width:205px !important; }
  .nl-fcard-b { right:4% !important; bottom:28% !important; width:195px !important; opacity:.94; }
  .nl-cue-wrap { left:auto !important; right:18px !important; bottom:18px !important; transform:none !important; }
}
`

/* ── Slim sticky nav ─────────────────────────────────────────────── */
function Nav() {
  const goAuth = () => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(20,18,16,.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderBottom: `1px solid ${HAIRLINE}`,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.4rem' }}>🥗</span>
          <span className="nl-campaign" style={{ fontSize: '1.15rem', letterSpacing: '.02em' }}>NutriAI</span>
        </div>
        <button onClick={goAuth} className="nl-cta" style={{ padding: '10px 22px', fontSize: '.85rem' }}>
          Sign in
        </button>
      </div>
    </header>
  )
}

/* ── Scroll-driven 3D ring: one volumetric torus + live day-fuel readout ─ */
function Ring3D({ spin, arc, gradeMV, size = 440 }) {
  const R = 80
  const C = 2 * Math.PI * R
  const dashOffset = useTransform(arc, (a) => C * (1 - Math.min(1, Math.max(0, a))))
  const pct = useTransform(arc, (a) => Math.round(100 * Math.min(1, Math.max(0, a))))
  const fallbackGrade = useMotionValue(0)
  const readoutColor = useTransform(gradeMV || fallbackGrade, [0, 1], [INK, CREAM])
  const ringR = (R / 200) * size
  const k = size / 440 // scale the centre readout with the ring
  return (
    <div style={{ width: size, height: size, perspective: 1100, position: 'relative' }}>
      {/* blue energy glow */}
      <div style={{
        position: 'absolute', inset: '12%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,94,.22) 0%, transparent 65%)',
        filter: 'blur(10px)',
      }} className="nl-pulse-glow" />
      <motion.div style={{ width: '100%', height: '100%', rotate: spin, transformStyle: 'preserve-3d' }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transform: 'rotateX(56deg)', transformStyle: 'preserve-3d',
        }}>
          {[-27, -18, -9, 0, 9, 18, 27].map((z) => {
            const depth = (z + 27) / 54 // 0 = back → 1 = front
            return (
              <svg key={z} viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, transform: `translateZ(${z}px)`, opacity: 0.5 + depth * 0.5 }}>
                <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(170,110,35,.32)" strokeWidth="13" />
                <motion.circle
                  cx="100" cy="100" r={R} fill="none" stroke={AMBER} strokeWidth="13" strokeLinecap="round"
                  strokeDasharray={C}
                  style={{
                    strokeDashoffset: dashOffset, transform: 'rotate(-90deg)', transformOrigin: '100px 100px',
                    filter: 'drop-shadow(0 0 9px rgba(255,107,94,.6))',
                  }}
                />
              </svg>
            )
          })}
          {/* satellite orbiting in the ring plane */}
          <motion.div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, rotate: spin }}>
            <div style={{
              position: 'absolute', left: -8, top: -ringR - 8, width: 16, height: 16, borderRadius: '50%',
              background: AMBER, boxShadow: '0 0 22px rgba(255,107,94,.95)',
            }} />
          </motion.div>
        </div>
      </motion.div>
      {/* day-fuel readout — ties the ring's progress to the nutrition story */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <motion.span className="nl-tnum" style={{ color: readoutColor, fontWeight: 800, fontSize: `${2.4 * k}rem`, lineHeight: 1 }}>{pct}</motion.span>
        <motion.span className="nl-kicker" style={{ color: readoutColor, opacity: .6, marginTop: 6 * k }}>day fuel</motion.span>
      </div>
    </div>
  )
}

/* ── HERO: kinetic headline + scroll-driven ring + grade morph ───── */
function Hero({ reduce }) {
  const wrapRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] })

  // cursor parallax (buttery via springs)
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 55, damping: 18 })
  const sy = useSpring(my, { stiffness: 55, damping: 18 })
  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  // scroll-driven values (always created; only applied when !reduce)
  const grade = useTransform(scrollYProgress, [0.25, 0.75], [0, 1])
  const ringSpin = useTransform(scrollYProgress, [0, 1], [0, 320])
  const ringArc = useTransform(scrollYProgress, [0, 0.92], [0.28, 1])
  const cardAY = useTransform(scrollYProgress, [0, 1], [0, -56])
  const cardBY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const headY = useTransform(scrollYProgress, [0, 1], [0, -90])
  const cardAX = useTransform(sx, (v) => v * 18)
  const cardAYc = useTransform(sy, (v) => v * 14)
  const cardBX = useTransform(sx, (v) => v * -24)
  const cardBYc = useTransform(sy, (v) => v * -18)
  const ringX = useTransform(sx, (v) => v * 26)
  const ringY = useTransform(sy, (v) => v * 20)
  const paperFade = useTransform(grade, [0, 1], [1, 0])

  const goAuth = () => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })

  const staticSpin = useMotionValue(38)
  const staticArc = useMotionValue(0.82)
  const spinMV = reduce ? staticSpin : ringSpin
  const arcMV = reduce ? staticArc : ringArc

  const lines = ['YOUR BODY.', 'YOUR DATA.', 'YOUR AI.']

  return (
    <section ref={wrapRef} onMouseMove={onMove} style={{ position: 'relative', height: reduce ? '100vh' : '185vh', background: PAPER }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

        {/* paper-grade base copy (dark ink) */}
        <HeroCopy
          dark
          style={reduce ? {} : { opacity: paperFade, y: headY }}
          lines={lines} onCta={goAuth} accentLast
        />

        {/* charcoal grade wash */}
        {!reduce && (
          <motion.div style={{ position: 'absolute', inset: 0, background: CHARCOAL, opacity: grade, pointerEvents: 'none' }} />
        )}

        {/* right visual zone — ring + cards stay inside; the left text area is protected */}
        <div className="nl-visual" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '46%', overflow: 'hidden', pointerEvents: 'none' }}>
          <div className="nl-hero-ring" style={{ position: 'absolute', right: '-16%', top: '-6%' }}>
            <motion.div style={reduce ? { opacity: .9 } : { x: ringX, y: ringY, opacity: .95 }}>
              <Ring3D spin={spinMV} arc={arcMV} gradeMV={reduce ? null : grade} size={620} />
            </motion.div>
          </div>

          {/* floating cutout-parallax cards — recomposed along the bottom, clear of the ring */}
          <motion.div
            className="nl-glass nl-floaty nl-fcard-a"
            style={reduce
              ? { position: 'absolute', right: '48%', bottom: '9%', width: 250, borderRadius: 18, padding: 18 }
              : { position: 'absolute', right: '48%', bottom: '9%', width: 250, borderRadius: 18, padding: 18, y: cardAY, x: cardAX }}
          >
            <FloatScanCard />
          </motion.div>
          <motion.div
            className="nl-glass nl-floaty nl-fcard-b"
            style={reduce
              ? { position: 'absolute', right: '6%', bottom: '7%', width: 230, borderRadius: 18, padding: 18, animationDelay: '1.4s' }
              : { position: 'absolute', right: '6%', bottom: '7%', width: 230, borderRadius: 18, padding: 18, y: cardBY, x: cardBX }}
          >
            <FloatWorkoutCard />
          </motion.div>
        </div>

        {/* charcoal-grade copy (cream) */}
        <HeroCopy
          lines={lines} onCta={goAuth} accentLast
          style={reduce ? { opacity: 0, pointerEvents: 'none' } : { opacity: grade, y: headY }}
        />

        {/* scroll cue */}
        <motion.div className="nl-cue-wrap" style={reduce ? { display: 'none' } : {
          position: 'absolute', bottom: 44, left: '50%', x: '-50%', opacity: cueOpacity,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: CREAM, background: 'rgba(20,18,16,.55)', border: `1px solid ${HAIRLINE}`,
          borderRadius: 999, padding: '12px 22px', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 28px rgba(20,14,10,.4)',
        }}>
          <span className="nl-kicker">Scroll</span>
          <ChevronDown size={26} className="nl-cue" color={AMBER_DEEP} />
        </motion.div>
      </div>
    </section>
  )
}

function HeroCopy({ lines, onCta, accentLast, dark, style }) {
  const ink = dark ? INK : CREAM
  const sub = dark ? '#57534E' : MUTED
  return (
    <motion.div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-start', padding: '15vh 6vw 0', pointerEvents: 'none', ...style,
    }}>
      <div className="nl-hero-copy-inner" style={{ pointerEvents: 'auto', maxWidth: 'min(760px, 52vw)' }}>
        {lines.map((l, i) => (
          <div key={l} style={{ overflow: 'hidden' }}>
            <motion.h1
              initial={{ y: '110%' }} animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="nl-campaign"
              style={{
                fontSize: 'clamp(2.75rem, min(9.5vw, 12.5vh), 8.5rem)', margin: 0, whiteSpace: 'nowrap',
                color: accentLast && i === lines.length - 1 ? AMBER_DEEP : ink,
                textShadow: !dark && accentLast && i === lines.length - 1 ? '0 0 44px rgba(255,107,94,.45)' : 'none',
              }}
            >
              <span className="nl-squeeze">{l}</span>
            </motion.h1>
          </div>
        ))}
        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          style={{ color: sub, fontSize: '1.05rem', margin: '26px 0 0', maxWidth: 460, lineHeight: 1.6 }}
        >
          Track nutrition. Predict health. Train with an AI coach that knows your body.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          style={{ marginTop: 30, display: 'flex', gap: 14, flexWrap: 'wrap' }}
        >
          <button onClick={onCta} className="nl-cta" style={{ padding: '16px 34px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            Start tracking free <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

function FloatScanCard() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Camera size={15} color={AMBER} />
        <span className="nl-kicker" style={{ color: '#D6D3D1' }}>AI food scan</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', color: CREAM }}>Masala Dosa</div>
      <div className="nl-tnum" style={{ color: AMBER, fontWeight: 800, fontSize: '1.35rem', margin: '4px 0 10px' }}>540 <span style={{ fontSize: '.75rem', color: '#D6D3D1' }}>kcal</span></div>
      {[['P', 18, 82], ['C', 72, 88], ['F', 21, 46]].map(([k, g, w]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="nl-tnum" style={{ fontSize: '.68rem', color: '#D6D3D1', width: 14 }}>{k}</span>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.08)' }}>
            <div style={{ width: `${w}%`, height: '100%', borderRadius: 99, background: k === 'P' ? AMBER : 'rgba(255,107,94,.45)' }} />
          </div>
          <span className="nl-tnum" style={{ fontSize: '.68rem', color: CREAM }}>{g}g</span>
        </div>
      ))}
      <div style={{ marginTop: 10, fontSize: '.72rem', color: '#4ADE80', fontWeight: 700 }}>✓ Logged to diary</div>
    </div>
  )
}

function FloatWorkoutCard() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Dumbbell size={15} color={AMBER} />
        <span className="nl-kicker" style={{ color: '#D6D3D1' }}>Workout</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', color: CREAM }}>Push Day</div>
      <div className="nl-tnum" style={{ color: CREAM, fontWeight: 800, fontSize: '1.35rem', margin: '4px 0 10px' }}>
        42:18 <span style={{ fontSize: '.75rem', color: '#D6D3D1', fontWeight: 500 }}>· <Flame size={12} color={AMBER} style={{ display: 'inline' }} /> 312 kcal</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
        <div style={{ width: '68%', height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${AMBER},${AMBER_DEEP})`, boxShadow: '0 0 12px rgba(255,107,94,.5)' }} />
      </div>
      <div className="nl-tnum" style={{ marginTop: 8, fontSize: '.72rem', color: '#D6D3D1' }}>7 / 10 sets done</div>
    </div>
  )
}

/* ── Chapter visuals (small, live-feeling, honest) ────────────────── */
function ChatVisual() {
  return (
    <div className="nl-glass" style={{ borderRadius: 20, padding: 22, maxWidth: 380 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MessageCircle size={15} color={AMBER} />
        <span className="nl-kicker" style={{ color: MUTED }}>AI coach</span>
        <span style={{ marginLeft: 'auto', fontSize: '.68rem', color: '#2ECC71', fontWeight: 700 }}>● online</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: '14px 14px 14px 4px', padding: '12px 14px', fontSize: '.85rem', color: CREAM, marginBottom: 10, maxWidth: '88%' }}>
        What should I eat after leg day?
      </div>
      <div style={{ background: 'rgba(255,107,94,.14)', border: '1px solid rgba(255,107,94,.3)', borderRadius: '14px 14px 4px 14px', padding: '12px 14px', fontSize: '.85rem', color: CREAM, marginLeft: '12%', lineHeight: 1.55 }}>
        40g protein within 2 hours. Paneer bhurji + 2 rotis lands ≈38g — want me to log it?
      </div>
    </div>
  )
}

function ScanVisual() {
  return (
    <div className="nl-glass" style={{ borderRadius: 20, padding: 22, maxWidth: 380 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Camera size={15} color={AMBER} />
        <span className="nl-kicker" style={{ color: MUTED }}>Vision scan</span>
      </div>
      <div style={{ position: 'relative', height: 150, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg,#3A2C1E,#221A12 60%,#2E2118)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🍛</div>
        <div className="nl-scanline" style={{ position: 'absolute', left: '6%', right: '6%', height: 2, background: AMBER, boxShadow: '0 0 16px rgba(255,107,94,.9)' }} />
        <div style={{ position: 'absolute', inset: 10, border: '1px solid rgba(255,107,94,.4)', borderRadius: 10, pointerEvents: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {[['Butter Chicken', '410'], ['Naan ×2', '280'], ['Rice', '205']].map(([n, k]) => (
          <div key={n} style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '.68rem', color: MUTED, marginBottom: 4 }}>{n}</div>
            <div className="nl-tnum" style={{ fontSize: '.85rem', fontWeight: 800, color: AMBER }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeatVisual() {
  const cell = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
    const r = x - Math.floor(x)
    return r > 0.72 ? 1 : r > 0.42 ? 0.55 : r > 0.2 ? 0.25 : 0
  }
  return (
    <div className="nl-glass" style={{ borderRadius: 20, padding: 22, maxWidth: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Activity size={15} color={AMBER} />
        <span className="nl-kicker" style={{ color: MUTED }}>12-week training</span>
      </div>
      <div className="nl-tnum" style={{ fontSize: '1.7rem', fontWeight: 800, color: CREAM, marginBottom: 14 }}>
        47 <span style={{ fontSize: '.8rem', color: MUTED, fontWeight: 500 }}>sessions</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 5 }}>
        {Array.from({ length: 84 }, (_, i) => {
          const v = cell(i)
          return (
            <div key={i} style={{
              aspectRatio: 1, borderRadius: 3,
              background: v === 0 ? 'rgba(255,255,255,.06)' : `rgba(255,107,94,${0.25 + v * 0.6})`,
              boxShadow: v === 1 ? '0 0 8px rgba(255,107,94,.5)' : 'none',
            }} />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span className="nl-kicker" style={{ color: MUTED }}>Streak</span>
        <span className="nl-tnum" style={{ fontSize: '.8rem', fontWeight: 800, color: AMBER }}>9 days 🔥</span>
      </div>
    </div>
  )
}

function RingsVisual() {
  const Ring = ({ pct, size = 120, sw = 13, dim }) => {
    const R = (size - sw) / 2, C = 2 * Math.PI * R
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={AMBER} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,107,94,.55))', opacity: dim ? .55 : 1 }} />
      </svg>
    )
  }
  return (
    <div className="nl-glass" style={{ borderRadius: 20, padding: 22, maxWidth: 380, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, textAlign: 'left' }}>
        <Zap size={15} color={AMBER} />
        <span className="nl-kicker" style={{ color: MUTED }}>Today + forecast</span>
      </div>
      <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
        <div style={{ position: 'absolute', inset: 0 }}><Ring pct={0.82} size={150} sw={14} /></div>
        <div style={{ position: 'absolute', inset: 17 }}><Ring pct={0.64} size={116} sw={12} dim /></div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="nl-tnum" style={{ fontSize: '1.6rem', fontWeight: 800, color: CREAM }}>82%</span>
          <span className="nl-kicker" style={{ color: MUTED, fontSize: 9 }}>of goal</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {[['Move', '640/780'], ['Fuel', '1,840'], ['Recovery', '91%']].map(([k, v]) => (
          <div key={k} style={{ flex: 1 }}>
            <div className="nl-tnum" style={{ fontWeight: 800, color: CREAM, fontSize: '.9rem' }}>{v}</div>
            <div className="nl-kicker" style={{ color: MUTED, fontSize: 9 }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'inline-block', background: 'rgba(46,204,113,.12)', border: '1px solid rgba(46,204,113,.35)', color: '#2ECC71', borderRadius: 99, padding: '6px 14px', fontSize: '.75rem', fontWeight: 700 }}>
        ▲ On track for Sunday
      </div>
    </div>
  )
}

/* ── Sticky-stack feature chapters: one idea per chapter ──────────── */
const CHAPTERS = [
  {
    n: '01', kicker: 'AI coach', title: 'ASK. LEARN. ADAPT.',
    copy: 'A 120B-parameter coach that knows your training, your macros, your goals. Ask anything — it answers like a coach, not a chatbot.',
    icon: MessageCircle, Visual: ChatVisual, bg: CHARCOAL,
  },
  {
    n: '02', kicker: 'Food scan', title: 'SCAN. KNOW. LOG.',
    copy: 'Point your camera at your plate. Vision AI reads every item and logs calories plus macros in seconds. No typing. No guessing.',
    icon: Camera, Visual: ScanVisual, bg: CHARCOAL_2,
  },
  {
    n: '03', kicker: 'Workout intelligence', title: 'TRAIN. TRACK. PROGRESS.',
    copy: 'Structured plans, live timers and a 12-week training heatmap. Streaks you can see, progress you can feel. Your effort, visualised.',
    icon: Dumbbell, Visual: HeatVisual, bg: CHARCOAL,
  },
  {
    n: '04', kicker: 'Rings + forecast', title: 'CLOSE. PREDICT. WIN.',
    copy: 'Daily rings for move, fuel and recovery. AI forecasts your trajectory — know where you land before you arrive.',
    icon: Flame, Visual: RingsVisual, bg: CHARCOAL_2,
  },
]

function Chapter({ c, reduce }) {
  const Icon = c.icon
  const content = (
    <div style={{
      maxWidth: 1200, margin: '0 auto', padding: '0 6vw', width: '100%',
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
      gap: 56, alignItems: 'center',
    }}>
      <div>
        <div className="nl-campaign nl-tnum" style={{ fontSize: 'clamp(3.6rem,8vw,6.5rem)', color: AMBER, lineHeight: 1, marginBottom: 18 }}>
          {c.n}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Icon size={16} color={AMBER} />
          <span className="nl-kicker" style={{ color: MUTED }}>{c.kicker}</span>
        </div>
        <h2 className="nl-campaign" style={{ fontSize: 'clamp(2.2rem,5.5vw,4.2rem)', margin: '0 0 20px', color: CREAM }}>
          <span className="nl-squeeze">{c.title}</span>
        </h2>
        <p style={{ color: MUTED, fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 440, margin: 0 }}>{c.copy}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <c.Visual />
      </div>
    </div>
  )
  return (
    <section
      className="nl-hairline-t"
      style={{
        position: reduce ? 'relative' : 'sticky', top: 0, minHeight: '100vh',
        background: c.bg, display: 'flex', alignItems: 'center', padding: '110px 0 70px',
      }}
    >
      {reduce ? content : (
        <motion.div
          initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12% 0px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%' }}
        >
          {content}
        </motion.div>
      )}
    </section>
  )
}

function ChapterDeck({ reduce }) {
  return (
    <div id="chapters">
      {CHAPTERS.map((c) => <Chapter key={c.n} c={c} reduce={reduce} />)}
    </div>
  )
}

/* ── Stats band: display-scale tabular numerals, capability stats ─── */
function CountUp({ to, reduce }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.4 })
  const [val, setVal] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) return
    let raf
    const start = performance.now(), dur = 1300
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur)
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, reduce])
  return <span ref={ref} className="nl-tnum">{val.toLocaleString('en-GB')}</span>
}

function StatsBand({ reduce }) {
  const stats = [
    { v: 120, suffix: 'B', label: 'parameter AI coach brain' },
    { v: 5, suffix: '', label: 'daily trackers — meals, workouts, water, weight, XP' },
    { v: 24, suffix: '/7', label: 'coach availability. It never sleeps' },
    { v: 100, suffix: '%', label: 'free. No card. No catch' },
  ]
  return (
    <section id="stats" className="nl-hairline-t" style={{ background: '#100E0C', padding: '110px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw' }}>
        <p className="nl-kicker" style={{ color: MUTED, marginBottom: 54, textAlign: 'center' }}>Built for the obsessed</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 40 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="nl-campaign" style={{ fontSize: 'clamp(3rem,6.5vw,5rem)', color: AMBER, lineHeight: 1 }}>
                <CountUp to={s.v} reduce={reduce} />{s.suffix}
              </div>
              <div style={{ color: MUTED, fontSize: '.85rem', marginTop: 14, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA: the story ends at the product — working auth card ── */
function AuthChapter() {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })

  // Already signed in? Skip straight to the product.
  // Also restores an auth error across the api 401-interceptor reload.
  useEffect(() => {
    try {
      if (localStorage.getItem('nutriai_token')) { window.location.href = '/dashboard'; return }
      const pending = sessionStorage.getItem('nutriai_auth_error')
      if (pending) {
        sessionStorage.removeItem('nutriai_auth_error')
        setError(pending)
        setShake(true)
        setTimeout(() => setShake(false), 600)
        setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'auto', block: 'center' }), 60)
      }
    } catch { /* private mode */ }
  }, [])

  const fail = (msg) => {
    try { sessionStorage.setItem('nutriai_auth_error', msg) } catch { /* private mode */ }
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await auth.login({ email: loginForm.email, password: loginForm.password })
      localStorage.setItem('nutriai_token', data.token)
      localStorage.setItem('nutriai_user', JSON.stringify(data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      fail(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e?.preventDefault()
    setLoading(true); setError('')
    if (signupForm.password !== signupForm.confirmPassword) {
      setLoading(false)
      fail('Passwords do not match')
      return
    }
    try {
      const { data } = await auth.register({ name: signupForm.name, email: signupForm.email, password: signupForm.password })
      localStorage.setItem('nutriai_token', data.token)
      localStorage.setItem('nutriai_user', JSON.stringify(data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      fail(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '11px 0', fontWeight: 700, fontSize: '.9rem', border: 'none',
    borderRadius: 99, cursor: 'pointer', transition: 'all .2s ease',
    background: active ? `linear-gradient(135deg,${AMBER},${AMBER_DEEP})` : 'transparent',
    color: active ? '#141210' : MUTED,
  })

  return (
    <section id="auth" className="nl-hairline-t" style={{
      position: 'relative', padding: '130px 0', overflow: 'hidden',
      background: `radial-gradient(700px 420px at 50% 0%, rgba(255,107,94,.12), transparent 65%), ${CHARCOAL_2}`,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 64, alignItems: 'center' }}>
        <div>
          <h2 className="nl-campaign" style={{ fontSize: 'clamp(2.6rem,6vw,5rem)', margin: '0 0 8px', color: CREAM }}>
            <span className="nl-squeeze">STOP SCROLLING.</span>
          </h2>
          <h2 className="nl-campaign" style={{ fontSize: 'clamp(2.6rem,6vw,5rem)', margin: 0, color: AMBER, textShadow: '0 0 44px rgba(255,107,94,.4)' }}>
            <span className="nl-squeeze">START TRAINING.</span>
          </h2>
          <p style={{ color: MUTED, fontSize: '1.05rem', lineHeight: 1.65, marginTop: 22, maxWidth: 420 }}>
            Your coach is waiting. Log your first meal in under a minute — free, no card, no catch.
          </p>
        </div>

        <motion.div
          animate={shake ? { x: [0, -12, 12, -9, 9, -5, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="nl-glass"
          style={{ borderRadius: 24, padding: 36, width: '100%', maxWidth: 430, justifySelf: 'center' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <span style={{ fontSize: '1.6rem' }}>🥗</span>
            <div className="nl-campaign" style={{ fontSize: '1.5rem', color: CREAM, marginTop: 6 }}>NutriAI</div>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,.06)', borderRadius: 99, padding: 4, marginBottom: 24 }}>
            <button onClick={() => { setActiveTab('login'); setError('') }} style={tabStyle(activeTab === 'login')}>Login</button>
            <button onClick={() => { setActiveTab('signup'); setError('') }} style={tabStyle(activeTab === 'signup')}>Sign Up</button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', color: '#F87171', padding: '12px 14px', borderRadius: 12, marginBottom: 18, fontSize: '.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="email" placeholder="Email" className="nl-input" value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required disabled={loading} />
              <input type="password" placeholder="Password" className="nl-input" value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required disabled={loading} />
              <button type="submit" disabled={loading} className="nl-cta" style={{ padding: '14px', fontSize: '1rem', marginTop: 6 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder="Name" className="nl-input" value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} required disabled={loading} />
              <input type="email" placeholder="Email" className="nl-input" value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} required disabled={loading} />
              <input type="password" placeholder="Password" className="nl-input" value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} required disabled={loading} />
              <input type="password" placeholder="Confirm password" className="nl-input" value={signupForm.confirmPassword}
                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })} required disabled={loading} />
              <button type="submit" disabled={loading} className="nl-cta" style={{ padding: '14px', fontSize: '1rem', marginTop: 6 }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', color: MUTED, fontSize: '.75rem', margin: '22px 0 0' }}>
            No credit card required · Free forever
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Minimal footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="nl-hairline-t" style={{ background: '#100E0C', padding: '34px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>🥗</span>
          <span className="nl-campaign" style={{ fontSize: '1rem', color: CREAM }}>NutriAI</span>
        </div>
        <div className="nl-kicker" style={{ color: MUTED }}>Train. Log. Know.</div>
        <div className="nl-tnum" style={{ color: MUTED, fontSize: '.8rem' }}>© 2026 NutriAI</div>
      </div>
    </footer>
  )
}

/* ── Page composition ───────────────────────────────────────────── */
export default function LandingPage() {
  const reduce = useReducedMotion() ?? false
  return (
    <div className="nl-root" id="top">
      <style>{LANDING_CSS}</style>
      <Nav />
      <Hero reduce={reduce} />
      <ChapterDeck reduce={reduce} />
      <StatsBand reduce={reduce} />
      <AuthChapter />
      <Footer />
    </div>
  )
}
