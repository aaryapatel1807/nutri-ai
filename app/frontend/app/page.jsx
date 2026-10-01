'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Camera, Dumbbell, Flame, Eye, EyeOff, Mail, Lock, User, Sun, Moon,
} from 'lucide-react'
import { auth } from '../lib/api'
import { useTheme } from '../components/shared/ThemeContext'

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
/* ── Auth section theme variables: dark default; light via prefers-color-scheme or [data-theme] ── */
.nl-auth {
  --auth-section-bg:#0C0B09 url('/images/bg-nebula.jpg') center / cover no-repeat;
  --auth-overlay:radial-gradient(ellipse 95% 95% at 50% 50%, transparent 52%, rgba(4,3,2,.6) 100%);
  --auth-card-bg:rgba(20,15,15,0.6);
  --auth-card-filter:blur(20px) saturate(1.25);
  --auth-card-border:1px solid rgba(255,160,110,0.35);
  --auth-card-shadow:0 0 90px rgba(255,120,60,.14), 0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08);
  --auth-inner-border:1px solid rgba(255,160,110,.16);
  --auth-badge-bg:rgba(255,255,255,.06);
  --auth-badge-border:1px solid rgba(255,180,120,.45);
  --auth-badge-shadow:0 0 24px rgba(255,140,80,.25), inset 0 1px 0 rgba(255,255,255,.12);
  --auth-heading:#FFFFFF;
  --auth-sub:#A8A29E;
  --auth-input-bg:rgba(255,255,255,.06);
  --auth-input-border:1px solid rgba(255,255,255,.12);
  --auth-input-shadow:none;
  --auth-input-color:#FFF7ED;
  --auth-input-icon:#8A847E;
  --auth-input-placeholder:#6B6560;
  --auth-input-focus-border:rgba(255,107,94,.55);
  --auth-input-focus-ring:0 0 0 4px rgba(255,107,94,.15);
  --auth-input-focus-bg:rgba(255,255,255,.09);
  --auth-btn-shadow:0 8px 28px rgba(255,95,109,.35), inset 0 1px 0 rgba(255,255,255,.25);
  --auth-link:#FF7A45;
  --auth-error-bg:rgba(239,68,68,.1);
  --auth-error-border:1px solid rgba(239,68,68,.35);
  --auth-error-color:#F87171;
  --auth-show-bg:rgba(18,14,14,.85);
  --auth-show-filter:blur(8px);
  --auth-show-border:1px solid rgba(255,160,110,.20);
  --auth-show-shadow:0 24px 50px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06);
  --auth-ink:#FFFFFF;
  --auth-kicker:#D9A08A;
  --auth-kcal:#FF8A3C;
  --auth-macro-label:#A8A29E;
  --auth-track:rgba(255,255,255,.12);
  --auth-logged:#4ADE80;
  --auth-sets:#A8A29E;
  --auth-flame:#FF8A3C;
  --auth-quote:#D8D2CA;
  --auth-cite:#8A847E;
}
@media (prefers-color-scheme: light) {
  .nl-auth {
    --auth-section-bg:#F7F2E9 url('/images/bg-light.jpg') center / cover no-repeat;
    --auth-overlay:radial-gradient(ellipse 75% 65% at 50% 45%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 70%);
    --auth-card-bg:rgba(255,255,255,0.65);
    --auth-card-filter:blur(20px) saturate(1.2);
    --auth-card-border:1px solid rgba(255,140,90,0.45);
    --auth-card-shadow:0 20px 60px rgba(200,110,80,0.18), inset 0 1px 0 rgba(255,255,255,.7);
    --auth-inner-border:1px solid rgba(255,140,90,0.30);
    --auth-badge-bg:#FFFFFF;
    --auth-badge-border:1px solid rgba(255,140,90,.4);
    --auth-badge-shadow:0 6px 16px rgba(200,110,80,.15);
    --auth-heading:#1F1A1A;
    --auth-sub:#5A4E4A;
    --auth-input-bg:#FFFFFF;
    --auth-input-border:1.5px solid rgba(120,80,60,0.25);
    --auth-input-shadow:0 2px 6px rgba(120,80,60,0.08);
    --auth-input-color:#1F1A1A;
    --auth-input-icon:#8A7C77;
    --auth-input-placeholder:#8A7C77;
    --auth-input-focus-border:#FF7A45;
    --auth-input-focus-ring:0 0 0 4px rgba(255,122,69,0.18);
    --auth-input-focus-bg:#FFFFFF;
    --auth-btn-shadow:0 8px 24px rgba(255,110,90,0.35), inset 0 1px 0 rgba(255,255,255,.25);
    --auth-link:#D14D1A;
    --auth-error-bg:rgba(239,68,68,.07);
    --auth-error-border:1px solid rgba(239,68,68,.3);
    --auth-error-color:#DC2626;
    --auth-show-bg:rgba(255,255,255,0.78);
    --auth-show-filter:blur(14px) saturate(1.2);
    --auth-show-border:1px solid rgba(255,140,90,0.35);
    --auth-show-shadow:0 20px 60px rgba(200,110,80,0.18), inset 0 1px 0 rgba(255,255,255,.7);
    --auth-ink:#1F1A1A;
    --auth-kicker:#F26B2E;
    --auth-kcal:#D9531F;
    --auth-macro-label:#6B5F5A;
    --auth-track:rgba(0,0,0,0.08);
    --auth-logged:#1E9E5A;
    --auth-sets:#6B5F5A;
    --auth-flame:#F26B2E;
    --auth-quote:#3A302D;
    --auth-cite:#8A7C77;
  }
}
html[data-theme="light"] .nl-auth {
  --auth-section-bg:#F7F2E9 url('/images/bg-light.jpg') center / cover no-repeat;
  --auth-overlay:radial-gradient(ellipse 75% 65% at 50% 45%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 70%);
  --auth-card-bg:rgba(255,255,255,0.65);
  --auth-card-filter:blur(20px) saturate(1.2);
  --auth-card-border:1px solid rgba(255,140,90,0.45);
  --auth-card-shadow:0 20px 60px rgba(200,110,80,0.18), inset 0 1px 0 rgba(255,255,255,.7);
  --auth-inner-border:1px solid rgba(255,140,90,0.30);
  --auth-badge-bg:#FFFFFF;
  --auth-badge-border:1px solid rgba(255,140,90,.4);
  --auth-badge-shadow:0 6px 16px rgba(200,110,80,.15);
  --auth-heading:#1F1A1A;
  --auth-sub:#5A4E4A;
  --auth-input-bg:#FFFFFF;
  --auth-input-border:1.5px solid rgba(120,80,60,0.25);
  --auth-input-shadow:0 2px 6px rgba(120,80,60,0.08);
  --auth-input-color:#1F1A1A;
  --auth-input-icon:#8A7C77;
  --auth-input-placeholder:#8A7C77;
  --auth-input-focus-border:#FF7A45;
  --auth-input-focus-ring:0 0 0 4px rgba(255,122,69,0.18);
  --auth-input-focus-bg:#FFFFFF;
  --auth-btn-shadow:0 8px 24px rgba(255,110,90,0.35), inset 0 1px 0 rgba(255,255,255,.25);
  --auth-link:#D14D1A;
  --auth-error-bg:rgba(239,68,68,.07);
  --auth-error-border:1px solid rgba(239,68,68,.3);
  --auth-error-color:#DC2626;
  --auth-show-bg:rgba(255,255,255,0.78);
  --auth-show-filter:blur(14px) saturate(1.2);
  --auth-show-border:1px solid rgba(255,140,90,0.35);
  --auth-show-shadow:0 20px 60px rgba(200,110,80,0.18), inset 0 1px 0 rgba(255,255,255,.7);
  --auth-ink:#1F1A1A;
  --auth-kicker:#F26B2E;
  --auth-kcal:#D9531F;
  --auth-macro-label:#6B5F5A;
  --auth-track:rgba(0,0,0,0.08);
  --auth-logged:#1E9E5A;
  --auth-sets:#6B5F5A;
  --auth-flame:#F26B2E;
  --auth-quote:#3A302D;
  --auth-cite:#8A7C77;
}
html[data-theme="dark"] .nl-auth {
  --auth-section-bg:#0C0B09 url('/images/bg-nebula.jpg') center / cover no-repeat;
  --auth-overlay:radial-gradient(ellipse 95% 95% at 50% 50%, transparent 52%, rgba(4,3,2,.6) 100%);
  --auth-card-bg:rgba(20,15,15,0.6);
  --auth-card-filter:blur(20px) saturate(1.25);
  --auth-card-border:1px solid rgba(255,160,110,0.35);
  --auth-card-shadow:0 0 90px rgba(255,120,60,.14), 0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08);
  --auth-inner-border:1px solid rgba(255,160,110,.16);
  --auth-badge-bg:rgba(255,255,255,.06);
  --auth-badge-border:1px solid rgba(255,180,120,.45);
  --auth-badge-shadow:0 0 24px rgba(255,140,80,.25), inset 0 1px 0 rgba(255,255,255,.12);
  --auth-heading:#FFFFFF;
  --auth-sub:#A8A29E;
  --auth-input-bg:rgba(255,255,255,.06);
  --auth-input-border:1px solid rgba(255,255,255,.12);
  --auth-input-shadow:none;
  --auth-input-color:#FFF7ED;
  --auth-input-icon:#8A847E;
  --auth-input-placeholder:#6B6560;
  --auth-input-focus-border:rgba(255,107,94,.55);
  --auth-input-focus-ring:0 0 0 4px rgba(255,107,94,.15);
  --auth-input-focus-bg:rgba(255,255,255,.09);
  --auth-btn-shadow:0 8px 28px rgba(255,95,109,.35), inset 0 1px 0 rgba(255,255,255,.25);
  --auth-link:#FF7A45;
  --auth-error-bg:rgba(239,68,68,.1);
  --auth-error-border:1px solid rgba(239,68,68,.35);
  --auth-error-color:#F87171;
  --auth-show-bg:rgba(18,14,14,.85);
  --auth-show-filter:blur(8px);
  --auth-show-border:1px solid rgba(255,160,110,.20);
  --auth-show-shadow:0 24px 50px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06);
  --auth-ink:#FFFFFF;
  --auth-kicker:#D9A08A;
  --auth-kcal:#FF8A3C;
  --auth-macro-label:#A8A29E;
  --auth-track:rgba(255,255,255,.12);
  --auth-logged:#4ADE80;
  --auth-sets:#A8A29E;
  --auth-flame:#FF8A3C;
  --auth-quote:#D8D2CA;
  --auth-cite:#8A847E;
}
.nl-authinput {
  width:100%; height:56px; padding:0 16px 0 50px; border-radius:14px;
  border:var(--auth-input-border); background:var(--auth-input-bg); box-shadow:var(--auth-input-shadow);
  color:var(--auth-input-color); font-size:.95rem; outline:none; box-sizing:border-box;
  transition:border-color .15s ease, background .15s ease, box-shadow .15s ease;
}
.nl-authinput::placeholder { color:var(--auth-input-placeholder); }
.nl-authinput:focus {
  border-color:var(--auth-input-focus-border);
  box-shadow:var(--auth-input-focus-ring), var(--auth-input-shadow);
  background:var(--auth-input-focus-bg);
}
.nl-authinput-pw { padding-right:50px; }
.nl-authicon { position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--auth-input-icon); pointer-events:none; display:flex; }
.nl-autheye { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--auth-input-icon); display:flex; padding:6px; }
.nl-authtitle { white-space:nowrap; }
.nl-authsub { white-space:nowrap; }
@keyframes nl-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
.nl-cursorblink { display:inline-block; width:2px; height:1.05em; background:#FF8A3C; margin-left:7px; vertical-align:-0.16em; animation:nl-blink 1.1s steps(2,jump-none) infinite; }
@media (max-width:960px) {
  .nl-auth-grid { flex-direction:column !important; gap:44px !important; align-items:center !important; }
  .nl-auth-left { width:100% !important; max-width:560px !important; }
  .nl-auth-right { width:100% !important; max-width:420px !important; align-self:center !important; }
  .nl-auth-deco { display:none !important; }
}
@media (max-width:640px) {
  .nl-authtitle { white-space:normal !important; font-size:1.4rem !important; }
  .nl-authsub { white-space:normal !important; }
}
@media (max-width:768px) {
  .nl-hero-copy-inner { max-width:none !important; }
  .nl-visual { width:100% !important; top:auto !important; bottom:0 !important; height:64% !important; }
  .nl-fcard-a { left:4% !important; right:auto !important; top:24% !important; bottom:auto !important; width:168px !important; padding:14px !important; }
  .nl-fcard-b { right:4% !important; bottom:2% !important; top:auto !important; width:165px !important; opacity:.94; }
  .nl-cue-wrap { left:18px !important; right:auto !important; bottom:18px !important; transform:none !important; }
}
`

/* ── Slim nav ─────────────────────────────────────────────── */
function useTypewriter(text, speed = 42) {
  const [out, setOut] = useState('')
  useEffect(() => {
    setOut('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text])
  return out
}

const AUTH_QUOTES = {
  login: { text: 'Welcome back. Your streak missed you.', author: 'NutriAI' },
  signup: { text: 'Small logs, logged daily, beat perfect plans.', author: 'NutriAI' },
}

const SHOWCARD = {
  background: 'var(--auth-show-bg)',
  backdropFilter: 'var(--auth-show-filter)', WebkitBackdropFilter: 'var(--auth-show-filter)',
  border: 'var(--auth-show-border)',
  borderRadius: 24,
  boxShadow: 'var(--auth-show-shadow)',
  padding: '28px 30px',
  width: '100%', boxSizing: 'border-box',
}

function AuthScanCard() {
  return (
    <div style={SHOWCARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <Camera size={16} color="var(--auth-kicker)" />
        <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.2em', color: 'var(--auth-kicker)' }}>AI FOOD SCAN</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--auth-ink)' }}>Masala Dosa</div>
      <div className="nl-tnum" style={{ color: 'var(--auth-kcal)', fontWeight: 800, fontSize: '1.6rem', margin: '4px 0 16px', whiteSpace: 'nowrap' }}>
        540 kcal
      </div>
      {[['P', '18g', 50], ['C', '72g', 45], ['F', '21g', 47]].map(([k, g, w]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: '.85rem', color: 'var(--auth-macro-label)', width: 12 }}>{k}</span>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--auth-track)' }}>
            <div style={{ width: `${w}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#FF8A3C,#FF3D5E)' }} />
          </div>
          <span className="nl-tnum" style={{ fontSize: '.85rem', color: 'var(--auth-ink)', fontWeight: 600 }}>{g}</span>
        </div>
      ))}
      <div style={{ marginTop: 14, fontSize: '.85rem', color: 'var(--auth-logged)', fontWeight: 600 }}>✓ Logged to diary</div>
    </div>
  )
}

