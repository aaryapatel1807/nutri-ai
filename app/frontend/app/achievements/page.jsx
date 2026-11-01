'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import api from '../../lib/api'
import useIsMobile from '../../lib/useIsMobile'
import ScenicBackdrop from '@/components/shared/ScenicBackdrop'


const LEVELS = [
  { level:1,  name:'Rookie',         minXP:0,     maxXP:500,   color:'var(--text-muted)', emoji:'🌱' },
  { level:2,  name:'Beginner',       minXP:500,   maxXP:1200,  color:'#9DCE2C', emoji:'🌿' },
  { level:3,  name:'Novice',         minXP:1200,  maxXP:2500,  color:'#22D3EE', emoji:'⚡' },
  { level:4,  name:'Apprentice',     minXP:2500,  maxXP:4500,  color:'#15B2CF', emoji:'💫' },
  { level:5,  name:'Intermediate',   minXP:4500,  maxXP:7000,  color:'#7B61FF', emoji:'🔥' },
  { level:6,  name:'Advanced',       minXP:7000,  maxXP:10000, color:'#A78BFA', emoji:'💎' },
  { level:7,  name:'Expert',         minXP:10000, maxXP:14000, color:'#FFB020', emoji:'🏆' },
  { level:8,  name:'Elite',          minXP:14000, maxXP:20000, color:'#FF6B5E', emoji:'⭐' },
  { level:9,  name:'Master',         minXP:20000, maxXP:30000, color:'#FFD700', emoji:'👑' },
  { level:10, name:'Legend',         minXP:30000, maxXP:999999,color:'#FF6B5E', emoji:'🌟' },
]

const RARITY_CONFIG = {
  Common:    { color:'var(--text-muted)', bg:'rgba(156,163,175,0.1)', border:'rgba(156,163,175,0.3)', glow:'rgba(156,163,175,0.2)', stars:1 },
  Rare:      { color:'#4FD3ED', bg:'rgba(79,211,237,0.1)',   border:'rgba(79,211,237,0.3)',   glow:'rgba(79,211,237,0.3)',   stars:2 },
  Epic:      { color:'#7B61FF', bg:'rgba(123,97,255,0.1)',  border:'rgba(123,97,255,0.3)',  glow:'rgba(123,97,255,0.4)',  stars:3 },
  Legendary: { color:'#FFD700', bg:'rgba(255,215,0,0.1)',   border:'rgba(255,215,0,0.4)',   glow:'rgba(255,215,0,0.5)',   stars:4 },
  Mythic:    { color:'#FF6B5E', bg:'rgba(255,107,94,0.15)', border:'rgba(255,107,94,0.5)',  glow:'rgba(255,107,94,0.6)',  stars:5 },
}

const CATEGORIES = ['All','Nutrition','Fitness','Streak','Body','Special']
const FILTERS    = ['All','Unlocked','Locked']

// 3D Tilt card hook
function useTilt() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-50,50], [10,-10])
  const rotateY = useTransform(x, [-50,50], [-10,10])
  const springX = useSpring(rotateX, { stiffness:200, damping:20 })
  const springY = useSpring(rotateY, { stiffness:200, damping:20 })
  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width/2)
    y.set(e.clientY - rect.top - rect.height/2)
  }
  const handleLeave = () => { x.set(0); y.set(0) }
  return { rotateX:springX, rotateY:springY, handleMouse, handleLeave }
}

// Confetti component
function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length:60 }, (_,i) => ({
    id:i, color:['#FF6B5E','#FFB020','#7B61FF','#9DCE2C','#22D3EE','#FF6B5E'][i%6],
    x: Math.random()*100, delay: Math.random()*0.5,
    size: Math.random()*8+4, rotation: Math.random()*360
  }))

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:999, overflow:'hidden' }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y:-20, x:`${p.x}vw`, opacity:1, rotate:0 }}
          animate={{ y:'110vh', opacity:[1,1,0], rotate:p.rotation+720 }}
          transition={{ duration:2.5+Math.random(), delay:p.delay, ease:'easeIn' }}
          style={{
            position:'absolute', top:0,
            width:p.size, height:p.size,
            background:p.color, borderRadius:Math.random()>0.5?'50%':'2px',
            boxShadow:`0 0 6px ${p.color}` 
          }}
        />
      ))}
    </div>
  )
}

