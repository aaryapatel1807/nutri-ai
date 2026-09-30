'use client'
import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Camera, MessageCircle, Dumbbell, Flame, Activity, Zap,
} from 'lucide-react'
import { auth } from '../lib/api'
import Hero from '../components/landing/StoryHero'

/* ═══════════════════════════════════════════════════════════════════
   NutriAI — cinematic 3D storytelling landing.
    Warm paper hero, charcoal chapters, coral and amber accents.
   Reduced-motion: static composed states, no scroll-driven animation.
   ═══════════════════════════════════════════════════════════════════ */

const AMBER = '#FF6B5E'
const AMBER_DEEP = '#FFB020'
const CHARCOAL = '#141210'
const CHARCOAL_2 = '#1A1714'
const CREAM = '#F5EFE4'
const MUTED = '#A8A29E'
const HAIRLINE = 'rgba(255,107,94,0.12)'

const LANDING_CSS = `
.nl-root { background:${CHARCOAL}; color:${CREAM}; font-family:'Satoshi',sans-serif; overflow-x:clip; }
html:has(.nl-root) { scroll-behavior:smooth; }
.nl-root ::selection { background:rgba(255,107,94,.35); color:#141210; }
.nl-root .nl-campaign { font-family:'Clash Display',sans-serif; font-weight:700; text-transform:uppercase; line-height:.92; letter-spacing:-.015em; }
.nl-root .nl-squeeze { display:inline-block; transform:scaleX(.84); transform-origin:left center; }
@media (max-width:768px){ .nl-root .nl-squeeze { transform-origin:center; } }
.nl-root .nl-tnum { font-variant-numeric:tabular-nums; }
.nl-root .nl-kicker { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.14em; }
.nl-root .nl-hairline { border:1px solid ${HAIRLINE}; }
.nl-root .nl-hairline-t { border-top:1px solid ${HAIRLINE}; }
.nl-root :where(a) { color:inherit; }
.nl-root :is(a,button,input):focus-visible { outline:3px solid #FFD166; outline-offset:3px; }
.nl-root [id] { scroll-margin-top:96px; }
.nl-root .nl-cta { background:linear-gradient(135deg,#FF6B5E,#FFB020 52%,#FFD166); color:#141210; font-weight:800; border:none; border-radius:14px; cursor:pointer; transition:transform .15s ease, box-shadow .2s ease; box-shadow:0 0 0 rgba(255,107,94,0); text-decoration:none; }
.nl-root .nl-cta:hover { box-shadow:0 0 32px rgba(255,107,94,.35); }
.nl-root .nl-cta:active { transform:scale(.97); }
.nl-root .nl-cta:disabled { opacity:.6; cursor:wait; }
.nl-root .nl-input { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:13px 16px; color:${CREAM}; font-size:.95rem; outline:none; box-sizing:border-box; transition:border-color .15s ease; }
.nl-root .nl-input::placeholder { color:#B8B0AA; opacity:1; }
.nl-root .nl-input:focus { border-color:rgba(255,107,94,.55); }
.nl-root .nl-input:disabled { opacity:.6; }
.nl-root .nl-label { color:${CREAM}; font-size:.82rem; font-weight:700; margin:2px 2px -5px; }
.nl-root .nl-nav-link { color:${CREAM}; font-size:.84rem; font-weight:700; text-decoration:none; padding:10px 6px; }
.nl-root .nl-glass { background:rgba(30,26,22,.62); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid ${HAIRLINE}; }
@keyframes nl-scan { 0%{top:8%} 50%{top:88%} 100%{top:8%} }
.nl-root .nl-scanline { animation:nl-scan 3.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  html:has(.nl-root) { scroll-behavior:auto !important; }
  .nl-root *, .nl-root *::before, .nl-root *::after { scroll-behavior:auto !important; transition-duration:.01ms !important; animation-duration:.01ms !important; animation-iteration-count:1 !important; }
  .nl-root .nl-scanline { animation:none !important; }
}
@media (max-width:768px) {
  .nl-root .nl-nav-links { display:none !important; }
  .nl-root .nl-chapter { position:relative !important; min-height:auto !important; }
}
@media (max-height:720px) { .nl-root .nl-chapter { position:relative !important; min-height:auto !important; } }
`

