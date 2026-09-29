'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { workouts as workoutsApi, meals as mealsApi } from '../../lib/api'
import ShareCard from '../../components/recap/ShareCard'

const SESSION_LOG_KEY = 'nutriai_session_log_v1'

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** Consecutive-day streak ending today (or yesterday if today is empty) */
function calcStreak(dates) {
  const days = new Set()
  for (const v of dates) {
    const d = new Date(v)
    if (!isNaN(d)) days.add(dayKey(d))
  }
  let streak = 0
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function loadSessionLog() {
  try { return JSON.parse(localStorage.getItem(SESSION_LOG_KEY) || '[]') } catch { return [] }
}

export default function RecapPage() {
  const [range, setRange] = useState(7)
  const [workouts, setWorkouts] = useState([])
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [wRes, mRes] = await Promise.all([
          workoutsApi.getAll().catch(() => ({ data: [] })),
          mealsApi.getAll().catch(() => ({ data: [] })),
        ])
        if (!alive) return
        setWorkouts(Array.isArray(wRes.data) ? wRes.data : [])
        setMeals(Array.isArray(mRes.data) ? mRes.data : [])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const recap = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - range)

    const inRange = workouts.filter((w) => {
      const d = new Date(w.createdAt || w.date)
      return !isNaN(d) && d >= cutoff
    })
    const sessions = inRange.length
    const kcal = inRange.reduce((a, w) => a + (w.calories || 0), 0)
    const minutes = inRange.reduce((a, w) => a + (w.duration || 0), 0)

    const workoutStreak = calcStreak(workouts.map((w) => w.createdAt || w.date))
    const mealStreak = calcStreak(meals.map((m) => m.createdAt || m.date))
    const mealsLogged = meals.filter((m) => {
      const d = new Date(m.createdAt || m.date)
      return !isNaN(d) && d >= cutoff
    }).length

    // Volume + top exercises from the local session log (working-set weights)
    let volumeKg = 0
    const exAgg = {}
    for (const s of loadSessionLog()) {
      const d = new Date(s.date)
      if (isNaN(d) || d < cutoff) continue
      for (const ex of s.exercises || []) {
        if (ex.weight && ex.reps) volumeKg += ex.weight * ex.reps
        const agg = exAgg[ex.name] || { name: ex.name, count: 0, volumeKg: 0 }
        agg.count += 1
        if (ex.weight && ex.reps) agg.volumeKg += ex.weight * ex.reps
        exAgg[ex.name] = agg
      }
    }
    const topExercises = Object.values(exAgg)
      .sort((a, b) => b.volumeKg - a.volumeKg || b.count - a.count)
      .slice(0, 5)

    const startLabel = cutoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const endLabel = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

    return {
      sessions, kcal: Math.round(kcal), minutes, volumeKg: Math.round(volumeKg),
      workoutStreak, mealStreak, mealsLogged, topExercises,
      dateLabel: `${startLabel} – ${endLabel}`,
      headlineLines: range === 7 ? ['YOUR WEEK', 'IN TRAINING'] : ['YOUR MONTH', 'IN TRAINING'],
    }
  }, [workouts, meals, range])

  const card = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    boxShadow: '0 8px 40px var(--shadow-color)',
  }

  const statCards = [
    { icon: '💪', label: 'Sessions', val: recap.sessions, color: '#9DCE2C' },
    { icon: '🔥', label: 'Kcal burned', val: recap.kcal.toLocaleString('en-GB'), color: '#FF6B5E' },
    { icon: '⏱️', label: 'Active minutes', val: recap.minutes, color: '#22D3EE' },
    { icon: '🏋️', label: 'Volume lifted', val: recap.volumeKg > 0 ? `${recap.volumeKg.toLocaleString('en-GB')} kg` : '—', color: '#FFD700' },
    { icon: '🍽️', label: 'Meals logged', val: recap.mealsLogged, color: '#7B61FF' },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(600px circle at 20% 30%, rgba(46,125,255,0.05) 0%, transparent 60%),
          radial-gradient(500px circle at 80% 70%, rgba(21, 178, 207,0.04) 0%, transparent 60%)
        `
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <button
            onClick={() => { window.location.href = '/workout' }}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', marginBottom: '12px', padding: 0
            }}
          >← Back to Workouts</button>
          <h1 style={{
            fontFamily: "'Clash Display',sans-serif",
            fontSize: '2.4rem', fontWeight: 800, margin: 0, marginBottom: '6px',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, #FF6B5E 60%, #7B61FF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            {range === 7 ? 'Your Week in Training 📊' : 'Your Month in Training 📊'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            {recap.dateLabel} · built from your logged workouts, meals and working sets
          </p>

          {/* Range toggle */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {[7, 30].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '8px 22px', borderRadius: '99px', cursor: 'pointer',
                  border: range === r ? 'none' : '1px solid var(--border)',
                  background: range === r ? 'linear-gradient(135deg,#FF6B5E,#FFB020 55%,#7B61FF)' : 'var(--bg-card)',
                  color: range === r ? '#000' : 'var(--text-muted)',
                  fontWeight: range === r ? 800 : 400, fontSize: '0.82rem'
                }}
              >{r === 7 ? '7 days' : '30 days'}</button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ ...card, padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Crunching your numbers…
          </div>
        ) : (
          <>
            {/* Streak flame cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {[
                { icon: '🔥', label: 'Training streak', val: `${recap.workoutStreak} day${recap.workoutStreak === 1 ? '' : 's'}`, color: '#1FA8C9', bg: 'rgba(46,125,255,0.07)' },
                { icon: '🍽️', label: 'Logging streak', val: `${recap.mealStreak} day${recap.mealStreak === 1 ? '' : 's'}`, color: '#1FA8C9', bg: 'rgba(46,125,255,0.07)' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ ...card, padding: '24px', background: s.bg, border: `1px solid ${s.color}30`, textAlign: 'center' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    style={{ fontSize: '2.4rem', marginBottom: '8px' }}
                  >{s.icon}</motion.div>
                  <div style={{
                    fontFamily: "'Clash Display',sans-serif", fontSize: '1.7rem',
                    fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums'
                  }}>{s.val}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  whileHover={{ y: -4 }}
                  style={{ ...card, padding: '20px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{s.icon}</div>
                  <div style={{
                    fontFamily: "'Clash Display',sans-serif", fontSize: '1.5rem',
                    fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums'
                  }}>{s.val}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Share card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ ...card, padding: '32px 24px', marginBottom: '20px' }}
            >
              <h2 style={{
                fontFamily: "'Clash Display',sans-serif", color: 'var(--text-primary)',
                fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px', textAlign: 'center'
              }}>
                Share your progress
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 24px' }}>
                A designed recap card, ready to post — every share is a workout buddy recruited.
              </p>
              <ShareCard data={recap} />
            </motion.div>

            {recap.sessions === 0 && (
              <div style={{ ...card, padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No workouts in this range yet — finish a workout and your recap will light up here 💪
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