// Single Badge Card with 3D tilt
function BadgeCard({ badge, onClick, index }) {
  const tilt = useTilt()
  const rarity = RARITY_CONFIG[badge.rarity]
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity:0, y:40, scale:0.8 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:index*0.04, type:'spring', stiffness:200, damping:18 }}
      onClick={() => onClick(badge)}
      onMouseMove={tilt.handleMouse}
      onMouseLeave={() => { tilt.handleLeave(); setHovered(false) }}
      onMouseEnter={() => setHovered(true)}
      style={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformStyle:'preserve-3d',
        perspective:1000,
        cursor:'pointer',
      }}
    >
      <motion.div
        animate={hovered ? { scale:1.05 } : { scale:1 }}
        transition={{ duration:0.2 }}
        style={{
          background: badge.unlocked ? rarity.bg : 'rgba(10,10,18,0.8)',
          backdropFilter:'blur(20px)',
          border:`1px solid ${badge.unlocked ? rarity.border : 'var(--border)'}`,
          borderRadius:'20px',
          padding:'20px',
          boxShadow: hovered && badge.unlocked
            ? `0 20px 60px ${rarity.glow}, 0 0 0 1px ${rarity.color}30, inset 0 1px 0 var(--border)` 
            : `0 4px 20px var(--shadow-color)`,
          transition:'box-shadow 0.3s',
          overflow:'hidden',
          position:'relative',
        }}
      >
        {/* Shimmer on hover for unlocked */}
        {badge.unlocked && hovered && (
          <motion.div
            initial={{ x:'-100%', opacity:0 }}
            animate={{ x:'200%', opacity:[0,0.3,0] }}
            transition={{ duration:0.8 }}
            style={{
              position:'absolute', top:0, left:0,
              width:'50%', height:'100%',
              background:'linear-gradient(90deg,transparent,var(--track),transparent)',
              transform:'skewX(-20deg)', pointerEvents:'none', zIndex:10
            }}
          />
        )}

        {/* Rarity glow bg */}
        {badge.unlocked && (
          <div style={{
            position:'absolute', top:'-20px', right:'-20px',
            width:'80px', height:'80px', borderRadius:'50%',
            background:`radial-gradient(circle, ${rarity.color}25 0%, transparent 70%)`,
            pointerEvents:'none'
          }}/>
        )}

        {/* Top row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
          <motion.div
            animate={badge.unlocked && hovered ? {
              scale:[1,1.3,1.1],
              rotate:[0,15,-10,0],
              filter:[`drop-shadow(0 0 8px ${rarity.color})`, `drop-shadow(0 0 20px ${rarity.color})`, `drop-shadow(0 0 12px ${rarity.color})`]
            } : {}}
            transition={{ duration:0.5 }}
            style={{
              fontSize:'2.8rem',
              filter: badge.unlocked ? `drop-shadow(0 0 8px ${rarity.color})` : 'grayscale(1) opacity(0.3)',
              transform:'translateZ(20px)',
            }}
          >{badge.emoji}</motion.div>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
            <span style={{
              background: badge.unlocked ? rarity.bg : 'var(--border)',
              border:`1px solid ${badge.unlocked ? rarity.border : 'var(--border)'}`,
              borderRadius:'99px', padding:'2px 10px',
              color: badge.unlocked ? rarity.color : '#4B5563',
              fontSize:'0.65rem', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'0.05em'
            }}>{badge.rarity}</span>
            {/* Stars */}
            <div style={{ display:'flex', gap:'2px' }}>
              {[...Array(rarity.stars)].map((_,i) => (
                <motion.span
                  key={i}
                  animate={badge.unlocked && hovered ? { scale:[1,1.4,1], opacity:[1,0.6,1] } : {}}
                  transition={{ delay:i*0.1, duration:0.4 }}
                  style={{ fontSize:'0.6rem', color: badge.unlocked ? rarity.color : '#1F2937' }}
                >★</motion.span>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          fontFamily:"'Clash Display',sans-serif",
          color: badge.unlocked ? 'white' : '#4B5563',
          fontSize:'0.9rem', fontWeight:700,
          marginBottom:'4px', transform:'translateZ(10px)'
        }}>{badge.name}</div>

        <div style={{
          color: badge.unlocked ? 'var(--text-muted)' : '#374151',
          fontSize:'0.72rem', marginBottom:'12px',
          lineHeight:1.4, transform:'translateZ(8px)'
        }}>{badge.desc}</div>

        {/* Progress or unlocked */}
        {badge.unlocked ? (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{
              background:`${rarity.color}15`,
              border:`1px solid ${rarity.color}30`,
              borderRadius:'99px', padding:'3px 10px',
              color:rarity.color, fontSize:'0.7rem', fontWeight:700,
              display:'flex', alignItems:'center', gap:'4px'
            }}>✓ Unlocked {badge.unlockDate}</span>
            <span style={{
              color:rarity.color, fontSize:'0.78rem', fontWeight:700
            }}>+{badge.xp} XP</span>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
              <span style={{ color:'var(--text-muted)', fontSize:'0.7rem' }}>Progress</span>
              <span style={{ color:rarity.color, fontSize:'0.7rem', fontWeight:700 }}>{badge.progress}%</span>
            </div>
            <div style={{
              height:'6px', background:'var(--border)',
              borderRadius:'99px', overflow:'hidden', position:'relative'
            }}>
              <motion.div
                initial={{ width:0 }}
                animate={{ width:`${badge.progress}%` }}
                transition={{ duration:0.8, delay:0.2 }}
                style={{
                  height:'100%', background:rarity.color,
                  borderRadius:'99px', boxShadow:`0 0 8px ${rarity.color}40`
                }}
              />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'6px' }}>
              <span style={{ color:'#4B5563', fontSize:'0.65rem' }}>{badge.xp} XP</span>
              <span style={{ color:'var(--text-muted)', fontSize:'0.65rem' }}>Keep going!</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function Achievements() {
  const isMobile = useIsMobile()
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeFilter, setActiveFilter] = useState('All')
  const [showConfetti, setShowConfetti] = useState(false)
  const [userXP, setUserXP] = useState(0)
  const [levelInfo, setLevelInfo] = useState({ level: 1, levelName: 'Rookie', nextLevelXP: 500 })
  const [streak, setStreak] = useState(0)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Sidebar-aware modal: on desktop with the sidebar open (260px), the fixed
  // badge modal must start after the sidebar instead of sliding underneath it.
  const modalLeft = (() => {
    if (isMobile) return 0
    try { return localStorage.getItem('nutriai_sidebar_collapsed') === '1' ? 0 : 260 } catch (e) { return 0 }
  })()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [xpRes, badgesRes, statsRes] = await Promise.all([
          api.get('/api/badges/xp'),
          api.get('/api/badges'),
          api.get('/api/stats')
        ])
        setUserXP(xpRes.data.totalXP)
        setLevelInfo({
          level: xpRes.data.level,
          levelName: xpRes.data.levelName,
          nextLevelXP: xpRes.data.nextLevelXP
        })
        // Map the real API shape onto the card's shape: the API returns
        // `description` / `unlocked` / `unlockedAt`, while the card reads
        // `desc` / `progress` / `unlockDate`. Mapping here (not in the card)
        // also fixes the search crash on badge.desc.
        setBadges((Array.isArray(badgesRes.data) ? badgesRes.data : []).map(b => ({
          ...b,
          desc: b.description ?? b.desc ?? '',
          progress: b.unlocked ? 100 : 0,
          unlockDate: b.unlockedAt
            ? new Date(b.unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
        })))
        setStreak(statsRes.data.streak)
      } catch (err) {
        console.error('Failed to load achievements:', err)
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculate user level
  const currentLevel = LEVELS.find(l => l.level === levelInfo.level) || LEVELS[0]
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1)
  const progressToNext = nextLevel ? ((userXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 : 100

  // Filter badges
  const filteredBadges = badges.filter(badge => {
    const categoryMatch = activeCategory === 'All' || badge.category === activeCategory
    const filterMatch = activeFilter === 'All' || 
      (activeFilter === 'Unlocked' && badge.unlocked) || 
      (activeFilter === 'Locked' && !badge.unlocked)
    const searchMatch = (badge.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (badge.desc || '').toLowerCase().includes(searchTerm.toLowerCase())
    return categoryMatch && filterMatch && searchMatch
  })

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge)
    if (badge.unlocked && !showConfetti) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  // Real badges only — no mock fallback. An empty API response means the
  // user genuinely has no badges yet, not 16 fake unlocked ones.
  const currentBadges = badges
  const stats = {
    total: currentBadges.length,
    unlocked: currentBadges.filter(b => b.unlocked).length,
    totalXP: currentBadges.filter(b => b.unlocked).reduce((sum, b) => sum + b.xp, 0),
    rare: currentBadges.filter(b => b.unlocked && ['Rare','Epic','Legendary','Mythic'].includes(b.rarity)).length
  }

  const card = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(26px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(26px) saturate(1.6)',
    border: '1px solid var(--glass-border)',
    borderRadius: '26px',
    overflow:'hidden',
  }

  if (loading) {
    return (
      <div style={{ width:'100%', minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2rem', marginBottom:'12px' }}>🏆</div>
          <div>Loading your achievements...</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ width:'100%', minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', maxWidth:'380px', padding:'0 20px' }}>
          <div style={{ fontSize:'2rem', marginBottom:'12px' }}>😕</div>
          <div style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:'8px' }}>Couldn't load achievements</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'20px' }}>
            Check your connection and try again — your badges are safe.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding:'12px 28px', borderRadius:'99px', border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#FF6B5E,#FFB020)', color:'#fff', fontWeight:700, fontSize:'0.9rem' }}
          >Try Again</button>
        </div>
      </div>
    )
  }

  return (
      <div style={{ width:'100%', position:'relative', zIndex:1 }}>
        <ScenicBackdrop />

        <div style={{ position:'relative', zIndex:1 }}>

          {/* HEADER */}
          <motion.div
            initial={{ opacity:0, y:-20 }}
            animate={{ opacity:1, y:0 }}
            style={{ marginBottom:'32px' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'20px' }}>
              <div>
                <h1 style={{
                  fontFamily:"'Clash Display',sans-serif",
                  fontSize:'2.8rem', fontWeight:800,
                  margin:0, marginBottom:'8px',
                  background:'linear-gradient(135deg,#FFD700 0%,#FF6B5E 50%,#7B61FF 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                }}>Achievements 🏆</h1>
                <p style={{ color:'var(--text-muted)', margin:0, fontSize:'1rem' }}>
                  Track your fitness journey, unlock badges, and climb leaderboard
                </p>
              </div>
              
              {/* User Level Card */}
              <motion.div
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay:0.2 }}
                style={{
                  ...card,
                  padding:'24px',
                  minWidth:'280px',
                  background:`linear-gradient(135deg, ${currentLevel.color}15 0%, transparent 100%)`,
                  border:`1px solid ${currentLevel.color}30`
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px' }}>
                  <motion.div
                    animate={{ rotate:[0,10,-10,0] }}
                    transition={{ duration:4, repeat:Infinity }}
                    style={{ fontSize:'3rem', filter:`drop-shadow(0 0 12px ${currentLevel.color})` }}
                  >{currentLevel.emoji}</motion.div>
                  <div>
                    <div style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:'2px' }}>Level {currentLevel.level}</div>
                    <div style={{
                      fontFamily:"'Clash Display',sans-serif",
                      color:currentLevel.color, fontSize:'1.4rem', fontWeight:800
                    }}>{currentLevel.name}</div>
                  </div>
                </div>
                
                <div style={{ marginBottom:'12px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{userXP.toLocaleString()} XP</span>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>
                      {nextLevel ? `${nextLevel.minXP - userXP} to next` : 'Max Level'}
                    </span>
                  </div>
                  <div style={{
                    height:'8px', background:'var(--border)',
                    borderRadius:'99px', overflow:'hidden', position:'relative'
                  }}>
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:`${progressToNext}%` }}
                      transition={{ duration:1.2, delay:0.4 }}
                      style={{
                        height:'100%', background:currentLevel.color,
                        borderRadius:'99px', boxShadow:`0 0 12px ${currentLevel.color}40`
                      }}
                    />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px' }}>
                  {[
                    { label:'Badges', val:stats.unlocked, total:stats.total, color:'#FFB020' },
                    { label:'Rare+', val:stats.rare, total:stats.unlocked, color:'#7B61FF' },
                    { label:'Streak', val:streak, total:'days', color:'#9DCE2C' },
                    { label:'Rank', val:'#6', total:'global', color:'#FFD700' }
                  ].map((stat, i) => (
                    <div key={i} style={{ textAlign:'center' }}>
                      <div style={{ color:stat.color, fontSize:'1.1rem', fontWeight:700 }}>{stat.val}</div>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.65rem' }}>
                        {stat.label} {stat.total && `/ ${stat.total}`}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* FILTERS AND SEARCH */}
          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.1 }}
            style={{ marginBottom:'24px' }}
          >
            <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap', marginBottom:'16px' }}>
              {/* Search */}
              <div style={{ flex:1, minWidth:'200px', position:'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search achievements..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width:'100%', padding:'12px 16px 12px 42px',
                    background:'var(--border)',
                    border:'1px solid var(--border)',
                    borderRadius:'14px',
                    color:'var(--text-primary)', fontSize:'0.9rem',
                    outline:'none', fontFamily:"'Satoshi',sans-serif"
                  }}
                />
                <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'1.1rem' }}>🔍</span>
              </div>

              {/* Category Filter */}
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {CATEGORIES.map(cat => (
                  <motion.button
                    key={cat}
                    whileHover={{ scale:1.05 }}
                    whileTap={{ scale:0.95 }}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      background: activeCategory === cat ? '#7B61FF' : 'var(--border)',
                      border: activeCategory === cat ? '1px solid #7B61FF' : '1px solid var(--border)',
                      borderRadius:'20px', padding:'8px 16px',
                      color: activeCategory === cat ? '#000' : 'var(--text-muted)',
                      fontSize:'0.85rem', fontWeight:600, cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >{cat}</motion.button>
                ))}
              </div>

              {/* Status Filter */}
              <div style={{ display:'flex', gap:'6px' }}>
                {FILTERS.map(filter => (
                  <motion.button
                    key={filter}
                    whileHover={{ scale:1.05 }}
                    whileTap={{ scale:0.95 }}
                    onClick={() => setActiveFilter(filter)}
                    style={{
                      background: activeFilter === filter ? 'linear-gradient(135deg,#FF6B5E,#FFB020)' : 'var(--border)',
                      border: activeFilter === filter ? '1px solid #FF6B5E' : '1px solid var(--border)',
                      borderRadius:'20px', padding:'8px 16px',
                      color: activeFilter === filter ? '#000' : 'var(--text-muted)',
                      fontSize:'0.85rem', fontWeight:600, cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >{filter}</motion.button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>
              Showing {filteredBadges.length} of {badges.length} achievements
            </div>
          </motion.div>

          {/* MAIN GRID */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap:'20px' }}>

            {/* BADGES GRID */}
            <div>
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                gap:'16px'
              }}>
                {filteredBadges.length === 0 && (
                  <div style={{ gridColumn:'1 / -1', textAlign:'center', padding:'48px 20px', color:'var(--text-muted)' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>{badges.length === 0 ? '🌱' : '🔍'}</div>
                    <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:'8px' }}>
                      {badges.length === 0 ? 'No badges yet' : 'No achievements match'}
                    </div>
                    <div style={{ fontSize:'0.85rem' }}>
                      {badges.length === 0
                        ? 'Log your first meal or finish a workout to start earning badges.'
                        : 'Try adjusting your filters or search terms.'}
                    </div>
                  </div>
                )}
                {filteredBadges.map((badge, index) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onClick={handleBadgeClick}
                    index={index}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

              {/* ACTIVE CHALLENGES */}
              <motion.div
                initial={{ opacity:0, x:20 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.3 }}
                style={{ ...card, padding:'20px' }}
              >
                <div style={{
                  fontFamily:"'Clash Display',sans-serif",
                  color: 'var(--text-primary)', fontSize:'1rem', fontWeight:700,
                  marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px'
                }}>
                  ⚡ Active Challenges
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {CHALLENGES.slice(0,4).map((challenge, i) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity:0, x:20 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay:0.4 + i*0.1 }}
                      whileHover={{ x:4 }}
                      style={{
                        background:'var(--border)',
                        border:'1px solid var(--border)',
                        borderRadius:'12px', padding:'12px',
                        cursor:'pointer'
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                        <span style={{ fontSize:'1.2rem' }}>{challenge.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{
                            color: 'var(--text-primary)', fontSize:'0.85rem', fontWeight:600,
                            marginBottom:'2px'
                          }}>{challenge.name}</div>
                          <div style={{ color:'var(--text-muted)', fontSize:'0.7rem' }}>{challenge.desc}</div>
                        </div>
                      </div>
                      <div style={{ marginBottom:'8px' }}>
                        <div style={{
                          height:'4px', background:'var(--border)',
                          borderRadius:'99px', overflow:'hidden'
                        }}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${(challenge.progress/challenge.total)*100}%` }}
                            transition={{ duration:0.8, delay:0.5 + i*0.1 }}
                            style={{
                              height:'100%', background:challenge.color,
                              borderRadius:'99px'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ color:challenge.color, fontSize:'0.75rem', fontWeight:600 }}>
                          {challenge.progress}/{challenge.total}
                        </span>
                        <span style={{ color:'#FFD700', fontSize:'0.75rem', fontWeight:600 }}>
                          +{challenge.xp} XP
                        </span>
                      </div>
                      <div style={{
                        marginTop:'6px',
                        color:challenge.type === 'Daily' ? '#FFB020' : '#22D3EE',
                        fontSize:'0.65rem', fontWeight:600
                      }}>
                        {challenge.deadline}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </div>

        {/* BADGE DETAIL MODAL */}
        <AnimatePresence>
          {selectedBadge && (
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              onClick={() => setSelectedBadge(null)}
              style={{
                position:'fixed', top:0, right:0, bottom:0, left:modalLeft, zIndex:999,
                background:'var(--shadow-color)', backdropFilter:'blur(8px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:'20px'
              }}
            >
              <motion.div
                initial={{ opacity:0, scale:0.8, y:50 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.8, y:50 }}
                onClick={e => e.stopPropagation()}
                style={{
                  ...card,
                  width:'100%',
                  padding:'32px',
                  background: selectedBadge.unlocked 
                    ? RARITY_CONFIG[selectedBadge.rarity].bg 
                    : 'rgba(10,10,18,0.95)',
                  border: selectedBadge.unlocked 
                    ? `1px solid ${RARITY_CONFIG[selectedBadge.rarity].border}` 
                    : '1px solid var(--border)'
                }}
              >
                <div style={{ textAlign:'center', marginBottom:'24px' }}>
                  <motion.div
                    animate={selectedBadge.unlocked ? {
                      scale:[1,1.3,1.1],
                      rotate:[0,15,-10,0]
                    } : {}}
                    transition={{ duration:0.6 }}
                    style={{
                      fontSize:'4rem',
                      filter: selectedBadge.unlocked 
                        ? `drop-shadow(0 0 20px ${RARITY_CONFIG[selectedBadge.rarity].color})` 
                        : 'grayscale(1) opacity(0.3)',
                      marginBottom:'16px'
                    }}
                  >{selectedBadge.emoji}</motion.div>
                  <div style={{
                    fontFamily:"'Clash Display',sans-serif",
                    color: selectedBadge.unlocked ? 'white' : '#4B5563',
                    fontSize:'1.6rem', fontWeight:800, marginBottom:'8px'
                  }}>{selectedBadge.name}</div>
                  <div style={{
                    color: selectedBadge.unlocked ? RARITY_CONFIG[selectedBadge.rarity].color : 'var(--text-muted)',
                    fontSize:'0.9rem', fontWeight:700, marginBottom:'4px'
                  }}>{selectedBadge.rarity} • {selectedBadge.category}</div>
                  <div style={{
                    color: selectedBadge.unlocked ? 'var(--text-muted)' : '#374151',
                    fontSize:'1rem', lineHeight:1.6
                  }}>{selectedBadge.desc}</div>
                </div>

                {selectedBadge.unlocked ? (
                  <div style={{
                    background:`${RARITY_CONFIG[selectedBadge.rarity].color}15`,
                    border:`1px solid ${RARITY_CONFIG[selectedBadge.rarity].color}30`,
                    borderRadius:'12px', padding:'16px',
                    textAlign:'center', marginBottom:'20px'
                  }}>
                    <div style={{
                      color:RARITY_CONFIG[selectedBadge.rarity].color,
                      fontSize:'0.9rem', fontWeight:700, marginBottom:'4px'
                    }}>✓ Unlocked on {selectedBadge.unlockDate}</div>
                    <div style={{
                      color:RARITY_CONFIG[selectedBadge.rarity].color,
                      fontSize:'1.2rem', fontWeight:800
                    }}>+{selectedBadge.xp} XP Earned</div>
                  </div>
                ) : (
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>Progress</span>
                      <span style={{ 
                        color:RARITY_CONFIG[selectedBadge.rarity].color, 
                        fontSize:'0.9rem', fontWeight:700 
                      }}>{selectedBadge.progress}%</span>
                    </div>
                    <div style={{
                      height:'8px', background:'var(--border)',
                      borderRadius:'99px', overflow:'hidden'
                    }}>
                      <motion.div
                        initial={{ width:0 }}
                        animate={{ width:`${selectedBadge.progress}%` }}
                        transition={{ duration:1 }}
                        style={{
                          height:'100%', background:RARITY_CONFIG[selectedBadge.rarity].color,
                          borderRadius:'99px', boxShadow:`0 0 12px ${RARITY_CONFIG[selectedBadge.rarity].color}40`
                        }}
                      />
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale:1.02 }}
                  whileTap={{ scale:0.98 }}
                  onClick={() => setSelectedBadge(null)}
                  style={{
                    width:'100%', padding:'12px',
                    background:selectedBadge.unlocked 
                      ? RARITY_CONFIG[selectedBadge.rarity].color 
                      : 'var(--border)',
                    border:'none', borderRadius:'10px',
                    color:selectedBadge.unlocked ? '#000' : 'var(--text-muted)',
                    fontSize:'0.9rem', fontWeight:700, cursor:'pointer'
                  }}
                >
                  {selectedBadge.unlocked ? 'Awesome! 🎉' : 'Keep Going! 💪'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONFETTI */}
        <Confetti active={showConfetti} />

      </div>
  )
}