/* ── Slim sticky nav ─────────────────────────────────────────────── */
function Nav() {
  return (
    <header style={{
      position: 'fixed', top: 12, left: 16, right: 16, zIndex: 50,
      background: 'rgba(20,18,16,.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      border: `1px solid ${HAIRLINE}`, borderRadius: 16,
    }}>
      <nav aria-label="Primary navigation" style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <a href="#top" aria-label="NutriAI home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 'auto' }}>
          <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>🥗</span>
          <span className="nl-campaign" style={{ fontSize: '1.15rem', letterSpacing: '.02em' }}>NutriAI</span>
        </a>
        <div className="nl-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a className="nl-nav-link" href="#chapters">Features</a>
          <a className="nl-nav-link" href="#stats">Stats</a>
        </div>
        <a href="#auth" className="nl-cta" style={{ padding: '12px 18px', minHeight: 44, display: 'inline-flex', alignItems: 'center', fontSize: '.85rem' }}>
          Sign in
        </a>
      </nav>
    </header>
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
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 300px),1fr))',
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
      className="nl-chapter nl-hairline-t"
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
    if (reduce) {
      setVal(to)
      return
    }
    if (!inView) return
    setVal(0)
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
function AuthChapter({ reduce }) {
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 320px),1fr))', gap: 64, alignItems: 'center' }}>
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
          animate={!reduce && shake ? { x: [0, -12, 12, -9, 9, -5, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="nl-glass"
          style={{ borderRadius: 24, padding: 36, width: '100%', maxWidth: 430, justifySelf: 'center', boxSizing: 'border-box' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <span style={{ fontSize: '1.6rem' }}>🥗</span>
            <div className="nl-campaign" style={{ fontSize: '1.5rem', color: CREAM, marginTop: 6 }}>NutriAI</div>
          </div>

          <div role="group" aria-label="Authentication mode" style={{ display: 'flex', background: 'rgba(255,255,255,.06)', borderRadius: 99, padding: 4, marginBottom: 24 }}>
            <button type="button" aria-pressed={activeTab === 'login'} onClick={() => { setActiveTab('login'); setError('') }} style={tabStyle(activeTab === 'login')}>Login</button>
            <button type="button" aria-pressed={activeTab === 'signup'} onClick={() => { setActiveTab('signup'); setError('') }} style={tabStyle(activeTab === 'signup')}>Sign Up</button>
          </div>

          {error && (
            <div id="auth-error" role="alert" aria-live="assertive" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', color: '#FF9B9B', padding: '12px 14px', borderRadius: 12, marginBottom: 18, fontSize: '.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} aria-describedby={error ? 'auth-error' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="nl-label" htmlFor="login-email">Email</label>
              <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="nl-input" value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required disabled={loading} />
              <label className="nl-label" htmlFor="login-password">Password</label>
              <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" className="nl-input" value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required disabled={loading} />
              <button type="submit" disabled={loading} className="nl-cta" style={{ padding: '14px', fontSize: '1rem', marginTop: 6 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} aria-describedby={error ? 'auth-error' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="nl-label" htmlFor="signup-name">Name</label>
              <input id="signup-name" name="name" type="text" autoComplete="name" placeholder="Your name" className="nl-input" value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} required disabled={loading} />
              <label className="nl-label" htmlFor="signup-email">Email</label>
              <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="nl-input" value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} required disabled={loading} />
              <label className="nl-label" htmlFor="signup-password">Password</label>
              <input id="signup-password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" className="nl-input" value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} required disabled={loading} />
              <label className="nl-label" htmlFor="signup-confirm-password">Confirm password</label>
              <input id="signup-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" className="nl-input" value={signupForm.confirmPassword}
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
      <AuthChapter reduce={reduce} />
      <Footer />
    </div>
  )
}
