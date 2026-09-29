'use client'
import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Moon, Zap, Target, Flame, Loader2, Info, BedDouble, Star, CheckCircle2 } from 'lucide-react'

// ─── Small building blocks ──────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--card-border)',
      borderRadius: 20,
      padding: 24,
      backdropFilter: 'blur(12px)',
      ...style
    }}>
      {children}
    </div>
  )
}

function CardTitle({ icon: Icon, children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 12,
        background: 'rgba(46,125,255,0.14)', color: 'var(--accent)'
      }}>
        <Icon size={18} />
      </span>
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{children}</h2>
        {hint && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
    </div>
  )
}

const num = { fontVariantNumeric: 'tabular-nums' }

function readinessColor(score) {
  if (score >= 85) return '#2ECC71'
  if (score >= 70) return '#1FA8C9'
  if (score >= 50) return '#4FD3ED'
  return '#FF6B6B'
}

// SVG readiness dial — colour shifts red → amber → green, Whoop-style.
function ReadinessRing({ score }) {
  const size = 168, stroke = 14, r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = readinessColor(score)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--card-border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s ease', filter: `drop-shadow(0 0 10px ${color}55)` }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary)', ...num }}>{score}</span>
        <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-muted)', fontWeight: 600 }}>READINESS</span>
      </div>
    </div>
  )
}

function MacroBar({ label, grams, pct, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', ...num }}>{grams} g · {pct}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: 'var(--card-highlight)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 6,
          background: color, transition: 'width 0.7s ease'
        }} />
      </div>
    </div>
  )
}

