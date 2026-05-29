'use client'
import { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import api from '../../lib/api'

const navItems = [
  { icon: '⊞', label: 'Dashboard',    href: '/dashboard'    },
  { icon: '🍽', label: 'Log Meal',     href: '/meal-logger'  },
  { icon: '👨‍🍳', label: 'Recipes',     href: '/recipe-maker' },
  { icon: '💪', label: 'Workout',      href: '/workout'      },
  { icon: '📅', label: 'Meal Plan',    href: '/meal-plan'    },
  { icon: '🤖', label: 'AI Coach',     href: '/chatbot'      },
  { icon: '🏆', label: 'Achievements', href: '/achievements' },
  { icon: '�', label: 'Quizzes',      href: '/quizzes'      },
  { icon: '📜', label: 'Certificates', href: '/certificates' },
  { icon: '🗺️', label: 'Roadmap',      href: '/roadmap'      },
  { icon: '🌟', label: 'Careers',      href: '/careers'      },
  { icon: '�👤', label: 'Profile',      href: '/profile'      },
]

const LEVELS = [
  { level:1,  name:'Rookie',       minXP:0     },
  { level:2,  name:'Beginner',     minXP:500   },
  { level:3,  name:'Novice',       minXP:1200  },
  { level:4,  name:'Apprentice',   minXP:2500  },
  { level:5,  name:'Intermediate', minXP:4500  },
  { level:6,  name:'Advanced',     minXP:7000  },
  { level:7,  name:'Expert',       minXP:10000 },
  { level:8,  name:'Elite',        minXP:14000 },
  { level:9,  name:'Master',       minXP:20000 },
  { level:10, name:'Legend',       minXP:30000 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [userName, setUserName]       = useState('User')
  const [userInitials, setUserInitials] = useState('U')
  const [xpData, setXpData]           = useState({ totalXP: 0, level: 1, levelName: 'Rookie', nextLevelXP: 500 })

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

    // Load real XP from API
    api.get('/api/badges/xp')
      .then(res => {
        if (res.data) setXpData(res.data)
      })
      .catch(() => {}) // silent fail — sidebar still renders
  }, [])

  const currentLevelData = LEVELS.find(l => l.level === xpData.level) || LEVELS[0]
  const nextLevelData    = LEVELS.find(l => l.minXP > xpData.totalXP) || LEVELS[LEVELS.length - 1]
  const xpProgress = nextLevelData.minXP > currentLevelData.minXP
    ? ((xpData.totalXP - currentLevelData.minXP) / (nextLevelData.minXP - currentLevelData.minXP)) * 100
    : 100

  const navItemsRendered = useMemo(() => {
    return navItems.map((item) => {
      const isActive = pathname === item.href
      return (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '12px',
              color: isActive ? '#00FF87' : '#6B7280',
              background: isActive ? 'rgba(0,255,135,0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid #00FF87' : '3px solid transparent',
              fontSize: '0.9rem',
              fontFamily: "'Satoshi', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '4px'
            }}
            className="nav-item"
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(0,255,135,0.08)'
                e.currentTarget.style.color = '#00FF87'
                e.currentTarget.style.transform = 'translateX(2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#6B7280'
                e.currentTarget.style.transform = 'translateX(0)'
              }
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        </Link>
      )
    })
  }, [pathname])

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '260px',
      height: '100vh',
      background: 'rgba(10,10,15,0.98)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "'Clash Display', sans-serif",
        fontSize: '1.4rem',
        color: 'white',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '1.6rem' }}>🥗</span>
        <span>NutriAI</span>
      </div>

      {/* Navigation */}
      <nav>{navItemsRendered}</nav>

      {/* Bottom Section */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* XP Bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '0.8rem',
            color: '#FFD700',
            marginBottom: '6px'
          }}>
            🌟 Level {xpData.level} — {xpData.levelName || currentLevelData.name}
          </div>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '99px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, xpProgress)}%`,
              background: 'linear-gradient(90deg, #00FF87, #00D4FF)',
              borderRadius: '99px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#6B7280' }}>
            {xpData.totalXP?.toLocaleString() || 0} / {nextLevelData.minXP.toLocaleString()} XP
          </div>
        </div>

        {/* User Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00FF87, #7B61FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: '2px solid rgba(0,255,135,0.4)',
            flexShrink: 0
          }}>
            {userInitials}
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500 }}>{userName}</div>
            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{xpData.levelName || 'Health Hero'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