function AuthWorkoutCard() {
  return (
    <div style={SHOWCARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <Dumbbell size={16} color="var(--auth-kicker)" />
        <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.2em', color: 'var(--auth-kicker)' }}>WORKOUT</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--auth-ink)' }}>Push Day</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 16px' }}>
        <span className="nl-tnum" style={{ color: 'var(--auth-ink)', fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-.01em' }}>42:18</span>
        <span className="nl-tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.9rem', color: 'var(--auth-sets)' }}>
          <Flame size={14} color="var(--auth-flame)" /> 312 kcal
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--auth-track)', overflow: 'hidden' }}>
        <div style={{ width: '70%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#FDB03C,#FF5F6D 55%,#8A63D2)' }} />
      </div>
      <div className="nl-tnum" style={{ marginTop: 10, fontSize: '.85rem', color: 'var(--auth-sets)' }}>7 / 10 sets done</div>
    </div>
  )
}

function AuthShowcase({ quote, author }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 24, width: '100%' }}>
      <AuthScanCard />
      <AuthWorkoutCard />
      <blockquote style={{ margin: '8px 0 0', width: '100%' }}>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 400, color: 'var(--auth-quote)', lineHeight: 1.6 }}>
          &ldquo;{quote}&rdquo;<span className="nl-cursorblink" />
        </p>
        <cite style={{ display: 'block', marginTop: 10, fontSize: '.85rem', color: 'var(--auth-cite)', fontStyle: 'normal', textAlign: 'right' }}>
          — {author}
        </cite>
      </blockquote>
    </div>
  )
}

