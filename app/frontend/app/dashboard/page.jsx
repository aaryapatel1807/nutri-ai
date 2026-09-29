'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import {
  Flame, Moon, Droplets, Search, Bell, ChevronDown, ChevronLeft, ChevronRight,
  Dumbbell, Sparkles, CalendarDays, ArrowRight, ArrowUpRight, Zap, Target, TrendingUp
} from 'lucide-react'
import CountUp from 'react-countup'
import api, { getCurrentUser, getTodayNutrition, getWeeklyNutrition, getUserXP, badges } from '../../lib/api'
import useIsMobile from '../../lib/useIsMobile'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const DESTINATIONS = [
  { label: 'Dashboard', href: '/dashboard', keys: 'home overview' },
  { label: 'Log Meal', href: '/meal-logger', keys: 'food meal log photo camera scan' },
  { label: 'Barcode Scan', href: '/barcode', keys: 'barcode product scan upc' },
  { label: 'Recipe Maker', href: '/recipe-maker', keys: 'recipe cook find' },
  { label: 'Meal Plan', href: '/meal-plan', keys: 'plan week meals' },
  { label: 'Workouts', href: '/workout', keys: 'workout gym exercise training' },
  { label: 'AI Coach', href: '/coach', keys: 'coach ai advice readiness targets' },
  { label: 'AI Chat', href: '/chatbot', keys: 'chat ask ai' },
  { label: 'Community', href: '/community', keys: 'community friends social' },
  { label: 'Weekly Recap', href: '/recap', keys: 'recap week review summary' },
  { label: 'Achievements', href: '/achievements', keys: 'badges achievements xp level' },
  { label: 'Profile', href: '/profile', keys: 'profile settings account' },
]

const MEAL_META = {
  breakfast: { emoji: '🍳', bg: 'linear-gradient(135deg,#B5E5F2,#4FD3ED)' },
  lunch:     { emoji: '🥗', bg: 'linear-gradient(135deg,#6EE7B7,#34D399)' },
  dinner:    { emoji: '🍗', bg: 'linear-gradient(135deg,#7B61FF,#A78BFA)' },
  snack:     { emoji: '🍎', bg: 'linear-gradient(135deg,#F9A8D4,#F472B6)' },
}

