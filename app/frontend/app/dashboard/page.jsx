'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { getCurrentUser, getTodayNutrition, getWeeklyNutrition, getUserXP } from '../../lib/api'

export default function Dashboard() {
  const [user, setUser] = useState({ name: 'Loading...' })
  const [water, setWater] = useState(6)
  const [todayNutrition, setTodayNutrition] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [userXP, setUserXP] = useState({ xp: 0, level: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Direct refs instead of dead tilt hook
  const tilt1 = useRef(null)
  const tilt2 = useRef(null)
  const tilt3 = useRef(null)

  useEffect(() => {
    // FIXED: Timeout guard prevents infinite loading state.
    // If all API calls hang > 8s, surface an error instead of spinning forever.
    const loadingTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          setError('Dashboard took too long to load. Check that the backend is running.')
          return false
        }
        return prev
      })
    }, 8000)

    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError('')

        // Check if token exists first
        const token = localStorage.getItem('nutriai_token')
        if (!token || token === 'undefined' || token === 'null') {
          console.warn('No auth token found — redirecting to login')
          clearTimeout(loadingTimeout)
          window.location.href = '/'
          return
        }

        // Load user data from localStorage (sync) + fallback to API
        const localUser = getCurrentUser()
        if (localUser) {
          setUser(localUser)
        }

        // Load today's nutrition, weekly data, and XP in parallel
        const [nutritionData, weekData, xpData] = await Promise.allSettled([
          getTodayNutrition(),
          getWeeklyNutrition(),
          getUserXP(),
        ])

        if (nutritionData.status === 'fulfilled' && nutritionData.value) {
          console.log('✅ Today nutrition:', nutritionData.value)
          setTodayNutrition(nutritionData.value)
        } else {
          console.error('❌ Nutrition fetch failed:', nutritionData.reason)
        }

        if (weekData.status === 'fulfilled' && weekData.value) {
          setWeeklyData(weekData.value)
        }

        if (xpData.status === 'fulfilled' && xpData.value) {
          setUserXP(xpData.value)
        }

      } catch (err) {
        console.error('Dashboard data load error:', err)
        setError('Failed to load dashboard data')
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const cardBaseStyle = {
    background: 'rgba(22,22,31,0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease'
  }

  const gradientBorderStyle = {
    padding: '1px',
    borderRadius: '21px',
    background: 'linear-gradient(135deg, rgba(0,255,135,0.3), rgba(123,97,255,0.1), rgba(0,212,255,0.2))',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 4s ease infinite',
  }

  const bigNumberStyle = {
    fontFamily: "'Clash Display',sans-serif",
    fontSize: '3.5rem',
    fontWeight: 700,
    color: '#00FF87',
    textShadow: '0 0 20px rgba(0,255,135,0.8), 0 0 40px rgba(0,255,135,0.4)',
    display: 'block',
    letterSpacing: '-0.02em'
  }

  const heatColor = (cal, goal) => {
    if (!cal) return 'rgba(255,255,255,0.04)'
    if (cal > goal) return 'rgba(255,107,53,0.6)'
    if (cal >= goal * 0.9) return 'rgba(0,255,135,0.7)'
    if (cal >= goal * 0.6) return 'rgba(0,255,135,0.4)'
    return 'rgba(0,255,135,0.2)'
  }

  if (loading) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0A0A0F' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#6B7280', marginBottom: '16px' }}>Loading Dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0A0A0F' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#FF6B35', marginBottom: '16px' }}>⚠️ Error</div>
          <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
      <div style={{ width: '100%', margin: '0', padding: '0', position: 'relative', zIndex: 1 }}>

        {/* TEMP DEBUG PANEL - remove after fixing */}
        <div style={{
          background: 'rgba(255,100,0,0.15)', border: '1px solid orange',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
          fontSize: '0.8rem', color: '#FFB347', fontFamily: 'monospace'
        }}>
          <strong>🔍 DEBUG:</strong>{' '}
          API calories: <strong>{todayNutrition?.calories ?? 'null'}</strong> |
          goal: <strong>{todayNutrition?.goalCalories ?? 'null'}</strong> |
          meals count: <strong>{todayNutrition?.meals?.length ?? 'null'}</strong> |
          loaded: <strong>{loading ? 'yes' : 'no'}</strong> |
          error: <strong>{error || 'none'}</strong>
        </div>

        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '28px', textAlign: 'left' }}
        >
          <h1 style={{
            fontFamily: "'Clash Display',sans-serif",
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'white',
            margin: 0,
            background: 'linear-gradient(135deg, #ffffff, #00FF87)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Good Morning, {user.name} 👋
          </h1>
          <p style={{
            color: '#6B7280',
            fontSize: '0.95rem',
            marginTop: '4px',
            fontFamily: "'Satoshi',sans-serif"
          }}>
            Monday, 9 March 2026 • Here's your health summary
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0,255,135,0.08)',
            border: '1px solid rgba(0,255,135,0.2)',
            borderRadius: '99px',
            padding: '6px 16px',
            marginTop: '12px',
            color: '#00FF87',
            fontSize: '0.82rem',
            fontFamily: "'Satoshi',sans-serif"
          }}>
            🤖 {todayNutrition?.calories && todayNutrition?.goalCalories ? 
              (todayNutrition.calories < todayNutrition.goalCalories ? 
                `You're ${Math.round(todayNutrition.goalCalories - todayNutrition.calories)} kcal under goal. Consider a healthy snack!` : 
                `You've reached your daily calorie goal!`) 
              : `Ready to log your meals for today?`}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* ROW 1 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            width: '100%',
            gap: '20px',
            marginBottom: '20px'
          }}>

            {/* CALORIE RING */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt1}
                style={cardBaseStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Calories Today
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00FF87" />
                        <stop offset="100%" stopColor="#00D4FF" />
                      </linearGradient>
                    </defs>
                    <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <motion.circle cx="80" cy="80" r="65" fill="none"
                      stroke="url(#ringGrad)" strokeWidth="10"
                      strokeLinecap="round"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(0,255,135,0.6))'
                      }}
                      strokeDashoffset="102"
                      initial={{ strokeDasharray: '0 408.4' }}
                      animate={{ strokeDasharray: `${Math.min(todayNutrition?.calories || 0, todayNutrition?.goalCalories || 1800) / (todayNutrition?.goalCalories || 1800) * 408.4} 408.4` }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                    <text x="80" y="72" textAnchor="middle" fill="white" fontSize="28" fontFamily="'Clash Display',sans-serif" fontWeight="700">{todayNutrition?.calories || 0}</text>
                    <text x="80" y="92" textAnchor="middle" fill="#6B7280" fontSize="11" fontFamily="'Satoshi',sans-serif">of {todayNutrition?.goalCalories || 1800} kcal</text>
                  </svg>
                  <div style={{
                    background: 'rgba(0,255,135,0.15)',
                    border: '1px solid rgba(0,255,135,0.3)',
                    borderRadius: '99px',
                    padding: '4px 16px',
                    color: '#00FF87',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginTop: '8px'
                  }}>{Math.round(((todayNutrition?.calories || 0) / (todayNutrition?.goalCalories || 1800)) * 100)}% of Daily Goal</div>
                </div>
              </motion.div>
            </div>

            {/* MACROS */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt2}
                style={cardBaseStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Today's Macros
                </div>
                {[
                  { label: 'Protein', val: todayNutrition?.protein || 0, goal: 150, color: '#00FF87' },
                  { label: 'Carbs', val: todayNutrition?.carbs || 0, goal: 230, color: '#7B61FF' },
                  { label: 'Fat', val: todayNutrition?.fat || 0, goal: 70, color: '#FF6B35' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#F0F0FF', fontSize: '0.85rem' }}>{m.label}</span>
                      <span style={{ color: m.color, fontSize: '0.85rem', fontWeight: 700 }}>{m.val}g</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(m.val / m.goal) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{
                          height: '100%', background: m.color, borderRadius: '99px',
                          boxShadow: `0 0 10px ${m.color}60`
                        }}
                      />
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.72rem', marginTop: '3px' }}>
                      {Math.round((m.val / m.goal) * 100)}% of {m.goal}g
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* WATER */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt3}
                style={cardBaseStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Hydration 💧
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} onClick={() => setWater(i + 1)}
                      style={{
                        fontSize: '1.8rem', textAlign: 'center', cursor: 'pointer',
                        filter: i < water ? 'none' : 'grayscale(1) opacity(0.3)',
                        transform: i < water ? 'scale(1)' : 'scale(0.9)',
                        transition: 'all 0.2s ease'
                      }}>💧</div>
                  ))}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ ...bigNumberStyle, color: '#00D4FF', textShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.4)' }}>
                    {water}
                  </span>
                  <span style={{ color: '#6B7280', fontSize: '1rem' }}> / 8 glasses</span>
                </div>
                <button
                  onClick={() => setWater(w => Math.min(w + 1, 8))}
                  style={{
                    width: '100%', marginTop: '12px', padding: '8px',
                    background: 'transparent',
                    border: '1px solid rgba(0,212,255,0.3)',
                    borderRadius: '10px', color: '#00D4FF',
                    fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>+ Add Glass</button>
              </motion.div>
            </div>
          </div>

          {/* ROW 2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr',
            gap: '20px',
            marginBottom: '20px',
            width: '100%'
          }}>
            {/* HEATMAP */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt1}
                style={cardBaseStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  This Week 📅
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {weeklyData.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 + 0.5 }}
                        style={{
                          width: '48px', height: '48px',
                          borderRadius: '12px',
                          background: heatColor(d.cal, d.goal),
                          margin: '0 auto 8px',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: d.cal >= d.goal * 0.9 ? '0 0 12px rgba(0,255,135,0.4)' : 'none',
                          border: d.cal >= d.goal ? '1px solid rgba(0,255,135,0.4)' : '1px solid transparent'
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          {d.cal ? (d.cal >= 1000 ? `${(d.cal / 1000).toFixed(1)}k` : d.cal) : ''}
                        </span>
                      </motion.div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>{d.day}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* WORKOUT */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt2}
                style={{ ...cardBaseStyle, background: 'linear-gradient(135deg, rgba(22,22,31,0.9), rgba(0,255,135,0.05))' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Today's Mission 💪
                </div>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '1.1rem', color: 'white', marginBottom: '12px', fontWeight: 600 }}>
                  Upper Body Strength
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {['⏱ 45 min', '🔥 320 kcal'].map(c => (
                    <span key={c} style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '99px', padding: '4px 12px',
                      color: '#F0F0FF', fontSize: '0.78rem'
                    }}>{c}</span>
                  ))}
                </div>
                {['Push Ups 4×12', 'Dumbbell Rows 3×10', 'Shoulder Press 3×10'].map(e => (
                  <div key={e} style={{
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: '#9CA3AF', fontSize: '0.82rem',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <span style={{ color: '#00FF87', fontSize: '0.7rem' }}>▶</span>
                    {e}
                  </div>
                ))}
                <button style={{
                  width: '100%', marginTop: '16px', padding: '12px',
                  background: 'linear-gradient(135deg,#00FF87,#00D4FF)',
                  border: 'none', borderRadius: '12px',
                  color: '#000', fontWeight: 700, fontSize: '0.9rem',
                  cursor: 'pointer', fontFamily: "'Satoshi',sans-serif",
                  boxShadow: '0 4px 20px rgba(0,255,135,0.3)'
                }}>Start Workout →</button>
              </motion.div>
            </div>
          </div>

          {/* ROW 3 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            width: '100%',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* RISK */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt3}
                style={cardBaseStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Risk Score 🛡️
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={bigNumberStyle}>
                    <CountUp end={userXP?.level || 1} duration={2} />
                  </span>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(0,255,135,0.12)',
                    border: '1px solid rgba(0,255,135,0.3)',
                    borderRadius: '99px', padding: '4px 16px',
                    color: '#00FF87', fontSize: '0.8rem', fontWeight: 700,
                    marginBottom: '12px'
                  }}>Level {userXP?.level || 1} ✅</div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['Diabetes', 'Obesity', 'Hypertension'].map(r => (
                      <span key={r} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '99px', padding: '3px 10px',
                        color: '#6B7280', fontSize: '0.72rem'
                      }}>{r}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* FORECAST */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt1}
                style={cardBaseStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  30-Day Forecast 📈
                </div>
                <svg width="100%" height="100" viewBox="0 0 200 80">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00FF87" />
                      <stop offset="100%" stopColor="#7B61FF" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points="0,60 25,55 50,58 75,50 100,45 125,35 150,30 175,22 200,15"
                    fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,135,0.5))' }}
                  />
                  <polyline
                    points="100,45 125,38 150,32 175,25 200,18"
                    fill="none" stroke="#7B61FF" strokeWidth="2"
                    strokeDasharray="5,4" opacity="0.7"
                  />
                  <line x1="100" y1="0" x2="100" y2="80"
                    stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3,3" />
                </svg>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(0,255,135,0.1)',
                  border: '1px solid rgba(0,255,135,0.25)',
                  borderRadius: '99px', padding: '5px 14px',
                  color: '#00FF87', fontSize: '0.82rem', fontWeight: 600,
                  marginTop: '8px'
                }}>
                  📉 -2.1kg predicted in 30 days
                </div>
              </motion.div>
            </div>

            {/* BADGES */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt2}
                style={cardBaseStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Latest Badges 🏆
                </div>
                {[
                  { emoji: '🔥', name: 'On Fire', xp: 200 },
                  { emoji: '💪', name: 'Iron Will', xp: 300 },
                  { emoji: '🎯', name: 'Goal Crusher', xp: 400 },
                ].map((b, i) => (
                  <motion.div
                    key={b.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.8 }}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{b.emoji}</span>
                      <span style={{ color: '#F0F0FF', fontSize: '0.85rem' }}>{b.name}</span>
                    </div>
                    <span style={{
                      background: 'rgba(0,255,135,0.12)',
                      border: '1px solid rgba(0,255,135,0.25)',
                      borderRadius: '99px', padding: '3px 10px',
                      color: '#00FF87', fontSize: '0.75rem', fontWeight: 700
                    }}>+{b.xp} XP</span>
                  </motion.div>
                ))}
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <a href="/achievements" style={{ color: '#7B61FF', fontSize: '0.82rem', textDecoration: 'none' }}>
                    View All Badges →
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <motion.div
            style={cardBaseStyle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { icon: '📸', label: 'Log Meal', href: '/meal-logger', color: 'rgba(0,255,135,0.15)', border: 'rgba(0,255,135,0.3)', text: '#00FF87' },
                { icon: '🥦', label: 'Find Recipe', href: '/recipe-maker', color: 'rgba(123,97,255,0.15)', border: 'rgba(123,97,255,0.3)', text: '#7B61FF' },
                { icon: '💬', label: 'Ask AI', href: '/chatbot', color: 'rgba(0,212,255,0.15)', border: 'rgba(0,212,255,0.3)', text: '#00D4FF' },
                { icon: '📅', label: 'Meal Plan', href: '/meal-plan', color: 'rgba(255,107,53,0.15)', border: 'rgba(255,107,53,0.3)', text: '#FF6B35' },
              ].map(a => (
                <a key={a.label} href={a.href} style={{ textDecoration: 'none', flex: 1, minWidth: '120px' }}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: `0 8px 24px ${a.border}` }}
                    style={{
                      background: a.color,
                      border: `1px solid ${a.border}`,
                      borderRadius: '14px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{a.icon}</div>
                    <div style={{ color: a.text, fontSize: '0.85rem', fontWeight: 600 }}>{a.label}</div>
                  </motion.div>
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>

      </div>
  )
}