function AuthInput({ icon: Icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <span className="nl-authicon"><Icon size={18} /></span>
      <input {...props} className="nl-authinput" />
    </div>
  )
}

function AuthPasswordInput({ show, onToggleShow, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <span className="nl-authicon"><Lock size={18} /></span>
      <input {...props} type={show ? 'text' : 'password'} className="nl-authinput nl-authinput-pw" />
      <button type="button" onClick={onToggleShow} aria-label={show ? 'Hide password' : 'Show password'} className="nl-autheye">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function AuthChapter() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })

  const quote = useTypewriter(AUTH_QUOTES[isSignIn ? 'login' : 'signup'].text)

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

  const persist = (data) => {
    // Register may return a tokenless generic message (email-enumeration
    // guard) — show it instead of signing in.
    if (!data.token) {
      fail(data.message || 'Please sign in with your new account.')
      return
    }
    localStorage.setItem('nutriai_token', data.token)
    if (data.refreshToken) localStorage.setItem('nutriai_refresh', data.refreshToken)
    localStorage.setItem('nutriai_user', JSON.stringify(data.user))
    window.location.href = '/dashboard'
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await auth.login({ email: loginForm.email, password: loginForm.password })
      persist(data)
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
      persist(data)
    } catch (err) {
      fail(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = (signIn) => {
    setIsSignIn(signIn); setError(''); setShowPw(false); setShowPw2(false)
  }

  return (
    <section id="auth" className="nl-auth" style={{
      position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 0', overflow: 'hidden', boxSizing: 'border-box',
      background: 'var(--auth-section-bg)',
      transition: 'background .3s ease',
    }}>
      <ThemeToggle />
      {/* ambient wash across the whole section */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'var(--auth-overlay)',
      }} />
      <div className="nl-auth-grid" style={{ position: 'relative', margin: '0 auto', padding: '0 4vw', maxWidth: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6vw' }}>

        {/* frosted form card with ambient blobs */}
        <div className="nl-auth-left" style={{ position: 'relative', width: 'min(37vw, 580px)', flexShrink: 0 }}>
          <motion.div
            animate={shake ? { x: [0, -12, 12, -9, 9, -5, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              position: 'relative', borderRadius: 28, padding: '32px 44px', width: '100%', boxSizing: 'border-box',
              background: 'var(--auth-card-bg)',
              backdropFilter: 'var(--auth-card-filter)', WebkitBackdropFilter: 'var(--auth-card-filter)',
              border: 'var(--auth-card-border)',
              boxShadow: 'var(--auth-card-shadow)',
              overflow: 'hidden',
            }}
          >
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 14, borderRadius: 18, pointerEvents: 'none',
              border: 'var(--auth-inner-border)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
                background: 'var(--auth-badge-bg)', border: 'var(--auth-badge-border)', boxShadow: 'var(--auth-badge-shadow)',
              }}>🥗</div>
              <h2 className="nl-authtitle" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--auth-heading)', letterSpacing: '-.01em' }}>
                {isSignIn ? 'Sign in to your account' : 'Create your account'}
              </h2>
              <p className="nl-authsub" style={{ margin: 0, fontSize: '.95rem', color: 'var(--auth-sub)' }}>
                {isSignIn ? 'Welcome back — your coach kept your seat warm.' : 'Free forever. No credit card, no catch.'}
              </p>
            </div>

            {error && (
              <div style={{
                background: 'var(--auth-error-bg)',
                border: 'var(--auth-error-border)',
                color: 'var(--auth-error-color)', padding: '12px 14px', borderRadius: 12, marginBottom: 18, fontSize: '.875rem', textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            {isSignIn ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AuthInput icon={Mail} type="email" placeholder="Email" autoComplete="email" required disabled={loading}
                  value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                <AuthPasswordInput show={showPw} onToggleShow={() => setShowPw((s) => !s)} placeholder="Password"
                  autoComplete="current-password" required disabled={loading}
                  value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                <button type="submit" disabled={loading} className="nl-cta" style={{ height: 58, width: '100%', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(90deg,#FDB03C,#FF5F6D 55%,#8A63D2)', boxShadow: 'var(--auth-btn-shadow)' }}>
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AuthInput icon={User} type="text" placeholder="Full name" autoComplete="name" required disabled={loading}
                  value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
                <AuthInput icon={Mail} type="email" placeholder="Email" autoComplete="email" required disabled={loading}
                  value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                <AuthPasswordInput show={showPw} onToggleShow={() => setShowPw((s) => !s)} placeholder="Password"
                  autoComplete="new-password" required disabled={loading}
                  value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                <AuthPasswordInput show={showPw2} onToggleShow={() => setShowPw2((s) => !s)} placeholder="Confirm password"
                  autoComplete="new-password" required disabled={loading}
                  value={signupForm.confirmPassword} onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })} />
                <button type="submit" disabled={loading} className="nl-cta" style={{ height: 58, width: '100%', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(90deg,#FDB03C,#FF5F6D 55%,#8A63D2)', boxShadow: 'var(--auth-btn-shadow)' }}>
                  {loading ? 'Creating account…' : 'Sign Up →'}
                </button>
              </form>
            )}

            <p style={{ textAlign: 'center', color: 'var(--auth-sub)', fontSize: '.9rem', margin: '18px 0 0', whiteSpace: 'nowrap' }}>
              {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={() => toggleMode(!isSignIn)} style={{
                background: 'none', border: 'none', color: 'var(--auth-link)', fontWeight: 700, cursor: 'pointer',
                fontSize: '.9rem', textDecoration: 'underline', textUnderlineOffset: 4,
              }}>
                {isSignIn ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </div>

        {/* showcase cards + typewriter quote */}
        <div className="nl-auth-deco nl-auth-right" style={{
          position: 'relative', width: 'min(26vw, 400px)', flexShrink: 0, alignSelf: 'flex-start',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <AuthShowcase quote={quote} author={AUTH_QUOTES[isSignIn ? 'login' : 'signup'].author} />
        </div>
      </div>
    </section>
  )
}


/* ── Minimal footer ─────────────────────────────────────────────── */
/* ── Theme toggle: small fixed button, top-right ───────────────────────── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      style={{
        position: 'fixed', top: 20, right: 20, zIndex: 50,
        width: 42, height: 42, borderRadius: '50%', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--auth-card-bg)',
        border: '1px solid var(--auth-warm-border)',
        boxShadow: 'var(--auth-card-shadow)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        color: 'var(--auth-kicker)', cursor: 'pointer',
        transition: 'transform .2s ease, background .3s ease, border-color .3s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {dark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  )
}

/* ── Page composition: sign-in only ─────────────────────────────────── */
export default function SignInPage() {
  return (
    <div className="nl-root" id="top">
      <style>{LANDING_CSS}</style>
      <AuthChapter />
    </div>
  )
}
