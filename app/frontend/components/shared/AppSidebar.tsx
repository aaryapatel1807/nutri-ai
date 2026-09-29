'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, ScanBarcode, ChefHat, CalendarDays,
  Dumbbell, Bot, Brain, Users, BarChart3, Trophy, ClipboardList, Award,
  Map as MapIcon, Briefcase, User as UserIcon, LogOut, ChevronsLeft,
} from 'lucide-react'
import { UserProfileSidebar } from '@/components/ui/menu'
import api from '@/lib/api'
import useIsMobile from '@/lib/useIsMobile'

const LEVELS = [
  { level: 1,  name: 'Rookie',       minXP: 0     },
  { level: 2,  name: 'Beginner',     minXP: 500   },
  { level: 3,  name: 'Novice',       minXP: 1200  },
  { level: 4,  name: 'Apprentice',   minXP: 2500  },
  { level: 5,  name: 'Intermediate', minXP: 4500  },
  { level: 6,  name: 'Advanced',     minXP: 7000  },
  { level: 7,  name: 'Expert',       minXP: 10000 },
  { level: 8,  name: 'Elite',        minXP: 14000 },
  { level: 9,  name: 'Master',       minXP: 20000 },
  { level: 10, name: 'Legend',       minXP: 30000 },
]

interface NavEntry {
  icon: React.ReactNode
  label: string
  href: string
  isSeparator?: boolean
  isActive?: boolean
}

// Offline-safe avatar: user initials on a warm gradient, as a data URI
function initialsAvatar(name: string): string {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='#15B2CF'/><stop offset='1' stop-color='#7B61FF'/>` +
    `</linearGradient></defs>` +
    `<rect width='96' height='96' rx='48' fill='url(#g)'/>` +
    `<text x='48' y='63' font-family='sans-serif' font-size='34' font-weight='bold' fill='white' text-anchor='middle'>${initials}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function AppSidebar({ mobileOpen = false, onNavigate = () => {}, collapsed = false, onToggleCollapse = () => {} }: {
  mobileOpen?: boolean
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [profile, setProfile] = useState({ name: 'User', email: '' })
  const [xpData, setXpData] = useState({ totalXP: 0, level: 1, levelName: 'Rookie', nextLevelXP: 500 })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nutriai_user')
      if (raw && raw !== 'undefined') {
        const parsed = JSON.parse(raw)
        setProfile({ name: parsed.name || 'User', email: parsed.email || '' })
      }
    } catch (e) { /* keep defaults */ }

    api.get('/api/badges/xp')
      .then((res: any) => { if (res.data) setXpData(res.data) })
      .catch(() => {}) // silent fail — sidebar still renders
  }, [])

  const currentLevelData = LEVELS.find(l => l.level === xpData.level) || LEVELS[0]
  const nextLevelData = LEVELS.find(l => l.minXP > xpData.totalXP) || LEVELS[LEVELS.length - 1]
  const xpProgress = nextLevelData.minXP > currentLevelData.minXP
    ? ((xpData.totalXP - currentLevelData.minXP) / (nextLevelData.minXP - currentLevelData.minXP)) * 100
    : 100

  const icon = (C: any) => <C className="h-full w-full" />
  const navItems: NavEntry[] = [
    { icon: icon(LayoutDashboard), label: 'Dashboard', href: '/dashboard' },
    { icon: icon(UtensilsCrossed), label: 'Log Meal', href: '/meal-logger', isSeparator: true },
    { icon: icon(ScanBarcode), label: 'Barcode', href: '/barcode' },
    { icon: icon(ChefHat), label: 'Recipes', href: '/recipe-maker' },
    { icon: icon(CalendarDays), label: 'Meal Plan', href: '/meal-plan' },
    { icon: icon(Dumbbell), label: 'Workout', href: '/workout', isSeparator: true },
    { icon: icon(Bot), label: 'AI Coach', href: '/chatbot', isSeparator: true },
    { icon: icon(Brain), label: 'Adaptive Coach', href: '/coach' },
    { icon: icon(Users), label: 'Community', href: '/community', isSeparator: true },
    { icon: icon(BarChart3), label: 'Recap', href: '/recap', isSeparator: true },
    { icon: icon(Trophy), label: 'Achievements', href: '/achievements' },
    { icon: icon(ClipboardList), label: 'Quizzes', href: '/quizzes' },
    { icon: icon(Award), label: 'Certificates', href: '/certificates' },
    { icon: icon(MapIcon), label: 'Roadmap', href: '/roadmap' },
    { icon: icon(Briefcase), label: 'Careers', href: '/careers' },
    { icon: icon(UserIcon), label: 'Profile', href: '/profile', isSeparator: true },
  ].map(item => ({ ...item, isActive: pathname === item.href }))

  const handleLogout = () => {
    localStorage.removeItem('nutriai_token')
    localStorage.removeItem('nutriai_user')
    onNavigate()
    router.push('/login')
  }

  // Desktop: collapsing slides the sidebar off to the left, freeing the full
  // viewport for the dashboard. Mobile keeps its drawer behaviour.
  const sidebarHidden = isMobile ? !mobileOpen : collapsed

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          onClick={onNavigate}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
        />
      )}
      <div
        className="app-chrome"
        aria-hidden={sidebarHidden}
        style={{
          left: 0,
          top: 0,
          width: '260px',
          height: '100vh',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--glass-border)',
          transform: isMobile
            ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)')
            : (collapsed ? 'translateX(-105%)' : 'translateX(0)'),
          transition: 'transform 0.3s ease, visibility 0s linear',
          transitionDelay: sidebarHidden ? '0s, 0.3s' : '0s, 0s',
          visibility: sidebarHidden ? 'hidden' : 'visible',
        }}
      >
        {/* Collapse affordance straddling the sidebar edge (desktop only) */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            aria-label="Minimise sidebar"
            title="Minimise sidebar"
            tabIndex={sidebarHidden ? -1 : 0}
            style={{
              position: 'absolute',
              top: '72px',
              right: '-15px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 101,
              boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
              padding: 0,
            }}
          >
            <ChevronsLeft size={16} />
          </button>
        )}
        <UserProfileSidebar
          user={{ name: profile.name, email: profile.email, avatarUrl: initialsAvatar(profile.name) }}
          navItems={navItems}
          logoutItem={{ icon: icon(LogOut), label: 'Log out', onClick: handleLogout }}
          className="flex-1 min-h-0 w-full max-w-none bg-transparent border-0 shadow-none rounded-none overflow-y-auto"
        />
        {/* XP footer */}
        <div style={{ padding: '14px 20px 18px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '0.8rem',
            color: '#FFD700',
            marginBottom: '6px'
          }}>
            🌟 Level {xpData.level} — {xpData.levelName || currentLevelData.name}
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, xpProgress)}%`,
              background: 'linear-gradient(90deg, #15B2CF, #4FD3ED)',
              borderRadius: '99px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {(xpData.totalXP || 0).toLocaleString()} / {nextLevelData.minXP.toLocaleString()} XP
          </div>
        </div>
      </div>
    </>
  )
}
