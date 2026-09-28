'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import api, { getCurrentUser, getTodayNutrition, getWeeklyNutrition, getUserXP, badges } from '../../lib/api'
import useIsMobile from '../../lib/useIsMobile'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Dashboard() {
  const isMobile = useIsMobile()
  const [user, setUser] = useState({ name: 'Loading...' })
  const [water, setWater] = useState(0)
  const [waterLogs, setWaterLogs] = useState([])
  const [todayNutrition, setTodayNutrition] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [userXP, setUserXP] = useState({ xp: 0, level: 1 })
  const [realBadges, setRealBadges] = useState([])
  const [stats, setStats] = useState(null)
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

        // Load all dashboard data in parallel
        const [nutritionData, weekData, xpData, statsData, waterData, badgesData] = await Promise.allSettled([
          getTodayNutrition(),
          getWeeklyNutrition(),
          getUserXP(),
          api.get('/api/stats').then(res => res.data),
          api.get('/api/water').then(res => res.data),
          badges.getAll().then(res => res.data)
        ])

        if (nutritionData.status === 'fulfilled' && nutritionData.value) {
          setTodayNutrition(nutritionData.value)
        }
        if (weekData.status === 'fulfilled' && weekData.value) {
          setWeeklyData(weekData.value)
        }
        if (xpData.status === 'fulfilled' && xpData.value) {
          setUserXP(xpData.value)
        }
        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats(statsData.value)
        }
        if (waterData.status === 'fulfilled' && waterData.value) {
          setWater(waterData.value.totalMl / 250) // Assuming 250ml per glass
          setWaterLogs(waterData.value.logs)
        }
        if (badgesData.status === 'fulfilled' && Array.isArray(badgesData.value)) {
          const unlocked = badgesData.value
            .filter(b => b.unlocked)
            .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0))
            .slice(0, 3)
          setRealBadges(unlocked)
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
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px var(--shadow-color)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease'
  }

  const gradientBorderStyle = {
    padding: '1px',
    borderRadius: '21px',
    background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(123,97,255,0.1), rgba(251,146,60,0.2))',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 4s ease infinite',
  }

  const bigNumberStyle = {
    fontFamily: "'Clash Display',sans-serif",
    fontSize: '3.5rem',
    fontWeight: 700,
    color: '#F97316',
    textShadow: '0 0 20px rgba(249,115,22,0.8), 0 0 40px rgba(249,115,22,0.4)',
    display: 'block',
    letterSpacing: '-0.02em'
  }

  const heatColor = (cal, goal) => {
    if (!cal) return 'var(--border)'
    if (cal > goal) return 'rgba(255,107,53,0.6)'
    if (cal >= goal * 0.9) return 'rgba(249,115,22,0.7)'
    if (cal >= goal * 0.6) return 'rgba(249,115,22,0.4)'
    return 'rgba(249,115,22,0.2)'
  }

  if (loading) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Loading Dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#FF6B35', marginBottom: '16px' }}>⚠️ Error</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', borderRadius: '99px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#F97316,#FF6B35)', color: '#fff',
              fontSize: '0.9rem', fontWeight: 700
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const [addingWater, setAddingWater] = useState(false)

  const handleAddWater = async () => {
    if (addingWater) return // prevent double-click double-logging
    setAddingWater(true)
    try {
      const res = await api.post('/api/water', { amountMl: 250 })
      if (res.data) {
        setWater(w => Math.min(w + 1, 8))
        setWaterLogs(prev => [res.data, ...prev])
      }
    } catch (err) {
      console.error('Failed to log water:', err)
    } finally {
      setAddingWater(false)
    }
  }

  return (
      <div style={{ width: '100%', margin: '0', padding: '0', position: 'relative', zIndex: 1 }}>

        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '28px', textAlign: 'left' }}
        >
          <h1 style={{
            fontFamily: "'Clash Display',sans-serif",
            fontSize: isMobile ? '1.7rem' : '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            background: 'linear-gradient(135deg, var(--text-primary), #F97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {getGreeting()}, {user.name} 👋
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            marginTop: '4px',
            fontFamily: "'Satoshi',sans-serif"
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Here's your health summary
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: '99px',
            padding: '6px 16px',
            marginTop: '12px',
            color: '#F97316',
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
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Calories Today
                  </div>
                  {stats?.streak > 0 && (
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: '99px',
                      background: 'rgba(255,107,53,0.1)',
                      color: '#FF6B35',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid rgba(255,107,53,0.2)'
                    }}>
                      🔥 {stats.streak} Day Streak
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#FB923C" />
                      </linearGradient>
                    </defs>
                    <circle cx="80" cy="80" r="65" fill="none" stroke="var(--border)" strokeWidth="10" />
                    <motion.circle cx="80" cy="80" r="65" fill="none"
                      stroke="url(#ringGrad)" strokeWidth="10"
                      strokeLinecap="round"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.6))'
                      }}
                      strokeDashoffset="102"
                      initial={{ strokeDasharray: '0 408.4' }}
                      animate={{ strokeDasharray: `${Math.min(todayNutrition?.calories || 0, (todayNutrition?.goalCalories || stats?.calorieGoal || 2000)) / ((todayNutrition?.goalCalories || stats?.calorieGoal || 2000)) * 408.4} 408.4` }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                    <text x="80" y="72" textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontFamily="'Clash Display',sans-serif" fontWeight="700">{todayNutrition?.calories || 0}</text>
                    <text x="80" y="92" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontFamily="'Satoshi',sans-serif">of {(todayNutrition?.goalCalories || stats?.calorieGoal || 2000)} kcal</text>
                  </svg>
                  <div style={{
                    background: 'rgba(249,115,22,0.15)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    borderRadius: '99px',
                    padding: '4px 16px',
                    color: '#F97316',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginTop: '8px'
                  }}>{Math.round(((todayNutrition?.calories || 0) / ((todayNutrition?.goalCalories || stats?.calorieGoal || 2000))) * 100)}% of Daily Goal</div>
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Today's Macros
                </div>
                {[
                  { label: 'Protein', val: todayNutrition?.protein || 0, goal: stats?.proteinGoal || 150, color: '#F97316' },
                  { label: 'Carbs', val: todayNutrition?.carbs || 0, goal: stats?.carbGoal || 250, color: '#7B61FF' },
                  { label: 'Fat', val: todayNutrition?.fat || 0, goal: stats?.fatGoal || 65, color: '#FF6B35' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{m.label}</span>
                      <span style={{ color: m.color, fontSize: '0.85rem', fontWeight: 700 }}>{m.val}g</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
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
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '3px' }}>
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Hydration 💧
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i}
                      style={{
                        fontSize: '1.8rem', textAlign: 'center',
                        filter: i < Math.floor(water) ? 'none' : 'grayscale(1) opacity(0.3)',
                        transform: i < Math.floor(water) ? 'scale(1)' : 'scale(0.9)',
                        transition: 'all 0.2s ease'
                      }}>💧</div>
                  ))}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ ...bigNumberStyle, color: '#FB923C', textShadow: '0 0 20px rgba(251,146,60,0.8), 0 0 40px rgba(251,146,60,0.4)' }}>
                    {Math.floor(water)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}> / 8 glasses</span>
                </div>
                <button
                  onClick={handleAddWater}
                  disabled={addingWater}
                  style={{
                    width: '100%', marginTop: '12px', padding: '8px',
                    background: 'transparent',
                    border: '1px solid rgba(251,146,60,0.3)',
                    borderRadius: '10px', color: '#FB923C',
                    fontSize: '0.85rem', cursor: addingWater ? 'wait' : 'pointer',
                    opacity: addingWater ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}>{addingWater ? 'Adding...' : '+ Add Glass'}</button>
              </motion.div>
            </div>
          </div>

          {/* ROW 2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr',
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  This Week 📅
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {weeklyData.length === 0 ? (
                    <div style={{
                      width: '100%',
                      textAlign: 'center',
                      padding: '24px 12px',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontFamily: "'Satoshi',sans-serif"
                    }}>
                      No activity logged this week yet.<br />
                      Log your first meal to start your heatmap 🔥
                    </div>
                  ) : (
                  weeklyData.map((d, i) => (
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
                          boxShadow: d.cal >= d.goal * 0.9 ? '0 0 12px rgba(249,115,22,0.4)' : 'none',
                          border: d.cal >= d.goal ? '1px solid rgba(249,115,22,0.4)' : '1px solid transparent'
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {d.cal ? (d.cal >= 1000 ? `${(d.cal / 1000).toFixed(1)}k` : d.cal) : ''}
                        </span>
                      </motion.div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{d.day}</div>
                    </div>
                  )))}
                </div>
              </motion.div>
            </div>

            {/* WORKOUT */}
            <div style={gradientBorderStyle}>
              <motion.div
                {...tilt2}
                style={{ ...cardBaseStyle, background: 'linear-gradient(135deg, var(--bg-card), rgba(249,115,22,0.05))' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Today's Mission 💪
                </div>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 600 }}>
                  Upper Body Strength
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {['⏱ 45 min', '🔥 320 kcal'].map(c => (
                    <span key={c} style={{
                      background: 'var(--border)',
                      border: '1px solid var(--border)',
                      borderRadius: '99px', padding: '4px 12px',
                      color: 'var(--text-primary)', fontSize: '0.78rem'
                    }}>{c}</span>
                  ))}
                </div>
                {['Push Ups 4×12', 'Dumbbell Rows 3×10', 'Shoulder Press 3×10'].map(e => (
                  <div key={e} style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: '0.82rem',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <span style={{ color: '#F97316', fontSize: '0.7rem' }}>▶</span>
                    {e}
                  </div>
                ))}
                <button
                  onClick={() => { window.location.href = '/workout' }}
                  style={{
                  width: '100%', marginTop: '16px', padding: '12px',
                  background: 'linear-gradient(135deg,#F97316,#FB923C)',
                  border: 'none', borderRadius: '12px',
                  color: '#000', fontWeight: 700, fontSize: '0.9rem',
                  cursor: 'pointer', fontFamily: "'Satoshi',sans-serif",
                  boxShadow: '0 4px 20px rgba(249,115,22,0.3)'
                }}>Start Workout →</button>
              </motion.div>
            </div>
          </div>

          {/* ROW 3 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Fitness Level 🏆
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={bigNumberStyle}>
                    <CountUp end={userXP?.level || 1} duration={2} />
                  </span>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(249,115,22,0.12)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    borderRadius: '99px', padding: '4px 16px',
                    color: '#F97316', fontSize: '0.8rem', fontWeight: 700,
                    marginBottom: '12px'
                  }}>{userXP?.levelName || 'Rookie'} ✅</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                    {(userXP?.totalXP || 0).toLocaleString()} XP · {userXP?.unlockedBadges || 0} badges earned
                  </div>
                  {userXP?.nextLevelXP ? (
                    <div>
                      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((userXP?.totalXP || 0) / userXP.nextLevelXP) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.6 }}
                          style={{ height: '100%', background: 'linear-gradient(90deg,#F97316,#FFD700)', borderRadius: '99px' }}
                        />
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {((userXP?.nextLevelXP || 0) - (userXP?.totalXP || 0)).toLocaleString()} XP to next level
                      </div>
                    </div>
                  ) : null}
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Weekly Calories 📊
                </div>
                {weeklyData && weeklyData.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px', marginBottom: '10px' }}>
                      {weeklyData.slice(-7).map((d, i) => {
                        const goal = d.goal || stats?.calorieGoal || 2000
                        const pct = Math.min(100, ((d.cal || 0) / goal) * 100)
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`${d.day || ''}: ${d.cal || 0} / ${goal} kcal`}>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>{d.cal || 0}</div>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(4, pct * 0.9)}%` }}
                              transition={{ duration: 0.6, delay: 0.5 + i * 0.07 }}
                              style={{
                                width: '100%', maxWidth: '34px', borderRadius: '6px',
                                background: (d.cal || 0) >= goal * 0.9
                                  ? 'linear-gradient(180deg,#F97316,#FF6B35)'
                                  : 'linear-gradient(180deg,rgba(249,115,22,0.55),rgba(249,115,22,0.25))',
                                boxShadow: (d.cal || 0) >= goal * 0.9 ? '0 0 10px rgba(249,115,22,0.4)' : 'none'
                              }}
                            />
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>{(d.day || '').slice(0, 3)}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(249,115,22,0.1)',
                      border: '1px solid rgba(249,115,22,0.25)',
                      borderRadius: '99px', padding: '5px 14px',
                      color: '#F97316', fontSize: '0.82rem', fontWeight: 600,
                      marginTop: '8px'
                    }}>
                      🔥 {Math.round(weeklyData.slice(-7).reduce((a, d) => a + (d.cal || 0), 0) / Math.max(1, weeklyData.slice(-7).length)).toLocaleString()} kcal/day avg
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
                    No meals logged this week yet.<br />Log a meal to see your trend 📈
                  </div>
                )}
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Latest Badges 🏆
                </div>
                {realBadges.length > 0 ? realBadges.map((b, i) => (
                  <motion.div
                    key={b.id || b.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.8 }}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: i < realBadges.length - 1 ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{b.emoji}</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{b.name}</span>
                    </div>
                    <span style={{
                      background: 'rgba(249,115,22,0.12)',
                      border: '1px solid rgba(249,115,22,0.25)',
                      borderRadius: '99px', padding: '3px 10px',
                      color: '#F97316', fontSize: '0.75rem', fontWeight: 700
                    }}>+{b.xp} XP</span>
                  </motion.div>
                )) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                    No badges earned yet 🏅<br />
                    Log meals and finish workouts to unlock your first badge
                  </div>
                )}
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
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { icon: '📸', label: 'Log Meal', href: '/meal-logger', color: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', text: '#F97316' },
                { icon: '🥦', label: 'Find Recipe', href: '/recipe-maker', color: 'rgba(123,97,255,0.15)', border: 'rgba(123,97,255,0.3)', text: '#7B61FF' },
                { icon: '💬', label: 'Ask AI', href: '/chatbot', color: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', text: '#FB923C' },
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
