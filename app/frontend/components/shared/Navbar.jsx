'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { glowPulse } from '../../lib/animations'
import api from '../../lib/api'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Navbar() {
  const [userName, setUserName]     = useState('User')
  const [userInitials, setUserInitials] = useState('U')
  const [streak, setStreak]         = useState(0)
  const [tip, setTip]               = useState(null)

  useEffect(() => {
    try {
      const user = localStorage.getItem('nutriai_user')
      if (user && user !== 'undefined') {
        const parsed = JSON.parse(user)
        const name = parsed.name || 'User'
        setUserName(name)
        setUserInitials(name.split(' ').map(n => n[0]).join('').toUpperCase())
      }
    } catch (e) {}

    // Load real streak from stats API
    api.get('/api/stats')
      .then(res => {
        if (res.data?.streak !== undefined) setStreak(res.data.streak)
      })
      .catch(() => {})

    // Load today nutrition for tip
    api.get('/api/meals/today')
      .then(res => {
        const data = res.data
        const cal     = Math.round(data.totalCalories || 0)
        const goal    = 2000 // fallback; ideally from user profile
        const diff    = goal - cal
        if (diff > 300) {
          setTip(`You're ${diff} kcal under goal. Consider a healthy snack!`)
        } else if (diff < -200) {
          setTip(`You're ${Math.abs(diff)} kcal over goal. Stay active!`)
        } else {
          setTip('Great job! You\'re on track with your calorie goal.')
        }
      })
      .catch(() => {
        setTip('Track your meals to get personalized tips!')
      })
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '260px',
      right: 0,
      height: '64px',
      background: 'rgba(10,10,15,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Left Side */}
        <div>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.2rem', color: 'white', margin: 0 }}>
            {getGreeting()}, {userName.split(' ')[0]} 👋
          </h1>
          {tip && (
            <div style={{ marginTop: '4px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: '2px solid #7B61FF',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '0.8rem' }}>🤖</span>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{tip}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Streak */}
          {streak > 0 && (
            <div style={{
              padding: '4px 12px',
              borderRadius: '99px',
              background: 'rgba(255,107,53,0.1)',
              color: '#FF6B35',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid rgba(255,107,53,0.2)'
            }}>
              🔥 {streak}
            </div>
          )}

          {/* Bell Icon */}
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Bell size={20} />
          </button>

          {/* Avatar */}
          <motion.div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00FF87, #7B61FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(0,255,135,0.5)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
            animate={glowPulse.animate}
            transition={glowPulse.transition}
          >
            {userInitials}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