function ageFromDob(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d)) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default function Dashboard() {
  const isMobile = useIsMobile()
  // ── all hooks at the top (never below early returns) ──
  const [user, setUser] = useState({ name: 'Loading...' })
  const [profile, setProfile] = useState(null)
  const [water, setWater] = useState(0)
  const [waterLogs, setWaterLogs] = useState([])
  const [todayNutrition, setTodayNutrition] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [userXP, setUserXP] = useState({ xp: 0, level: 1 })
  const [realBadges, setRealBadges] = useState([])
  const [stats, setStats] = useState(null)
  const [sleepLogs, setSleepLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingWater, setAddingWater] = useState(false)
  const [query, setQuery] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() } })
  const [selDay, setSelDay] = useState(() => new Date().toISOString().split('T')[0])
  const searchRef = useRef(null)

  useEffect(() => {
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
        const token = localStorage.getItem('nutriai_token')
        if (!token || token === 'undefined' || token === 'null') {
          console.warn('No auth token found — redirecting to login')
          clearTimeout(loadingTimeout)
          window.location.href = '/'
          return
        }
        const localUser = getCurrentUser()
        if (localUser) setUser(localUser)

        const [nutritionData, weekData, xpData, statsData, waterData, badgesData, sleepData, meData] = await Promise.allSettled([
          getTodayNutrition(),
          getWeeklyNutrition(),
          getUserXP(),
          api.get('/api/stats').then(res => res.data),
          api.get('/api/water').then(res => res.data),
          badges.getAll().then(res => res.data),
          api.get('/api/sleep?days=31').then(res => res.data),
          api.get('/api/auth/me').then(res => res.data),
        ])

        if (nutritionData.status === 'fulfilled' && nutritionData.value) setTodayNutrition(nutritionData.value)
        if (weekData.status === 'fulfilled' && weekData.value) setWeeklyData(weekData.value)
        if (xpData.status === 'fulfilled' && xpData.value) setUserXP(xpData.value)
        if (statsData.status === 'fulfilled' && statsData.value) setStats(statsData.value)
        if (waterData.status === 'fulfilled' && waterData.value) {
          setWater(waterData.value.totalMl / 250)
          setWaterLogs(waterData.value.logs)
        }
        if (badgesData.status === 'fulfilled' && Array.isArray(badgesData.value)) {
          setRealBadges(badgesData.value.filter(b => b.unlocked)
            .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0)).slice(0, 3))
        }
        if (sleepData.status === 'fulfilled' && Array.isArray(sleepData.value)) setSleepLogs(sleepData.value)
        if (meData.status === 'fulfilled' && meData.value) { setProfile(meData.value); setUser(u => ({ ...u, ...meData.value })) }
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

  useEffect(() => {
    const onClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocus(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // ── derived data ──
  const goalCals = todayNutrition?.goalCalories || stats?.calorieGoal || 2000
  const proteinGoal = stats?.proteinGoal || 150
  const cals = todayNutrition?.calories || 0
  const protein = todayNutrition?.protein || 0

  const calRatio = cals / goalCals
  const dayScore = Math.round(
    40 * Math.max(0, 1 - Math.abs(calRatio - 0.95) / 0.95) +
    20 * Math.min(protein / proteinGoal, 1) +
    20 * Math.min(water / 8, 1) +
    20 * Math.min((todayNutrition?.meals?.length || 0) / 3, 1)
  )
  const scoreColor = dayScore < 40 ? '#FF6B6B' : dayScore < 70 ? '#1FA8C9' : '#2ECC71'
  const scoreZone = dayScore < 40 ? 'WARMING UP' : dayScore < 70 ? 'BUILDING' : dayScore < 90 ? 'STRONG' : 'ON FIRE'

  const sleepByDay = useMemo(() => {
    const m = {}
    sleepLogs.forEach(l => { m[new Date(l.date).toISOString().split('T')[0]] = l })
    return m
  }, [sleepLogs])
  const lastNight = [...sleepLogs].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const last7Nights = [...sleepLogs].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7)
  const weekChart = (weeklyData || []).slice(-7).map(d => ({
    day: (d.day || '').slice(0, 3), cal: d.cal || 0, goal: d.goal || goalCals,
  }))

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return DESTINATIONS.filter(d => (d.label + ' ' + d.keys).toLowerCase().includes(q)).slice(0, 6)
  }, [query])

  const age = ageFromDob(profile?.dob)
  const handle = (user.email || '').split('@')[0]

  // ── shared glass styles (theme-aware via CSS vars) ──
  const glass = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(26px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(26px) saturate(1.6)',
    border: '1px solid var(--glass-border)',
    borderRadius: '26px',
    boxShadow: 'var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)',
  }
  const cardTitle = {
    color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Satoshi',sans-serif",
  }
  const iconTile = (bg, color) => ({
    width: '40px', height: '40px', borderRadius: '14px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', background: bg, color,
    boxShadow: `0 4px 14px ${bg.replace(/[\d.]+\)$/, '0.35)')}`,
    flexShrink: 0,
  })

  const handleAddWater = async () => {
    if (addingWater) return
    setAddingWater(true)
    try {
      const res = await api.post('/api/water', { amountMl: 250 })
      if (res.data) {
        setWater(w => Math.min(w + 1, 8))
        setWaterLogs(prev => [res.data, ...prev])
      }
    } catch (err) { console.error('Failed to log water:', err) }
    finally { setAddingWater(false) }
  }

  if (loading) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            style={{ width: '44px', height: '44px', borderRadius: '50%', margin: '0 auto 16px',
              border: '3px solid var(--border)', borderTopColor: '#15B2CF' }} />
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Loading Dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#1FA8C9', marginBottom: '16px' }}>⚠️ Error</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>{error}</div>
          <button onClick={() => window.location.reload()}
            style={{ padding: '12px 28px', borderRadius: '99px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#15B2CF,#1FA8C9)', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const ringC = 2 * Math.PI * 30

  return (
    <div style={{ width: '100%', margin: 0, padding: isMobile ? '0 4px' : '0 8px', position: 'relative', zIndex: 1 }}>

      {/* ═══ FROSTED SCENIC BACKDROP ═══ */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <img src="/images/dash-bg.jpg" alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(46px) saturate(1.25)', transform: 'scale(1.12)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'var(--dash-veil)' }} />
        <motion.div
          animate={{ x: [0, 46, 0], y: [0, -34, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-10%', left: '-8%', width: '44vw', height: '44vw',
            borderRadius: '50%', background: 'var(--dash-orb-1)', filter: 'blur(70px)' }} />
        <motion.div
          animate={{ x: [0, -54, 0], y: [0, 40, 0] }}
          transition={{ duration: 23, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '-16%', right: '-10%', width: '50vw', height: '50vw',
            borderRadius: '50%', background: 'var(--dash-orb-2)', filter: 'blur(80px)' }} />
      </div>

      {/* ═══ HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <h1 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: isMobile ? '1.6rem' : '2rem',
            fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            {getGreeting()}, {user.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0', fontFamily: "'Satoshi',sans-serif" }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · Let's do some workout today
          </p>
        </div>

        {/* search */}
        <div ref={searchRef} style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '0 1 340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...glass, borderRadius: '99px', padding: '10px 18px' }}>
            <Search size={17} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setSearchFocus(true)}
              onKeyDown={e => { if (e.key === 'Enter' && searchResults.length) window.location.href = searchResults[0].href; if (e.key === 'Escape') setSearchFocus(false) }}
              placeholder="Search pages, meals, workouts…"
              style={{ background: 'none', border: 'none', outline: 'none', width: '100%',
                color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: "'Satoshi',sans-serif" }} />
          </div>
          <AnimatePresence>
            {searchFocus && searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50, ...glass, borderRadius: '18px', padding: '8px', overflow: 'hidden' }}>
                {searchResults.map(r => (
                  <div key={r.href} onMouseDown={() => { window.location.href = r.href }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                      borderRadius: '12px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--track)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <span>{r.label}</span>
                    <ArrowUpRight size={15} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* bell + profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={() => window.location.href = '/recap'}
            style={{ ...glass, borderRadius: '50%', width: '44px', height: '44px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', padding: 0 }}>
            <Bell size={18} style={{ color: 'var(--text-primary)' }} />
            {(stats?.streak > 0) && <span style={{ position: 'absolute', top: '9px', right: '11px', width: '8px', height: '8px',
              borderRadius: '50%', background: '#15B2CF', border: '2px solid var(--card-solid)' }} />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => window.location.href = '/profile'}
            style={{ ...glass, borderRadius: '99px', padding: '6px 14px 6px 6px', display: 'flex',
              alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <span style={{ width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#15B2CF,#4FD3ED)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Satoshi',sans-serif" }}>
              {(user.name || 'A')[0].toUpperCase()}
            </span>
            <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Satoshi',sans-serif" }}>
                {user.name?.split(' ')[0] || 'Athlete'}
              </span>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>@{handle || 'nutriai'}</span>
            </span>
            <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
          </motion.button>
        </div>
      </motion.div>

      {/* ═══ KPI CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>

        {/* Calories */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          style={{ ...glass, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <span style={iconTile('rgba(21, 178, 207,0.16)', '#15B2CF')}><Flame size={19} /></span>
            <span style={cardTitle}>Calories</span>
          </div>
          <div style={{ height: '52px', marginBottom: '8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekChart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="cal" radius={[4, 4, 4, 4]}>
                  {weekChart.map((d, i) => (
                    <Cell key={i} fill={i === weekChart.length - 1 ? '#15B2CF' : 'rgba(21, 178, 207,0.35)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#15B2CF', fontFamily: "'Clash Display',sans-serif", fontVariantNumeric: 'tabular-nums' }}>
            <CountUp end={cals} duration={1.2} separator="," /> <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'Satoshi',sans-serif" }}>Kcal</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>of {goalCals.toLocaleString('en-GB')} goal</div>
        </motion.div>

        {/* Day Score */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.07 }}
          style={{ ...glass, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <span style={iconTile('rgba(46,204,113,0.15)', '#2ECC71')}><Target size={19} /></span>
            <span style={cardTitle}>Day Score</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', marginBottom: '8px' }}>
            <svg width="64" height="64" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--track)" strokeWidth="8" />
              <motion.circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                transform="rotate(-90 36 36)"
                initial={{ strokeDasharray: `0 ${ringC}` }}
                animate={{ strokeDasharray: `${(dayScore / 100) * ringC} ${ringC}` }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor}66)` }} />
              <text x="36" y="42" textAnchor="middle" fill="var(--text-primary)" fontSize="17" fontWeight="700"
                fontFamily="'Clash Display',sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{dayScore}</text>
            </svg>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: scoreColor, fontFamily: "'Clash Display',sans-serif" }}>
            {dayScore}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'Satoshi',sans-serif" }}>/100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.08em', fontWeight: 700 }}>{scoreZone}</div>
        </motion.div>

        {/* Sleep */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.14 }}
          style={{ ...glass, padding: '20px', cursor: 'pointer' }} onClick={() => window.location.href = '/coach'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <span style={iconTile('rgba(59,130,246,0.15)', '#3B82F6')}><Moon size={19} /></span>
            <span style={cardTitle}>Sleep</span>
          </div>
          <div style={{ height: '52px', marginBottom: '8px' }}>
            {last7Nights.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Nights.map(l => ({ h: l.hours }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Bar dataKey="h" radius={[4, 4, 4, 4]}>
                    {last7Nights.map((l, i) => (
                      <Cell key={i} fill={i === last7Nights.length - 1 ? '#3B82F6' : 'rgba(59,130,246,0.35)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '0.72rem' }}>No sleep logged</div>
            )}
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#3B82F6', fontFamily: "'Clash Display',sans-serif", fontVariantNumeric: 'tabular-nums' }}>
            {lastNight ? lastNight.hours.toFixed(1) : '–'} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'Satoshi',sans-serif" }}>hrs/night</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {lastNight ? `Quality ${lastNight.quality || '–'}/5 · tap to log` : 'Tap to log sleep'}
          </div>
        </motion.div>

        {/* Water */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.21 }}
          style={{ ...glass, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <span style={iconTile('rgba(6,182,212,0.15)', '#06B6D4')}><Droplets size={19} /></span>
            <span style={cardTitle}>Water</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', height: '52px', alignItems: 'flex-end', marginBottom: '8px' }}>
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                style={{ flex: 1, borderRadius: '4px', height: `${38 + (i % 3) * 14}%`,
                  background: i < Math.floor(water) ? 'linear-gradient(180deg,#22D3EE,#0891B2)' : 'var(--track)',
                  boxShadow: i < Math.floor(water) ? '0 0 8px rgba(6,182,212,0.4)' : 'none', transformOrigin: 'bottom' }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#06B6D4', fontFamily: "'Clash Display',sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              {Math.floor(water)}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'Satoshi',sans-serif" }}>/8 glasses</span>
            </div>
            <motion.button whileTap={{ scale: 0.92 }} onClick={handleAddWater} disabled={addingWater}
              style={{ border: 'none', borderRadius: '99px', padding: '7px 14px', cursor: addingWater ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg,#06B6D4,#0891B2)', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                opacity: addingWater ? 0.6 : 1 }}>
              {addingWater ? '…' : '+ Add'}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ═══ MAIN + RAIL ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 330px', gap: '16px', marginBottom: '16px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

          {/* Activity Tracking */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.25 }}
            style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={cardTitle}>Activity Tracking</span>
              <span style={{ ...glass, borderRadius: '99px', padding: '6px 14px', fontSize: '0.75rem',
                color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Weekly <ChevronDown size={13} />
              </span>
            </div>
            {weekChart.length > 0 ? (
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekChart} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
                    <defs>
                      <linearGradient id="calFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#15B2CF" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#15B2CF" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tickLine={false} axisLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'Satoshi',sans-serif" }} dy={6} />
                    <YAxis tickLine={false} axisLine={false} width={44}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'Satoshi',sans-serif" }}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                    <Tooltip
                      contentStyle={{ background: 'var(--card-solid)', border: '1px solid var(--card-border)',
                        borderRadius: '14px', boxShadow: 'var(--shadow)', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                      formatter={(v) => [`${Number(v).toLocaleString('en-GB')} kcal`, 'Calories']}
                      labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
                    <Area type="monotone" dataKey="cal" stroke="#15B2CF" strokeWidth={3}
                      fill="url(#calFill)" dot={{ r: 3, fill: '#15B2CF', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#15B2CF', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '0 24px' }}>
                No activity logged this week yet.<br />Log your first meal to start your chart 🔥
              </div>
            )}
          </motion.div>

          {/* Workout hero + macros */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.15fr 1fr', gap: '16px' }}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}
              style={{ ...glass, padding: '22px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={cardTitle}>Today's Mission</div>
                  <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '1.25rem', fontWeight: 700,
                    color: 'var(--text-primary)', margin: '8px 0 10px' }}>Upper Body Strength</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {['⏱ 45 min', '🔥 320 kcal'].map(c => (
                      <span key={c} style={{ background: 'var(--track)', border: '1px solid var(--border)',
                        borderRadius: '99px', padding: '4px 12px', color: 'var(--text-primary)', fontSize: '0.76rem', fontWeight: 600 }}>{c}</span>
                    ))}
                  </div>
                  {['Push Ups 4×12', 'Dumbbell Rows 3×10', 'Shoulder Press 3×10'].map(e => (
                    <div key={e} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)',
                      color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={12} style={{ color: '#15B2CF' }} /> {e}
                    </div>
                  ))}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/workout'}
                    style={{ width: '100%', marginTop: '14px', padding: '12px', border: 'none', borderRadius: '14px',
                      background: 'linear-gradient(135deg,#15B2CF,#4FD3ED)', color: '#fff', fontWeight: 700,
                      fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(21, 178, 207,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Start Workout <ArrowRight size={16} />
                  </motion.button>
                </div>
                <div style={{ flex: '0 1 190px', minWidth: '150px', borderRadius: '18px', overflow: 'hidden',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.25)', alignSelf: 'stretch', minHeight: '220px', position: 'relative' }}>
                  <img src="/images/workout-hero.jpg" alt="Athlete training with resistance band"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg,transparent 40%,rgba(20,12,6,0.55))' }} />
                  <div style={{ position: 'absolute', left: '12px', bottom: '12px', color: '#fff' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: "'Clash Display',sans-serif" }}>12 km</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>This week's distance</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Macros */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.35 }}
              style={{ ...glass, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={cardTitle}>Today's Macros</span>
                <Dumbbell size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              {[
                { label: 'Protein', val: protein, goal: proteinGoal, color: '#15B2CF', unit: 'g' },
                { label: 'Carbs', val: todayNutrition?.carbs || 0, goal: stats?.carbGoal || 250, color: '#7B61FF', unit: 'g' },
                { label: 'Fat', val: todayNutrition?.fat || 0, goal: stats?.fatGoal || 65, color: '#1FA8C9', unit: 'g' },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{m.label}</span>
                    <span style={{ color: m.color, fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {m.val}{m.unit} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {m.goal}{m.unit}</span>
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--track)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (m.val / m.goal) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      style={{ height: '100%', background: m.color, borderRadius: '99px', boxShadow: `0 0 10px ${m.color}55` }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '10px 14px',
                borderRadius: '14px', background: 'rgba(21, 178, 207,0.08)', border: '1px solid rgba(21, 178, 207,0.18)' }}>
                <TrendingUp size={15} style={{ color: '#15B2CF', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {cals < goalCals
                    ? <><b style={{ color: '#15B2CF' }}>{Math.round(goalCals - cals).toLocaleString('en-GB')} kcal</b> left — a healthy snack fits your goal.</>
                    : <>Daily calorie goal reached — nice work.</>}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Diet Plan */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }}
            style={{ ...glass, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '4px', height: '20px', borderRadius: '99px', background: 'linear-gradient(180deg,#15B2CF,#4FD3ED)' }} />
                <span style={{ ...cardTitle, fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 0 }}>Diet Plan</span>
              </div>
              <button onClick={() => window.location.href = '/meals'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                view all <ArrowRight size={14} />
              </button>
            </div>
            {(todayNutrition?.meals?.length || 0) > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
                {todayNutrition.meals.slice(0, 3).map((meal, i) => {
                  const meta = MEAL_META[(meal.mealType || '').toLowerCase()] || MEAL_META.snack
                  return (
                    <motion.div key={i} whileHover={{ y: -4 }} onClick={() => window.location.href = '/meals'}
                      style={{ borderRadius: '18px', overflow: 'hidden', cursor: 'pointer',
                        background: 'var(--card-solid)', border: '1px solid var(--border)',
                        boxShadow: '0 6px 20px var(--shadow-color)' }}>
                      <div style={{ height: '86px', background: meta.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '2.4rem', position: 'relative' }}>
                        {meta.emoji}
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255,255,255,0.85)',
                          borderRadius: '99px', padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700, color: '#1C1917' }}>
                          Day {i + 1}
                        </span>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {meal.name || 'Logged meal'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {meal.calories || 0} kcal · {meal.protein || 0}g protein
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize',
                            color: '#15B2CF', background: 'rgba(21, 178, 207,0.12)', borderRadius: '99px', padding: '3px 10px' }}>
                            {meal.mealType || 'Meal'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div onClick={() => window.location.href = '/meal-logger'}
                style={{ borderRadius: '18px', border: '1.5px dashed var(--border)', padding: '26px', textAlign: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🍽️</div>
                No meals logged today yet.<br />
                <span style={{ color: '#15B2CF', fontWeight: 700 }}>Tap to log your first meal →</span>
              </div>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.45 }}
            style={{ ...glass, padding: '20px 22px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { icon: '📸', label: 'Log Meal', href: '/meal-logger' },
                { icon: '🥦', label: 'Find Recipe', href: '/recipe-maker' },
                { icon: '💬', label: 'Ask AI', href: '/chatbot' },
                { icon: '📅', label: 'Meal Plan', href: '/meal-plan' },
                { icon: '🏋️', label: 'Workout', href: '/workout' },
              ].map(a => (
                <motion.button key={a.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                  onClick={() => window.location.href = a.href}
                  style={{ flex: '1 1 100px', border: '1px solid var(--glass-border)', borderRadius: '16px',
                    background: 'var(--glass-bg)', backdropFilter: 'blur(18px) saturate(1.5)',
                    WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
                    boxShadow: 'var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)',
                    padding: '12px 8px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Badges strip */}
          {realBadges.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.5 }}
              style={{ ...glass, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={cardTitle}>Latest Badges</span>
                <button onClick={() => window.location.href = '/achievements'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7B61FF', fontSize: '0.8rem', fontWeight: 600 }}>
                  View all →
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {realBadges.map(b => (
                  <div key={b.id || b.name} style={{ display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: '16px', padding: '10px 16px 10px 10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>{b.emoji}</span>
                    <span>
                      <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#15B2CF', fontWeight: 700 }}>+{b.xp} XP</span>
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                  borderRadius: '16px', background: 'rgba(21, 178, 207,0.08)', border: '1px solid rgba(21, 178, 207,0.2)' }}>
                  <Zap size={15} style={{ color: '#15B2CF' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    Lv {userXP?.level || 1} · {(userXP?.totalXP || 0).toLocaleString('en-GB')} XP
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ═══ RIGHT RAIL ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

          {/* Profile card */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}
            style={{ ...glass, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#15B2CF,#4FD3ED)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem',
                  boxShadow: '0 6px 16px rgba(21, 178, 207,0.4)' }}>
                  {(user.name || 'A')[0].toUpperCase()}
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user.name}</span>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{handle || 'nutriai'}</span>
                </span>
              </div>
              <button onClick={() => window.location.href = '/profile'}
                style={{ background: 'var(--track)', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', textAlign: 'center' }}>
              {[
                { v: profile?.weight ? `${profile.weight} kg` : '–', l: 'Weight' },
                { v: profile?.height ? `${profile.height} cm` : '–', l: 'Height' },
                { v: age ? `${age} yrs` : '–', l: 'Age' },
              ].map(s => (
                <div key={s.l} style={{ background: 'var(--track)', borderRadius: '14px', padding: '10px 4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.l}</div>
                </div>
              ))}
            </div>
            {(stats?.streak > 0) && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'rgba(21, 178, 207,0.1)', border: '1px solid rgba(21, 178, 207,0.25)', borderRadius: '99px',
                padding: '8px', color: '#15B2CF', fontSize: '0.82rem', fontWeight: 700 }}>
                🔥 {stats.streak} day streak — keep it burning
              </div>
            )}
          </motion.div>

          {/* Calendar */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.35 }}
            style={{ ...glass, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {new Date(calMonth.y, calMonth.m).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[['prev', <ChevronLeft key="l" size={15} />], ['next', <ChevronRight key="r" size={15} />]].map(([dir, icon]) => (
                  <button key={dir} onClick={() => setCalMonth(({ y, m }) => {
                    const d = new Date(y, m + (dir === 'next' ? 1 : -1), 1)
                    return { y: d.getFullYear(), m: d.getMonth() }
                  })}
                    style={{ background: 'var(--track)', border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '6px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
              {(() => {
                const first = new Date(calMonth.y, calMonth.m, 1).getDay()
                const days = new Date(calMonth.y, calMonth.m + 1, 0).getDate()
                const todayStr = new Date().toISOString().split('T')[0]
                const cells = []
                for (let i = 0; i < first; i++) cells.push(<div key={`e${i}`} />)
                for (let d = 1; d <= days; d++) {
                  const ds = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const isToday = ds === todayStr
                  const isSel = ds === selDay
                  const hasSleep = !!sleepByDay[ds]
                  cells.push(
                    <button key={d} onClick={() => setSelDay(ds)}
                      style={{ aspectRatio: '1', border: 'none', borderRadius: '50%', cursor: 'pointer',
                        background: isSel ? '#2ECC71' : isToday ? '#15B2CF' : 'transparent',
                        color: (isSel || isToday) ? '#fff' : 'var(--text-primary)',
                        fontSize: '0.76rem', fontWeight: isToday || isSel ? 700 : 400,
                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isSel ? '0 0 10px rgba(46,204,113,0.5)' : isToday ? '0 0 10px rgba(21, 178, 207,0.5)' : 'none' }}>
                      {d}
                      {hasSleep && !isSel && !isToday && (
                        <span style={{ position: 'absolute', bottom: '3px', width: '4px', height: '4px',
                          borderRadius: '50%', background: '#3B82F6' }} />
                      )}
                    </button>
                  )
                }
                return cells
              })()}
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', minHeight: '20px' }}>
              {sleepByDay[selDay]
                ? <>🌙 {new Date(selDay).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — slept <b style={{ color: 'var(--text-primary)' }}>{sleepByDay[selDay].hours.toFixed(1)}h</b> · quality {sleepByDay[selDay].quality || '–'}/5</>
                : <><span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', marginRight: '6px' }} />Blue dot = sleep logged</>}
            </div>
          </motion.div>

          {/* Scheduled */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }}
            style={{ ...glass, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ width: '4px', height: '20px', borderRadius: '99px', background: 'linear-gradient(180deg,#15B2CF,#4FD3ED)' }} />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Scheduled</span>
            </div>
            {[
              { img: '/images/workout-hero.jpg', tag: 'Fitness', title: 'Cardio Workshop', sub: 'Strengthen your muscles', meta: 'Today · 45 min', href: '/workout' },
              { icon: '🧠', tag: 'Coach', title: 'AI Coach Check-in', sub: 'Readiness & adaptive targets', meta: 'Daily', href: '/coach' },
              { icon: '📊', tag: 'Review', title: 'Weekly Recap', sub: 'Your week in review', meta: 'Sunday', href: '/recap' },
            ].map((s, i) => (
              <motion.div key={s.title} whileHover={{ x: 4 }} onClick={() => window.location.href = s.href}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '16px',
                  cursor: 'pointer', background: i === 0 ? 'var(--track)' : 'transparent', marginBottom: '4px' }}>
                {s.img ? (
                  <img src={s.img} alt="" style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <span style={{ width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                    background: 'var(--track)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{s.icon}</span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, color: '#15B2CF',
                    background: 'rgba(21, 178, 207,0.12)', borderRadius: '99px', padding: '2px 8px', marginBottom: '3px' }}>{s.tag}</span>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.sub} · {s.meta}</span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