function Stars({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(v => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-label={`Quality ${v}`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: v <= value ? 'var(--accent)' : 'var(--text-faint)',
            transition: 'transform 0.12s ease', transform: v === value ? 'scale(1.15)' : 'none'
          }}>
          <Star size={26} fill={v <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CoachPage() {
  const [tdee, setTdee] = useState(null)
  const [targets, setTargets] = useState(null)
  const [readiness, setReadiness] = useState(null)
  const [sleepLogs, setSleepLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [soreness, setSoreness] = useState(3)
  const [sleepDate, setSleepDate] = useState(todayLocal())
  const [sleepHours, setSleepHours] = useState(7.5)
  const [sleepQuality, setSleepQuality] = useState(3)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  const fetchCore = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tdeeRes, targetsRes, sleepRes] = await Promise.all([
        api.get('/api/coaching/tdee'),
        api.get('/api/coaching/targets'),
        api.get('/api/sleep?days=14')
      ])
      setTdee(tdeeRes.data)
      setTargets(targetsRes.data)
      setSleepLogs(sleepRes.data || [])
    } catch (e) {
      setError('Could not load your coaching data. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchReadiness = useCallback(async (s) => {
    try {
      const res = await api.get(`/api/coaching/readiness?soreness=${s}`)
      setReadiness(res.data)
    } catch { /* readiness is advisory — never block the page */ }
  }, [])

  useEffect(() => { fetchCore() }, [fetchCore])
  useEffect(() => { fetchReadiness(soreness) }, [soreness, fetchReadiness])

  const saveSleep = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      await api.post('/api/sleep', { date: sleepDate, hours: sleepHours, quality: sleepQuality })
      const res = await api.get('/api/sleep?days=14')
      setSleepLogs(res.data || [])
      setSaveMsg({ ok: true, text: 'Sleep logged. Your readiness score will reflect it tonight.' })
      fetchReadiness(soreness)
    } catch {
      setSaveMsg({ ok: false, text: 'Could not save — please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin-slow 1s linear infinite' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 24 }}>
        <Card>
          <p style={{ color: 'var(--text-primary)', margin: '0 0 12px' }}>{error}</p>
          <button onClick={fetchCore} style={btnPrimary}>Try again</button>
        </Card>
      </div>
    )
  }

  const learned = tdee?.status === 'ok'
  const fallbackTxt = tdee?.fallbackTDEE != null ? tdee.fallbackTDEE.toLocaleString('en-GB') : '—'
  const chartData = (tdee?.series || []).map(p => ({
    ...p,
    label: new Date(p.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }))
  const trend = tdee?.trendKgPerWeek
  const trendTxt = trend == null ? '—'
    : `${trend > 0 ? '+' : ''}${trend} kg/wk`

  const macroTotal = (targets?.proteinG || 0) * 4 + (targets?.carbsG || 0) * 4 + (targets?.fatG || 0) * 9
  const pct = g => macroTotal ? Math.round((g * 4 / macroTotal) * 100) : 0
  const fatPct = macroTotal ? Math.round(((targets?.fatG || 0) * 9 / macroTotal) * 100) : 0

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
          Adaptive Coach
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14.5 }}>
          Your targets learn from your body — not from a static formula.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Readiness */}
        <Card>
          <CardTitle icon={Zap} hint="Software-only recovery proxy · updates with sleep, training and soreness">
            Today's readiness
          </CardTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <ReadinessRing score={readiness?.score ?? 70} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{
                display: 'inline-block', padding: '5px 14px', borderRadius: 999,
                background: `${readinessColor(readiness?.score ?? 70)}1f`,
                color: readinessColor(readiness?.score ?? 70),
                fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 10
              }}>
                {(readiness?.zone || 'STEADY').toUpperCase()}
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                {readiness?.suggestion || 'Log sleep and workouts to sharpen this score.'}
              </p>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                MUSCLE SORENESS
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setSoreness(v)}
                    title={['Fresh', 'Mild', 'Moderate', 'Very sore', 'Extremely sore'][v - 1]}
                    style={{
                      width: 38, height: 38, borderRadius: 12, cursor: 'pointer',
                      border: `1px solid ${v === soreness ? 'var(--accent)' : 'var(--card-border)'}`,
                      background: v === soreness ? 'rgba(46,125,255,0.16)' : 'var(--card-highlight)',
                      color: v === soreness ? 'var(--accent)' : 'var(--text-muted)',
                      fontWeight: 700, fontSize: 14, ...num
                    }}>{v}</button>
                ))}
              </div>
            </div>
          </div>
          {readiness?.dataQuality === 'none' && (
            <p style={{ margin: '16px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              No sleep or workout data yet — showing a neutral baseline. Log a night's sleep below to personalise this.
            </p>
          )}
        </Card>

        {/* Sleep logger */}
        <Card>
          <CardTitle icon={BedDouble} hint="Feeds your readiness score · one entry per night">
            Log sleep
          </CardTitle>
          <label style={labelStyle}>Night of</label>
          <input type="date" value={sleepDate} max={todayLocal()} onChange={e => setSleepDate(e.target.value)}
            style={inputStyle} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '16px 0 4px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Hours slept</label>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', ...num }}>{sleepHours.toFixed(1)}h</span>
          </div>
          <input type="range" min={0} max={12} step={0.5} value={sleepHours}
            onChange={e => setSleepHours(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
          <label style={{ ...labelStyle, margin: '16px 0 8px', display: 'block' }}>Sleep quality</label>
          <Stars value={sleepQuality} onChange={setSleepQuality} />
          <button onClick={saveSleep} disabled={saving} style={{ ...btnPrimary, width: '100%', marginTop: 20 }}>
            {saving ? 'Saving…' : 'Save sleep'}
          </button>
          {saveMsg && (
            <p style={{
              margin: '12px 0 0', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center',
              color: saveMsg.ok ? '#2ECC71' : '#FF6B6B'
            }}>
              {saveMsg.ok && <CheckCircle2 size={15} />} {saveMsg.text}
            </p>
          )}
          {sleepLogs.length > 0 && (
            <div style={{ marginTop: 18, borderTop: '1px solid var(--card-border)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8 }}>
                RECENT NIGHTS
              </div>
              {sleepLogs.slice(-5).reverse().map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(l.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, ...num }}>
                    {l.hours.toFixed(1)}h · {'★'.repeat(l.quality)}{'☆'.repeat(5 - l.quality)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Learned TDEE */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardTitle icon={Flame} hint="Learned from your weight trend vs logged intake over the last 28 days">
            Your true energy expenditure
          </CardTitle>
          {learned ? (
            <>
              <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', marginBottom: 8 }}>
                <Stat label="LEARNED TDEE" value={tdee.learnedTDEE.toLocaleString('en-GB')} unit="kcal/day" accent />
                <Stat label="WEIGHT TREND" value={trendTxt} tone={trend < -0.05 ? '#2ECC71' : trend > 0.05 ? '#4FD3ED' : undefined} />
                <Stat label="AVG INTAKE" value={(tdee.avgIntake || 0).toLocaleString('en-GB')} unit="kcal/day" />
                <Stat label="CONFIDENCE" value={(tdee.confidence || 'low').toUpperCase()} small />
              </div>
              <div style={{ height: 240, marginTop: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={40} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card-solid)', border: '1px solid var(--card-border)',
                        borderRadius: 12, fontSize: 13
                      }}
                      formatter={v => [`${v} kg`, 'Weight']} />
                    <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2.5}
                      dot={false} activeDot={{ r: 5, fill: 'var(--accent)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Based on {tdee.weightReadings} weigh-ins and {tdee.intakeDays} days of food logs over {tdee.daysCovered} days.
                  Keep logging and this number tracks your metabolism — no formula can do that.
                </span>
              </p>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', marginBottom: 12 }}>
                <Stat label="ESTIMATED TDEE" value={fallbackTxt} unit="kcal/day" accent />
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                Not enough data to learn your true expenditure yet — this is a formula estimate for now.
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {tdee?.need || 'Log your weight and meals consistently.'} Check back in 2–4 weeks and
                this card will switch to your learned number automatically.
              </p>
            </div>
          )}
        </Card>

        {/* Targets */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardTitle icon={Target}
            hint={targets?.basedOn === 'learned' ? 'Auto-adjusted from your learned TDEE' : 'Formula estimate until your TDEE is learned'}>
            Today's targets
          </CardTitle>
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', marginBottom: 20 }}>
            <Stat label="CALORIES" value={(targets?.calorieTarget || 0).toLocaleString('en-GB')} unit="kcal" accent />
            <Stat label="GOAL" value={goalLabel(targets?.goal)} small />
            <Stat label="ADJUSTMENT" value={targets?.adjustment > 0 ? `+${targets.adjustment}` : `${targets?.adjustment ?? 0}`} unit="kcal" />
          </div>
          <div style={{ maxWidth: 560 }}>
            <MacroBar label="Protein" grams={targets?.proteinG || 0} pct={pct(targets?.proteinG || 0)} color="#1FA8C9" />
            <MacroBar label="Carbs" grams={targets?.carbsG || 0} pct={pct(targets?.carbsG || 0)} color="#60A5FA" />
            <MacroBar label="Fat" grams={targets?.fatG || 0} pct={fatPct} color="#A78BFA" />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            Protein set at 2 g per kg of body weight; fat at 25% of calories; carbs fill the remainder.
          </p>
        </Card>

        {/* How it works */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardTitle icon={Moon} hint="No black boxes">
            How the coach learns
          </CardTitle>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <li>Your <b style={{ color: 'var(--text-primary)' }}>weight trend</b> is fitted with linear regression — the slope is your true rate of change, noise filtered out.</li>
            <li>Mass change becomes energy: <b style={{ color: 'var(--text-primary)' }}>1 kg ≈ 7,700 kcal</b>, so a −0.5 kg/week trend means a −550 kcal/day balance.</li>
            <li><b style={{ color: 'var(--text-primary)' }}>True expenditure = average intake − energy balance.</b> Eating 2,000 kcal while losing 550/day means you burn ~2,550.</li>
            <li>Readiness blends <b style={{ color: 'var(--text-primary)' }}>sleep (50%)</b>, <b style={{ color: 'var(--text-primary)' }}>recent training strain (30%)</b> and <b style={{ color: 'var(--text-primary)' }}>soreness (20%)</b> into one morning score.</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value, unit, accent, tone, small }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: small ? 20 : 30, fontWeight: 800,
        color: tone || (accent ? 'var(--accent)' : 'var(--text-primary)'),
        ...num, lineHeight: 1.1
      }}>
        {value}{unit && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  )
}

function goalLabel(goal) {
  if (goal === 'fat_loss') return 'FAT LOSS'
  if (goal === 'muscle_gain') return 'MUSCLE GAIN'
  return 'MAINTAIN'
}

const labelStyle = { fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 12, boxSizing: 'border-box',
  border: '1px solid var(--card-border)', background: 'var(--card-highlight)',
  color: 'var(--text-primary)', fontSize: 14, colorScheme: 'light dark'
}

const btnPrimary = {
  padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
  color: 'var(--on-accent)', fontWeight: 700, fontSize: 14
}
