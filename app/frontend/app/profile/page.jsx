'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useIsMobile from '../../lib/useIsMobile'
import { useTheme } from '../../components/shared/ThemeContext'
import { auth } from '../../lib/api'

/* ══════════ DATA ══════════ */
const AVATAR_STYLES = [
  { id:'warrior', emoji:'⚔️', label:'Warrior',  gradient:'linear-gradient(135deg,#1FA8C9,#FFD700)', ring:'#FFD700' },
  { id:'beast',   emoji:'🦁', label:'Beast',    gradient:'linear-gradient(135deg,#15B2CF,#EF4444)', ring:'#15B2CF' },
  { id:'ninja',   emoji:'🥷', label:'Ninja',    gradient:'linear-gradient(135deg,#1F2937,#7B61FF)', ring:'#7B61FF' },
  { id:'robot',   emoji:'🤖', label:'Robot',    gradient:'linear-gradient(135deg,#4FD3ED,#7B61FF)', ring:'#4FD3ED' },
  { id:'king',    emoji:'👑', label:'King',     gradient:'linear-gradient(135deg,#FFD700,#15B2CF)', ring:'#FFD700' },
  { id:'fire',    emoji:'🔥', label:'Fire',     gradient:'linear-gradient(135deg,#1FA8C9,#EF4444)', ring:'#1FA8C9' },
  { id:'crystal', emoji:'💎', label:'Crystal',  gradient:'linear-gradient(135deg,#7B61FF,#4FD3ED)', ring:'#A78BFA' },
  { id:'galaxy',  emoji:'🌌', label:'Galaxy',   gradient:'linear-gradient(135deg,var(--bg-primary),#A78BFA)', ring:'#A78BFA' },
  { id:'phoenix', emoji:'🦅', label:'Phoenix',  gradient:'linear-gradient(135deg,#1FA8C9,#FFD700)', ring:'#15B2CF' },
  { id:'alien',   emoji:'👽', label:'Alien',    gradient:'linear-gradient(135deg,#B5E5F2,#15B2CF)', ring:'#15B2CF' },
  { id:'demon',   emoji:'😈', label:'Demon',    gradient:'linear-gradient(135deg,#EF4444,#7B61FF)', ring:'#EF4444' },
  { id:'dragon',  emoji:'🐉', label:'Dragon',   gradient:'linear-gradient(135deg,#15B2CF,#7B61FF)', ring:'#15B2CF' },
]

const FRAME_STYLES = [
  { id:'none',    label:'None',     style:'' },
  { id:'gold',    label:'Gold',     style:'3px solid #FFD700' },
  { id:'neon',    label:'Volt',    style:'3px solid #15B2CF' },
  { id:'purple',  label:'Purple',   style:'3px solid #7B61FF' },
  { id:'fire',    label:'Fire',     style:'3px solid #1FA8C9' },
  { id:'rainbow', label:'Rainbow',  style:'3px solid transparent' },
]

const THEMES = [
  { id:'brand',  label:'Sky Blue', primary:'#15B2CF', secondary:'#4FD3ED', accent:'#7B61FF' },
  { id:'gold-rush',   label:'Gold Rush',    primary:'#FFD700', secondary:'#15B2CF', accent:'#1FA8C9' },
  { id:'purple-fire', label:'Purple Fire',  primary:'#7B61FF', secondary:'#A78BFA', accent:'#1FA8C9' },
  { id:'cyber-blue',  label:'Cyber Blue',   primary:'#4FD3ED', secondary:'#60A5FA', accent:'#7B61FF' },
  { id:'blood-orange',label:'Blood Orange', primary:'#1FA8C9', secondary:'#EF4444', accent:'#FFD700' },
  { id:'matrix',      label:'Matrix',       primary:'#B5E5F2', secondary:'#15B2CF', accent:'#4FD3ED' },
]

const FITNESS_GOALS  = ['Muscle Building','Fat Loss','Body Recomposition','Athletic Performance','Endurance','Powerlifting','Flexibility','Maintenance']
const DIET_TYPES     = ['No Restriction','High Protein','Vegetarian','Vegan','Keto','Paleo','Intermittent Fasting','Low Carb','Indian Vegetarian']
const ACTIVITY_OPTS  = [
  { id:'sedentary', emoji:'🛋️', label:'Sedentary',       desc:'Little or no exercise',            multi:1.2   },
  { id:'light',     emoji:'🚶', label:'Lightly Active',   desc:'1–3 days/week',                    multi:1.375 },
  { id:'moderate',  emoji:'🏃', label:'Moderately Active',desc:'3–5 days/week',                    multi:1.55  },
  { id:'very',      emoji:'💪', label:'Very Active',      desc:'6–7 days/week',                    multi:1.725 },
  { id:'extra',     emoji:'🏋️',label:'Athlete',          desc:'2× training/day',                  multi:1.9   },
]
const WORKOUT_DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const NOTIF_OPTS     = [
  { id:'meal',    icon:'🍽️', label:'Meal Reminders',    desc:'Daily meal logging nudges'          },
  { id:'workout', icon:'💪', label:'Workout Reminders',  desc:'Time to train alerts'               },
  { id:'water',   icon:'💧', label:'Hydration Alerts',   desc:'Drink water every 2 hours'          },
  { id:'streak',  icon:'🔥', label:'Streak Alerts',      desc:'Keep your streak alive'             },
  { id:'badge',   icon:'🏅', label:'Badge Unlocks',      desc:'Achievement notifications'          },
  { id:'report',  icon:'📊', label:'Weekly Report',      desc:'Sunday progress summary'            },
  { id:'ai',      icon:'🤖', label:'AI Insights',        desc:'Personalized health tips'           },
  { id:'challenge',icon:'⚡',label:'Challenges',         desc:'Challenge progress updates'         },
]
const PRIVACY_OPTS   = [
  { id:'public',    icon:'👥', label:'Public Profile',      desc:'Anyone can view your profile'    },
  { id:'streak',    icon:'🔥', label:'Show Streak',          desc:'Display streak on leaderboard'  },
  { id:'weight',    icon:'⚖️', label:'Weight Progress',      desc:'Share body stats publicly'      },
  { id:'board',     icon:'🏆', label:'Leaderboard',          desc:'Appear in global rankings'      },
  { id:'ailearn',   icon:'🧠', label:'AI Learning',          desc:'Let AI learn from your habits'  },
]
const CONNECTED_APPS = [
  { name:'Apple Health',  icon:'🍎', connected:true,  color:'#FF3B30', desc:'Steps & heart rate syncing'    },
  { name:'Google Fit',    icon:'🏃', connected:false, color:'#4285F4', desc:'Connect for fitness data'       },
  { name:'Fitbit',        icon:'⌚', connected:true,  color:'#00B0B9', desc:'Sleep & activity syncing'       },
  { name:'Strava',        icon:'🚴', connected:false, color:'#FC4C02', desc:'Connect for workout routes'     },
  { name:'MyFitnessPal',  icon:'📱', connected:false, color:'#00AEEF', desc:'Import food database'           },
  { name:'Garmin',        icon:'🗺️', connected:false, color:'#007CC3', desc:'GPS & HRV data'                },
]

const WEIGHT_HISTORY = [
  { date:'Jan 1', w:78.5, fat:22.4 },
  { date:'Jan 15',w:77.8, fat:21.8 },
  { date:'Feb 1', w:76.9, fat:21.1 },
  { date:'Feb 15',w:76.2, fat:20.4 },
  { date:'Mar 1', w:75.4, fat:19.8 },
  { date:'Mar 9', w:74.8, fat:19.2 },
]

/* ══════════ TOGGLE SWITCH ══════════ */
function Toggle({ on, onChange, color='#15B2CF' }) {
  return (
    <motion.div
      onClick={onChange}
      style={{
        width:'44px', height:'24px', borderRadius:'99px',
        background: on ? color : 'var(--border)',
        border:`1px solid ${on ? color+'60' : 'var(--track)'}`,
        cursor:'pointer', position:'relative', flexShrink:0,
        boxShadow: on ? `0 0 12px ${color}50` : 'none',
        transition:'all 0.3s'
      }}
      whileTap={{ scale:0.92 }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type:'spring', stiffness:400, damping:25 }}
        style={{
          width:'18px', height:'18px', borderRadius:'50%',
          background:'white', position:'absolute', top:'2px',
          boxShadow:'0 2px 6px var(--shadow-color)'
        }}
      />
    </motion.div>
  )
}

/* ══════════ STAT RING ══════════ */
function StatRing({ value, max, color, size=80, label, unit }) {
  const r     = (size-12)/2
  const circ  = 2*Math.PI*r
  const dash  = (value/max)*circ
  return (
    <div style={{ textAlign:'center', position:'relative' }}>
      <svg width={size} height={size} style={{ display:'block', margin:'0 auto' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={10}/>
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset:circ }}
          animate={{ strokeDashoffset:circ-dash }}
          transition={{ duration:1.4, ease:'easeOut', delay:0.3 }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter:`drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color, fontWeight:800, fontSize:'1rem', fontFamily:"'Clash Display',sans-serif" }}>{value}</div>
        <div style={{ color:'#4B5563', fontSize:'0.6rem' }}>{unit}</div>
      </div>
      <div style={{ color:'var(--text-muted)', fontSize:'0.72rem', marginTop:'6px' }}>{label}</div>
    </div>
  )
}

/* ══════════ MAIN ══════════ */
export default function ProfilePage() {
  const isMobile = useIsMobile()
  const { theme: modeTheme, setTheme: setModeTheme } = useTheme()
  const [activeTab,      setActiveTab]       = useState('profile')
  const [selectedAvatar, setSelectedAvatar]  = useState('warrior')
  const [selectedFrame,  setSelectedFrame]   = useState('gold')
  const [showAvatarModal,setShowAvatarModal] = useState(false)
  const [selectedTheme,  setSelectedTheme]   = useState('brand')
  const [editMode,       setEditMode]        = useState(false)
  const [saved,          setSaved]           = useState(false)
  const [apps,           setApps]            = useState(CONNECTED_APPS)
  const [notifs,         setNotifs]          = useState({ meal:true, workout:true, water:true, streak:true, badge:true, report:false, ai:true, challenge:false })
  const [privacyS,       setPrivacyS]        = useState({ public:true, streak:true, weight:false, board:true, ailearn:true })
  const [hovAvatar,      setHovAvatar]       = useState(null)
  const [profile, setProfile] = useState({
    name:'User', username:'', tagline:'Getting stronger every day 💪',
    email:'', phone:'',
    dob:'2000-01-01', gender:'Male', location:'',
    height:175, weight:74.8, targetWeight:70,
    bodyFat:19.2, muscle:60.1, bmi:24.4,
    goal:'Muscle Building', diet:'No Restriction', activity:'very',
    workoutDays:['Mon','Thu','Fri','Sat','Sun'],
    calorieGoal:2800, proteinGoal:210, carbGoal:320, fatGoal:85,
    waterGoal:3, sleepGoal:8,
  })

  // Hydrate from the real backend profile (falls back to cached identity)
  useEffect(() => {
    const applyUser = (u) => {
      if (!u) return
      const name = u.name || 'User'
      const derivedUsername = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      setProfile(p => ({
        ...p,
        name,
        username: p.username || derivedUsername,
        email: u.email || p.email,
        phone: u.phone ?? p.phone,
        dob: u.dob || p.dob,
        gender: u.gender || p.gender,
        location: u.location || p.location,
        height: u.height ?? p.height,
        weight: u.weight ?? p.weight,
        targetWeight: u.targetWeight ?? p.targetWeight,
        bodyFat: u.bodyFat ?? p.bodyFat,
        muscle: u.muscleMass ?? p.muscle,
        goal: u.fitnessGoal || p.goal,
        diet: u.dietType || p.diet,
        activity: u.activityLevel || p.activity,
        calorieGoal: u.calorieGoal ?? p.calorieGoal,
        proteinGoal: u.proteinGoal ?? p.proteinGoal,
        carbGoal: u.carbGoal ?? p.carbGoal,
        fatGoal: u.fatGoal ?? p.fatGoal,
        waterGoal: u.waterGoal ?? p.waterGoal,
        sleepGoal: u.sleepGoal ?? p.sleepGoal,
      }))
    }
    auth.getMe().then(res => applyUser(res.data)).catch(() => {
      try {
        const raw = localStorage.getItem('nutriai_user')
        if (raw && raw !== 'undefined') applyUser(JSON.parse(raw))
      } catch (e) {}
    })
  }, [])

  const theme  = THEMES.find(t=>t.id===selectedTheme) || THEMES[0]
  const avatar = AVATAR_STYLES.find(a=>a.id===selectedAvatar) || AVATAR_STYLES[0]
  const frame  = FRAME_STYLES.find(f=>f.id===selectedFrame)   || FRAME_STYLES[0]
  const actOpt = ACTIVITY_OPTS.find(a=>a.id===profile.activity)

  const tdmr   = (profile.gender==='Male' ? 88.36 : 447.6)
             + (profile.gender==='Male' ? 13.4 : 9.25)*profile.weight
             + (profile.gender==='Male' ? 4.8  : 3.1 )*profile.height
             - (profile.gender==='Male' ? 5.7  : 4.3 )*(new Date().getFullYear()-new Date(profile.dob).getFullYear())
  const tdee   = Math.round(tdmr * (actOpt?.multi||1.55))

  const card = {
    background:'var(--bg-card)',
    backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
    border:'1px solid var(--border)',
    borderRadius:'24px', overflow:'hidden',
  }

  const inp = (key, type='text', placeholder='') => (
    editMode ? (
      <input
        type={type} value={profile[key]} placeholder={placeholder}
        onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}
        style={{
          width:'100%', boxSizing:'border-box',
          background:'var(--border)',
          border:`1px solid ${theme.primary}35`,
          borderRadius:'10px', padding:'9px 13px',
          color:'var(--text-primary)', fontSize:'0.88rem', outline:'none',
          fontFamily:"'Satoshi',sans-serif",
        }}
        onFocus={e=>e.target.style.borderColor=`${theme.primary}70`}
        onBlur={e=>e.target.style.borderColor=`${theme.primary}35`}
      />
    ) : (
      <div style={{ color:'var(--text-faint)', fontSize:'0.88rem', padding:'9px 0' }}>
        {profile[key] || '—'}
      </div>
    )
  )

  const numInp = (key, min, max, step=1) => (
    editMode ? (
      <input
        type="number" value={profile[key]} min={min} max={max} step={step}
        onChange={e=>setProfile(p=>({...p,[key]:parseFloat(e.target.value)||0}))}
        style={{
          width:'100%', boxSizing:'border-box',
          background:'var(--border)',
          border:`1px solid ${theme.primary}35`,
          borderRadius:'10px', padding:'9px 13px',
          color:theme.primary, fontSize:'1rem', outline:'none',
          fontWeight:800, fontFamily:"'Clash Display',sans-serif",
          textAlign:'center'
        }}
        onFocus={e=>e.target.style.borderColor=`${theme.primary}70`}
        onBlur={e=>e.target.style.borderColor=`${theme.primary}35`}
      />
    ) : (
      <div style={{ color:theme.primary, fontFamily:"'Clash Display',sans-serif", fontSize:'1.2rem', fontWeight:800, textAlign:'center' }}>
        {profile[key]}
      </div>
    )
  )

  const fieldLabel = (txt) => (
    <div style={{ color:'#4B5563', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>
      {txt}
    </div>
  )

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const res = await auth.updateProfile({
        name: profile.name, phone: profile.phone, dob: profile.dob,
        gender: profile.gender, location: profile.location,
        height: profile.height, weight: profile.weight,
        targetWeight: profile.targetWeight, bodyFat: profile.bodyFat,
        muscleMass: profile.muscle,
        fitnessGoal: profile.goal, dietType: profile.diet, activityLevel: profile.activity,
        calorieGoal: profile.calorieGoal, proteinGoal: profile.proteinGoal,
        carbGoal: profile.carbGoal, fatGoal: profile.fatGoal,
        waterGoal: profile.waterGoal, sleepGoal: profile.sleepGoal,
      })
      // keep the cached identity in sync so other pages show the new name
      try {
        const raw = localStorage.getItem('nutriai_user')
        const cached = raw && raw !== 'undefined' ? JSON.parse(raw) : {}
        localStorage.setItem('nutriai_user', JSON.stringify({ ...cached, name: res.data?.name || profile.name, email: res.data?.email || profile.email }))
      } catch {}
      setSaved(true); setEditMode(false)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
      <div style={{ width:'100%' }}>

        {/* AMBIENT */}
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          background:`
            radial-gradient(600px circle at 20% 25%, ${theme.primary}05 0%, transparent 60%),
            radial-gradient(400px circle at 80% 75%, ${theme.secondary}04 0%, transparent 60%)
          `
        }}/>

        <div style={{ position:'relative', zIndex:1 }}>

          {/* ═══════════════ HERO CARD ═══════════════ */}
          <motion.div
            initial={{ opacity:0, y:-24 }}
            animate={{ opacity:1, y:0 }}
            transition={{ type:'spring', stiffness:180 }}
            style={{
              ...card, marginBottom:'28px', position:'relative',
              border:`1px solid ${theme.primary}25`,
              boxShadow:`0 0 80px ${theme.primary}08`,
            }}
          >
            {/* BANNER */}
            <div style={{
              height:'130px', position:'relative', overflow:'hidden',
              background:`linear-gradient(135deg, ${theme.primary}18, ${theme.secondary}12, rgba(10,10,20,0.4))` 
            }}>
              {/* Animated banner streaks */}
              {[...Array(5)].map((_,i) => (
                <motion.div key={i}
                  animate={{ x:['-120%','120%'] }}
                  transition={{ duration:5+i*1.2, repeat:Infinity, delay:i*0.8, ease:'linear' }}
                  style={{
                    position:'absolute',
                    top:`${15+i*18}%`, left:0,
                    width:'40%', height:'1px',
                    background:`linear-gradient(90deg,transparent,${theme.primary}40,transparent)`,
                  }}
                />
              ))}
              {/* Floating orbs */}
              {[...Array(3)].map((_,i) => (
                <motion.div key={i}
                  animate={{ y:[0,-12,0], scale:[1,1.15,1], opacity:[0.3,0.6,0.3] }}
                  transition={{ duration:3+i, repeat:Infinity, delay:i*0.6 }}
                  style={{
                    position:'absolute',
                    top:`${20+i*25}%`, left:`${20+i*30}%`,
                    width:`${24+i*8}px`, height:`${24+i*8}px`,
                    borderRadius:'50%',
                    background:`radial-gradient(circle, ${[theme.primary,theme.secondary,theme.accent][i]}40 0%, transparent 70%)`,
                  }}
                />
              ))}

              {/* Theme editor button */}
              <motion.button
                whileHover={{ scale:1.08 }}
                whileTap={{ scale:0.95 }}
                onClick={() => setActiveTab('appearance')}
                style={{
                  position:'absolute', top:'14px', right:'14px',
                  background:'var(--shadow-color)', backdropFilter:'blur(12px)',
                  border:'1px solid var(--border)',
                  borderRadius:'10px', padding:'7px 14px',
                  color:'var(--text-faint)', cursor:'pointer', fontSize:'0.78rem',
                  display:'flex', alignItems:'center', gap:'6px'
                }}
              >🎨 Customize</motion.button>
            </div>

            {/* AVATAR + INFO ROW */}
            <div style={{ padding:'0 32px 28px', display:'flex', alignItems:'flex-end', gap:'24px', marginTop:'-52px', flexWrap:'wrap' }}>

              {/* AVATAR */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <motion.div
                  whileHover={{ scale:1.06 }}
                  whileTap={{ scale:0.96 }}
                  onClick={() => setShowAvatarModal(true)}
                  style={{ cursor:'pointer', position:'relative' }}
                >
                  {/* Spinning ring */}
                  <motion.div
                    animate={{ rotate:360 }}
                    transition={{ duration:12, repeat:Infinity, ease:'linear' }}
                    style={{
                      position:'absolute', inset:'-5px',
                      borderRadius:'50%',
                      background:`conic-gradient(${avatar.ring}, transparent 40%, ${avatar.ring} 60%, transparent)`,
                      opacity:0.7,
                    }}
                  />
                  {/* Avatar circle */}
                  <div style={{
                    width:'100px', height:'100px', borderRadius:'50%',
                    background:avatar.gradient,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'3rem', position:'relative', zIndex:1,
                    border: frame.id==='rainbow'
                      ? `3px solid ${avatar.ring}` 
                      : frame.id!=='none'
                        ? frame.style
                        : `3px solid ${avatar.ring}`,
                    boxShadow:`0 0 30px ${avatar.ring}50, 0 8px 32px var(--shadow-color)`,
                  }}>
                    {avatar.emoji}
                  </div>

                  {/* Edit badge */}
                  <motion.div
                    animate={{ opacity:[0.6,1,0.6] }}
                    transition={{ duration:2, repeat:Infinity }}
                    style={{
                      position:'absolute', bottom:2, right:2, zIndex:2,
                      width:'26px', height:'26px', borderRadius:'50%',
                      background:`linear-gradient(135deg,${theme.primary},${theme.secondary})`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.7rem', border:'2px solid rgba(10,10,20,0.9)',
                      boxShadow:`0 0 10px ${theme.primary}60` 
                    }}
                  >✏️</motion.div>
                </motion.div>
              </div>

              {/* NAME & STATS */}
              <div style={{ flex:1, paddingTop:'56px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap', marginBottom:'4px' }}>
                  <h1 style={{
                    fontFamily:"'Clash Display',sans-serif",
                    fontSize:'1.7rem', fontWeight:900, margin:0,
                    background:`linear-gradient(135deg,white,${theme.primary})`,
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                  }}>{profile.name}</h1>
                  {/* Level badge */}
                  <motion.div
                    animate={{ scale:[1,1.08,1] }}
                    transition={{ duration:2, repeat:Infinity }}
                    style={{
                      background:`${theme.primary}18`,
                      border:`1px solid ${theme.primary}40`,
                      borderRadius:'99px', padding:'4px 14px',
                      color:theme.primary, fontSize:'0.78rem', fontWeight:800,
                      boxShadow:`0 0 14px ${theme.primary}30` 
                    }}
                  >⚡ LV.7 Expert</motion.div>
                </div>
                <div style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:'8px' }}>
                  @{profile.username} · {profile.location}
                </div>
                {editMode ? (
                  <input
                    value={profile.tagline}
                    onChange={e=>setProfile(p=>({...p,tagline:e.target.value}))}
                    style={{
                      background:'var(--border)',
                      border:`1px solid ${theme.primary}30`,
                      borderRadius:'8px', padding:'6px 12px',
                      color:'var(--text-faint)', fontSize:'0.85rem', outline:'none',
                      width:'100%', maxWidth:'420px', boxSizing:'border-box',
                      fontFamily:"'Satoshi',sans-serif"
                    }}
                  />
                ) : (
                  <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', fontStyle:'italic' }}>
                    "{profile.tagline}"
                  </div>
                )}
              </div>

              {/* QUICK STATS */}
              <div style={{ display:'flex', gap:'12px', paddingTop:'56px', flexWrap:'wrap' }}>
                {[
                  { val:'12,340', label:'XP',         color:theme.primary  },
                  { val:'14',     label:'Day Streak',  color:'#1FA8C9'      },
                  { val:'#6',     label:'Global Rank', color:theme.secondary},
                  { val:'16',     label:'Badges',      color:'#FFD700'      },
                ].map(s => (
                  <div key={s.label} style={{
                    background:'var(--border)',
                    border:'1px solid var(--border)',
                    borderRadius:'14px', padding:'10px 16px', textAlign:'center',
                    minWidth:'64px'
                  }}>
                    <div style={{ color:s.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.2rem', fontWeight:900 }}>{s.val}</div>
                    <div style={{ color:'#4B5563', fontSize:'0.68rem', marginTop:'2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* EDIT / SAVE BUTTONS */}
              <div style={{ display:'flex', gap:'10px', paddingTop:'56px' }}>
                {editMode ? (
                  <>
                    <motion.button
                      whileHover={{ scale:1.04, boxShadow:`0 8px 24px ${theme.primary}40` }}
                      whileTap={{ scale:0.96 }}
                      onClick={handleSave}
                      style={{
                        background:`linear-gradient(135deg,${theme.primary},${theme.secondary})`,
                        border:'none', borderRadius:'12px', padding:'10px 22px',
                        color:'#000', fontWeight:800, cursor:'pointer', fontSize:'0.88rem',
                        fontFamily:"'Satoshi',sans-serif"
                      }}
                    >{saving ? '⏳ Saving...' : '💾 Save Changes'}</motion.button>
                    {saveError && (
                      <div style={{ color: '#FF6B6B', fontSize: '0.8rem', alignSelf: 'center' }}>{saveError}</div>
                    )}
                    <motion.button
                      whileHover={{ scale:1.04 }}
                      whileTap={{ scale:0.96 }}
                      onClick={()=>setEditMode(false)}
                      style={{
                        background:'var(--border)',
                        border:'1px solid var(--border)',
                        borderRadius:'12px', padding:'10px 18px',
                        color:'var(--text-muted)', cursor:'pointer', fontSize:'0.88rem'
                      }}
                    >Cancel</motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale:1.04 }}
                    whileTap={{ scale:0.96 }}
                    onClick={()=>setEditMode(true)}
                    style={{
                      background:'var(--border)',
                      border:`1px solid ${theme.primary}30`,
                      borderRadius:'12px', padding:'10px 20px',
                      color:theme.primary, cursor:'pointer', fontSize:'0.88rem',
                      fontWeight:600, display:'flex', alignItems:'center', gap:'7px'
                    }}
                  >✏️ Edit Profile</motion.button>
                )}
              </div>
            </div>

            {/* SAVE FLASH */}
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity:0, y:20, scale:0.9 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, y:-10 }}
                  style={{
                    position:'absolute', bottom:'20px', left:'50%',
                    transform:'translateX(-50%)',
                    background:'rgba(21, 178, 207,0.15)',
                    border:'1px solid rgba(21, 178, 207,0.4)',
                    borderRadius:'99px', padding:'8px 24px',
                    color:'#15B2CF', fontWeight:700, fontSize:'0.88rem',
                    boxShadow:'0 0 20px rgba(21, 178, 207,0.3)',
                    display:'flex', alignItems:'center', gap:'8px', zIndex:10
                  }}
                >✅ Profile saved!</motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ═══════════════ TABS ═══════════════ */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
            {[
              { id:'profile',    label:'👤 Profile',        },
              { id:'body',       label:'💪 Body Stats',     },
              { id:'goals',      label:'🎯 Goals & Diet',   },
              { id:'appearance', label:'🎨 Appearance',     },
              { id:'notifs',     label:'🔔 Notifications',  },
              { id:'privacy',    label:'🔒 Privacy',        },
              { id:'apps',       label:'🔗 Connected Apps', },
            ].map(tab => (
              <motion.button key={tab.id}
                whileHover={{ scale:1.04 }}
                whileTap={{ scale:0.96 }}
                onClick={()=>setActiveTab(tab.id)}
                style={{
                  padding:'9px 20px', borderRadius:'12px', cursor:'pointer',
                  border: activeTab===tab.id ? 'none' : '1px solid var(--border)',
                  background: activeTab===tab.id
                    ? `linear-gradient(135deg,${theme.primary},${theme.secondary})` 
                    : 'var(--bg-card)',
                  color: activeTab===tab.id ? '#000' : 'var(--text-muted)',
                  fontWeight: activeTab===tab.id ? 800 : 400,
                  fontSize:'0.84rem', fontFamily:"'Satoshi',sans-serif"
                }}
              >{tab.label}</motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ═══════════════ PROFILE TAB ═══════════════ */}
            {activeTab==='profile' && (
              <motion.div key="profile"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'20px' }}>

                  {/* Personal Info */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 20px' }}>
                      👤 Personal Information
                    </h3>
                    {[
                      { label:'Full Name',       key:'name'     },
                      { label:'Username',        key:'username' },
                      { label:'Email Address',   key:'email',   type:'email' },
                      { label:'Phone Number',    key:'phone',   type:'tel'   },
                      { label:'Date of Birth',   key:'dob',     type:'date'  },
                      { label:'Location',        key:'location' },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom:'14px' }}>
                        {fieldLabel(f.label)}
                        {inp(f.key, f.type||'text')}
                      </div>
                    ))}
                    {/* Gender */}
                    <div>
                      {fieldLabel('Gender')}
                      {editMode ? (
                        <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                          {['Male','Female','Other'].map(g => (
                            <motion.button key={g}
                              whileHover={{ scale:1.05 }}
                              whileTap={{ scale:0.95 }}
                              onClick={()=>setProfile(p=>({...p,gender:g}))}
                              style={{
                                flex:1, padding:'8px',
                                background: profile.gender===g ? `${theme.primary}20` : 'var(--border)',
                                border:`1px solid ${profile.gender===g ? theme.primary+'50' : 'var(--border)'}`,
                                borderRadius:'10px', color: profile.gender===g ? theme.primary : 'var(--text-muted)',
                                fontWeight: profile.gender===g ? 700 : 400,
                                cursor:'pointer', fontSize:'0.82rem'
                              }}
                            >{g}</motion.button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color:'var(--text-faint)', fontSize:'0.88rem', padding:'9px 0' }}>{profile.gender}</div>
                      )}
                    </div>
                  </div>

                  {/* Right column */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

                    {/* Account Info */}
                    <div style={{ ...card, padding:'28px' }}>
                      <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 20px' }}>
                        🔐 Account
                      </h3>
                      {[
                        { label:'Member Since', val:'January 15, 2025',  icon:'📅', color:theme.primary  },
                        { label:'Plan',          val:'NutriAI Pro 🌟',    icon:'⭐', color:'#FFD700'      },
                        { label:'Workouts',      val:'142 completed',     icon:'🏋️',color:theme.secondary},
                        { label:'Meals Logged',  val:'867 meals',         icon:'🍽️',color:'#B5E5F2'      },
                        { label:'AI Chats',      val:'58 conversations',  icon:'🤖', color:'#A78BFA'     },
                      ].map(s => (
                        <div key={s.label} style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 0', borderBottom:'1px solid var(--border)'
                        }}>
                          <span style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>{s.icon} {s.label}</span>
                          <span style={{ color:s.color, fontWeight:700, fontSize:'0.82rem' }}>{s.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Danger zone */}
                    <div style={{ ...card, padding:'24px', border:'1px solid rgba(239,68,68,0.15)' }}>
                      <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'#EF4444', fontSize:'0.95rem', fontWeight:700, margin:'0 0 14px', display:'flex', alignItems:'center', gap:'6px' }}>
                        ⚠️ Danger Zone
                      </h3>
                      {[
                        { label:'Reset All Data',   desc:'Wipe your logged meals & workouts', color:'#15B2CF' },
                        { label:'Export Data',      desc:'Download all your data as CSV',     color:'#4FD3ED' },
                        { label:'Delete Account',   desc:'Permanently remove your account',  color:'#EF4444' },
                      ].map(a => (
                        <div key={a.label} style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 0', borderBottom:'1px solid var(--border)'
                        }}>
                          <div>
                            <div style={{ color:'var(--text-faint)', fontSize:'0.82rem', fontWeight:600 }}>{a.label}</div>
                            <div style={{ color:'#4B5563', fontSize:'0.72rem' }}>{a.desc}</div>
                          </div>
                          <motion.button
                            whileHover={{ scale:1.05, background:`${a.color}18` }}
                            whileTap={{ scale:0.95 }}
                            style={{
                              background:'transparent',
                              border:`1px solid ${a.color}30`,
                              borderRadius:'8px', padding:'5px 14px',
                              color:a.color, cursor:'pointer', fontSize:'0.75rem', fontWeight:600
                            }}
                          >{a.label.split(' ')[0]}</motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ BODY STATS TAB ═══════════════ */}
            {activeTab==='body' && (
              <motion.div key="body"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                {/* Rings row */}
                <div style={{ ...card, padding:'32px', marginBottom:'20px', border:`1px solid ${theme.primary}15` }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.1rem', fontWeight:700, margin:'0 0 24px' }}>
                    📊 Body Composition
                  </h3>
                  <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:'20px', marginBottom:'28px' }}>
                    <StatRing value={profile.weight}       max={120}  color={theme.primary}   label='Weight'     unit='kg'  />
                    <StatRing value={profile.bodyFat}      max={40}   color='#1FA8C9'          label='Body Fat'   unit='%'   />
                    <StatRing value={profile.muscle}       max={80}   color='#15B2CF'          label='Muscle'     unit='kg'  />
                    <StatRing value={profile.bmi}          max={40}   color={theme.secondary}  label='BMI'        unit=''    />
                    <StatRing value={profile.waterGoal}    max={5}    color='#4FD3ED'          label='Water Goal' unit='L'   />
                    <StatRing value={profile.sleepGoal}    max={10}   color='#A78BFA'          label='Sleep Goal' unit='hrs' />
                  </div>

                  {/* Editable stat boxes */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'14px' }}>
                    {[
                      { label:'Height (cm)',    key:'height',       color:theme.primary  },
                      { label:'Weight (kg)',    key:'weight',       color:theme.secondary },
                      { label:'Target (kg)',    key:'targetWeight', color:'#15B2CF'      },
                      { label:'Body Fat (%)',   key:'bodyFat',      color:'#1FA8C9'      },
                      { label:'Muscle (kg)',    key:'muscle',       color:'#B5E5F2'      },
                      { label:'BMI',            key:'bmi',          color:'#4FD3ED'      },
                      { label:'Water Goal (L)', key:'waterGoal',    color:'#60A5FA'      },
                      { label:'Sleep Goal (h)', key:'sleepGoal',    color:'#A78BFA'      },
                    ].map(f => (
                      <div key={f.key} style={{
                        background:`${f.color}06`,
                        border:`1px solid ${f.color}18`,
                        borderRadius:'16px', padding:'16px', textAlign:'center'
                      }}>
                        {fieldLabel(f.label)}
                        {numInp(f.key, 0, 999, 0.1)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TDEE Calculator */}
                <div style={{ ...card, padding:'28px', marginBottom:'20px', background:`${theme.primary}05`, border:`1px solid ${theme.primary}20` }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 16px' }}>
                    🔥 Auto-Calculated TDEE
                  </h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'14px' }}>
                    {[
                      { label:'BMR',            val:Math.round(tdmr), color:'var(--text-muted)',      unit:'kcal', icon:'💤' },
                      { label:'TDEE',           val:tdee,             color:theme.primary,  unit:'kcal', icon:'🔥' },
                      { label:'Cut (-300)',      val:tdee-300,         color:'#4FD3ED',      unit:'kcal', icon:'📉' },
                      { label:'Bulk (+300)',     val:tdee+300,         color:'#15B2CF',      unit:'kcal', icon:'📈' },
                    ].map(s => (
                      <motion.div key={s.label}
                        whileHover={{ y:-4, boxShadow:`0 8px 24px ${s.color}25` }}
                        style={{
                          background:`${s.color}08`,
                          border:`1px solid ${s.color}20`,
                          borderRadius:'16px', padding:'16px', textAlign:'center'
                        }}
                      >
                        <div style={{ fontSize:'1.4rem', marginBottom:'6px' }}>{s.icon}</div>
                        <div style={{ color:s.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.5rem', fontWeight:900 }}>{s.val.toLocaleString()}</div>
                        <div style={{ color:'#4B5563', fontSize:'0.7rem', marginTop:'2px' }}>{s.label} · {s.unit}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Weight progress chart */}
                <div style={{ ...card, padding:'28px' }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 20px' }}>
                    📈 Weight Trend (10 Weeks)
                  </h3>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:'14px', height:'100px', marginBottom:'10px' }}>
                    {WEIGHT_HISTORY.map((d,i) => {
                      const minW=73, maxW=80
                      const pct = (d.w-minW)/(maxW-minW)
                      const h   = Math.max(20, (1-pct)*90+10)
                      return (
                        <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                          <div style={{ color:theme.primary, fontSize:'0.68rem', fontWeight:600 }}>{d.w}</div>
                          <motion.div
                            initial={{ height:0 }}
                            animate={{ height:h }}
                            transition={{ delay:i*0.08, duration:0.6, type:'spring' }}
                            style={{
                              width:'100%', borderRadius:'6px 6px 0 0',
                              background: i===WEIGHT_HISTORY.length-1
                                ? `linear-gradient(180deg,${theme.primary},${theme.primary}60)` 
                                : `linear-gradient(180deg,${theme.secondary}80,${theme.secondary}30)`,
                              boxShadow: i===WEIGHT_HISTORY.length-1 ? `0 0 12px ${theme.primary}50` : 'none'
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    {WEIGHT_HISTORY.map(d => (
                      <div key={d.date} style={{ color:'#4B5563', fontSize:'0.68rem', flex:1, textAlign:'center' }}>{d.date}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ GOALS & DIET TAB ═══════════════ */}
            {activeTab==='goals' && (
              <motion.div key="goals"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'20px' }}>

                  {/* Fitness Goal */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 16px' }}>🎯 Fitness Goal</h3>
                    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'8px' }}>
                      {FITNESS_GOALS.map(g => (
                        <motion.button key={g}
                          whileHover={{ scale:1.03 }}
                          whileTap={{ scale:0.97 }}
                          onClick={()=>setProfile(p=>({...p,goal:g}))}
                          style={{
                            padding:'10px 12px',
                            background: profile.goal===g ? `${theme.primary}18` : 'var(--border)',
                            border:`1px solid ${profile.goal===g ? theme.primary+'50' : 'var(--border)'}`,
                            borderRadius:'12px', color: profile.goal===g ? theme.primary : 'var(--text-muted)',
                            fontWeight: profile.goal===g ? 700 : 400,
                            cursor:'pointer', fontSize:'0.8rem',
                            boxShadow: profile.goal===g ? `0 0 12px ${theme.primary}25` : 'none',
                            transition:'all 0.2s'
                          }}
                        >
                          {profile.goal===g ? '● ' : '○ '}{g}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Diet Type */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 16px' }}>🥗 Diet Type</h3>
                    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'8px' }}>
                      {DIET_TYPES.map(d => (
                        <motion.button key={d}
                          whileHover={{ scale:1.03 }}
                          whileTap={{ scale:0.97 }}
                          onClick={()=>setProfile(p=>({...p,diet:d}))}
                          style={{
                            padding:'10px 12px',
                            background: profile.diet===d ? 'rgba(79, 211, 237,0.12)' : 'var(--border)',
                            border:`1px solid ${profile.diet===d ? 'rgba(79, 211, 237,0.4)' : 'var(--border)'}`,
                            borderRadius:'12px', color: profile.diet===d ? '#4FD3ED' : 'var(--text-muted)',
                            fontWeight: profile.diet===d ? 700 : 400,
                            cursor:'pointer', fontSize:'0.8rem', transition:'all 0.2s'
                          }}
                        >{profile.diet===d ? '✓ ' : ''}{d}</motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 16px' }}>⚡ Activity Level</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {ACTIVITY_OPTS.map(a => (
                        <motion.button key={a.id}
                          whileHover={{ x:4 }}
                          whileTap={{ scale:0.98 }}
                          onClick={()=>setProfile(p=>({...p,activity:a.id}))}
                          style={{
                            display:'flex', alignItems:'center', gap:'12px',
                            padding:'12px 16px',
                            background: profile.activity===a.id ? `${theme.primary}12` : 'var(--border)',
                            border:`1px solid ${profile.activity===a.id ? theme.primary+'40' : 'var(--border)'}`,
                            borderRadius:'14px', cursor:'pointer',
                            boxShadow: profile.activity===a.id ? `0 0 16px ${theme.primary}20` : 'none',
                            transition:'all 0.2s'
                          }}
                        >
                          <span style={{ fontSize:'1.3rem' }}>{a.emoji}</span>
                          <div style={{ flex:1, textAlign:'left' }}>
                            <div style={{ color: profile.activity===a.id ? theme.primary : 'var(--text-faint)', fontWeight:600, fontSize:'0.88rem' }}>{a.label}</div>
                            <div style={{ color:'#4B5563', fontSize:'0.72rem' }}>{a.desc}</div>
                          </div>
                          <div style={{ color: profile.activity===a.id ? theme.primary : '#374151', fontWeight:700, fontSize:'0.8rem' }}>×{a.multi}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Macro Goals + Workout Days */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

                    {/* Macro Goals */}
                    <div style={{ ...card, padding:'24px' }}>
                      <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 16px' }}>📊 Daily Macro Goals</h3>
                      {[
                        { label:'🔥 Calories (kcal)', key:'calorieGoal', color:theme.primary  },
                        { label:'💪 Protein (g)',      key:'proteinGoal', color:'#15B2CF'      },
                        { label:'⚡ Carbs (g)',         key:'carbGoal',    color:'#7B61FF'      },
                        { label:'🥑 Fat (g)',           key:'fatGoal',     color:'#FFD700'      },
                      ].map(m => (
                        <div key={m.key} style={{ marginBottom:'12px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                            <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{m.label}</span>
                            {editMode ? (
                              <input
                                type="number"
                                value={profile[m.key]}
                                onChange={e=>setProfile(p=>({...p,[m.key]:parseInt(e.target.value)||0}))}
                                style={{
                                  background:'var(--border)',
                                  border:`1px solid ${m.color}30`,
                                  borderRadius:'6px', padding:'2px 8px',
                                  color:m.color, fontSize:'0.8rem',
                                  outline:'none', width:'70px', textAlign:'right',
                                  fontWeight:700
                                }}
                              />
                            ) : (
                              <span style={{ color:m.color, fontWeight:700, fontSize:'0.85rem' }}>{profile[m.key]}</span>
                            )}
                          </div>
                          <div style={{ height:'6px', background:'var(--border)', borderRadius:'99px', overflow:'hidden' }}>
                            <motion.div
                              initial={{ width:0 }}
                              animate={{ width:`${Math.min((profile[m.key]/3500)*100,100)}%` }}
                              transition={{ duration:1 }}
                              style={{ height:'100%', background:m.color, borderRadius:'99px', boxShadow:`0 0 6px ${m.color}50` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Workout days */}
                    <div style={{ ...card, padding:'24px' }}>
                      <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 14px' }}>📅 Workout Days</h3>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {WORKOUT_DAYS.map(d => {
                          const active = profile.workoutDays.includes(d)
                          return (
                            <motion.button key={d}
                              whileHover={{ scale:1.08 }}
                              whileTap={{ scale:0.92 }}
                              onClick={()=>setProfile(p=>({
                                ...p,
                                workoutDays: active
                                  ? p.workoutDays.filter(x=>x!==d)
                                  : [...p.workoutDays, d]
                              }))}
                              style={{
                                width:'44px', height:'44px', borderRadius:'12px',
                                background: active ? `${theme.primary}20` : 'var(--border)',
                                border:`2px solid ${active ? theme.primary : 'var(--border)'}`,
                                color: active ? theme.primary : '#4B5563',
                                fontWeight: active ? 800 : 400,
                                cursor:'pointer', fontSize:'0.8rem',
                                boxShadow: active ? `0 0 12px ${theme.primary}40` : 'none',
                                transition:'all 0.2s'
                              }}
                            >{d}</motion.button>
                          )
                        })}
                      </div>
                      <div style={{ marginTop:'10px', color:'#4B5563', fontSize:'0.75rem' }}>
                        {profile.workoutDays.length} days/week selected
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ APPEARANCE TAB ═══════════════ */}
            {activeTab==='appearance' && (
              <motion.div key="appearance"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'20px' }}>

                  {/* Theme */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 18px' }}>
                      🎨 App Theme
                    </h3>
                    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'12px' }}>
                      {[
                        { id:'light', label:'Light', desc:'Warm paper · frosted glass', sw:['#F5F1E8','#FFFFFF','#15B2CF'] },
                        { id:'dark',  label:'Dark',  desc:'Warm charcoal · amber glow',  sw:['#141110','#221C17','#4FD3ED'] },
                      ].map(t => (
                        <motion.div key={t.id}
                          whileHover={{ scale:1.04, y:-3 }}
                          whileTap={{ scale:0.97 }}
                          onClick={()=>setModeTheme(t.id)}
                          style={{
                            background: modeTheme===t.id ? 'rgba(21, 178, 207,0.08)' : 'var(--border)',
                            border:`2px solid ${modeTheme===t.id ? '#15B2CF' : 'var(--border)'}`,
                            borderRadius:'16px', padding:'16px', cursor:'pointer',
                            boxShadow: modeTheme===t.id ? '0 0 20px rgba(21, 178, 207,0.25)' : 'none',
                            transition:'all 0.2s'
                          }}
                        >
                          <div style={{ display:'flex', gap:'6px', marginBottom:'8px' }}>
                            {t.sw.map((c,i) => (
                              <div key={i} style={{
                                width:'20px', height:'20px', borderRadius:'50%',
                                background:c, boxShadow:`0 0 6px ${c}60`,
                                border:'1px solid var(--border)'
                              }}/>
                            ))}
                          </div>
                          <div style={{ color: modeTheme===t.id ? '#15B2CF' : 'var(--text-faint)', fontWeight:600, fontSize:'0.85rem' }}>
                            {modeTheme===t.id ? '● ' : ''}{t.label}
                          </div>
                          <div style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginTop:'2px' }}>
                            {t.desc}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Avatar picker & Frame */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                    <div style={{ ...card, padding:'28px' }}>
                      <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 16px' }}>
                        🧬 Avatar Style
                      </h3>
                      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
                        {AVATAR_STYLES.map(a => (
                          <motion.div key={a.id}
                            whileHover={{ scale:1.1, y:-4 }}
                            whileTap={{ scale:0.92 }}
                            onHoverStart={()=>setHovAvatar(a.id)}
                            onHoverEnd={()=>setHovAvatar(null)}
                            onClick={()=>setSelectedAvatar(a.id)}
                            style={{
                              display:'flex', flexDirection:'column', alignItems:'center', gap:'5px',
                              cursor:'pointer'
                            }}
                          >
                            <div style={{
                              width:'52px', height:'52px', borderRadius:'16px',
                              background:a.gradient,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'1.6rem',
                              border:`2px solid ${selectedAvatar===a.id ? a.ring : 'transparent'}`,
                              boxShadow: selectedAvatar===a.id ? `0 0 16px ${a.ring}60` : hovAvatar===a.id ? `0 0 10px ${a.ring}40` : 'none',
                              transition:'all 0.2s'
                            }}>{a.emoji}</div>
                            <div style={{ color: selectedAvatar===a.id ? a.ring : '#4B5563', fontSize:'0.65rem', fontWeight:600 }}>{a.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Frame style */}
                      <div style={{ borderTop:'1px solid var(--border)', paddingTop:'16px' }}>
                        <div style={{ color:'var(--text-muted)', fontSize:'0.78rem', fontWeight:600, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                          Avatar Frame
                        </div>
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                          {FRAME_STYLES.map(f => {
                            const active = selectedFrame===f.id
                            return (
                              <motion.button key={f.id}
                                whileHover={{ scale:1.06 }}
                                whileTap={{ scale:0.94 }}
                                onClick={()=>setSelectedFrame(f.id)}
                                style={{
                                  padding:'6px 14px', borderRadius:'99px',
                                  background: active ? `${theme.primary}18` : 'var(--border)',
                                  border:`1px solid ${active ? theme.primary+'50' : 'var(--border)'}`,
                                  color: active ? theme.primary : 'var(--text-muted)',
                                  fontWeight: active ? 700 : 400,
                                  cursor:'pointer', fontSize:'0.78rem'
                                }}
                              >{f.label}</motion.button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div style={{
                      ...card, padding:'28px', textAlign:'center',
                      background:`${avatar.gradient.replace('linear-gradient','radial-gradient')}06`,
                      border:`1px solid ${avatar.ring}20` 
                    }}>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.78rem', marginBottom:'16px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                        Preview
                      </div>
                      <div style={{ position:'relative', display:'inline-block', marginBottom:'14px' }}>
                        <motion.div
                          animate={{ rotate:360 }}
                          transition={{ duration:10, repeat:Infinity, ease:'linear' }}
                          style={{
                            position:'absolute', inset:'-6px', borderRadius:'50%',
                            background:`conic-gradient(${avatar.ring}, transparent 40%, ${avatar.ring} 60%, transparent)`,
                            opacity:0.6
                          }}
                        />
                        <div style={{
                          width:'90px', height:'90px', borderRadius:'50%',
                          background:avatar.gradient,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'2.8rem', position:'relative', zIndex:1,
                          border: selectedFrame==='none' ? `3px solid ${avatar.ring}` : frame.style,
                          boxShadow:`0 0 30px ${avatar.ring}50` 
                        }}>{avatar.emoji}</div>
                      </div>
                      <div style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontWeight:700 }}>{profile.name}</div>
                      <div style={{ color:theme.primary, fontSize:'0.78rem' }}>@{profile.username}</div>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.72rem', marginTop:'4px' }}>{avatar.label} · {frame.label} Frame</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ NOTIFICATIONS TAB ═══════════════ */}
            {activeTab==='notifs' && (
              <motion.div key="notifs"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap:'20px' }}>
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 6px' }}>
                      🔔 Notification Preferences
                    </h3>
                    <p style={{ color:'#4B5563', fontSize:'0.8rem', margin:'0 0 20px' }}>Control what NutriAI notifies you about</p>
                    {NOTIF_OPTS.map((n,i) => (
                      <motion.div key={n.id}
                        initial={{ opacity:0, x:-20 }}
                        animate={{ opacity:1, x:0 }}
                        transition={{ delay:i*0.06 }}
                        style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'16px 18px', marginBottom:'8px',
                          background: notifs[n.id] ? `${theme.primary}06` : 'var(--border)',
                          border:`1px solid ${notifs[n.id] ? theme.primary+'20' : 'var(--border)'}`,
                          borderRadius:'14px', transition:'all 0.2s'
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <span style={{ fontSize:'1.3rem' }}>{n.icon}</span>
                          <div>
                            <div style={{ color: notifs[n.id] ? 'var(--text-faint)' : 'var(--text-muted)', fontWeight:600, fontSize:'0.88rem', transition:'color 0.2s' }}>{n.label}</div>
                            <div style={{ color:'#374151', fontSize:'0.72rem' }}>{n.desc}</div>
                          </div>
                        </div>
                        <Toggle on={notifs[n.id]} onChange={()=>setNotifs(p=>({...p,[n.id]:!p[n.id]}))} color={theme.primary}/>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    {/* Quick presets */}
                    <div style={{ ...card, padding:'24px' }}>
                      <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'0.95rem', fontWeight:700, margin:'0 0 14px' }}>
                        ⚡ Quick Presets
                      </h3>
                      {[
                        { label:'All On',    fn:()=>setNotifs(Object.fromEntries(NOTIF_OPTS.map(n=>[n.id,true]))),  color:'#15B2CF' },
                        { label:'All Off',   fn:()=>setNotifs(Object.fromEntries(NOTIF_OPTS.map(n=>[n.id,false]))), color:'#EF4444' },
                        { label:'Essential', fn:()=>setNotifs({meal:true,workout:true,water:false,streak:true,badge:false,report:true,ai:false,challenge:false}), color:theme.primary },
                      ].map(p => (
                        <motion.button key={p.label}
                          whileHover={{ scale:1.03, x:4 }}
                          whileTap={{ scale:0.97 }}
                          onClick={p.fn}
                          style={{
                            display:'block', width:'100%',
                            background:`${p.color}12`,
                            border:`1px solid ${p.color}25`,
                            borderRadius:'12px', padding:'10px 16px',
                            color:p.color, fontWeight:600, cursor:'pointer',
                            fontSize:'0.85rem', marginBottom:'8px',
                            textAlign:'left'
                          }}
                        >{p.label}</motion.button>
                      ))}
                    </div>
                    {/* Active count */}
                    <div style={{ ...card, padding:'24px', textAlign:'center', background:`${theme.primary}06`, border:`1px solid ${theme.primary}20` }}>
                      <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>🔔</div>
                      <div style={{ color:theme.primary, fontFamily:"'Clash Display',sans-serif", fontSize:'2rem', fontWeight:900 }}>
                        {Object.values(notifs).filter(Boolean).length}
                      </div>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>Active notifications</div>
                      <div style={{ color:'#374151', fontSize:'0.72rem', marginTop:'4px' }}>of {NOTIF_OPTS.length} total</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ PRIVACY TAB ═══════════════ */}
            {activeTab==='privacy' && (
              <motion.div key="privacy"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap:'20px' }}>
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.05rem', fontWeight:700, margin:'0 0 6px' }}>
                      🔒 Privacy Settings
                    </h3>
                    <p style={{ color:'#4B5563', fontSize:'0.8rem', margin:'0 0 20px' }}>Manage what others can see about you</p>
                    {PRIVACY_OPTS.map((p,i) => (
                      <motion.div key={p.id}
                        initial={{ opacity:0, x:-20 }}
                        animate={{ opacity:1, x:0 }}
                        transition={{ delay:i*0.07 }}
                        style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'16px 18px', marginBottom:'8px',
                          background: privacyS[p.id] ? 'rgba(79, 211, 237,0.05)' : 'var(--border)',
                          border:`1px solid ${privacyS[p.id] ? 'rgba(79, 211, 237,0.18)' : 'var(--border)'}`,
                          borderRadius:'14px', transition:'all 0.2s'
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <span style={{ fontSize:'1.3rem' }}>{p.icon}</span>
                          <div>
                            <div style={{ color: privacyS[p.id] ? 'var(--text-faint)' : 'var(--text-muted)', fontWeight:600, fontSize:'0.88rem' }}>{p.label}</div>
                            <div style={{ color:'#374151', fontSize:'0.72rem' }}>{p.desc}</div>
                          </div>
                        </div>
                        <Toggle on={privacyS[p.id]} onChange={()=>setPrivacyS(pp=>({...pp,[p.id]:!pp[p.id]}))} color='#4FD3ED'/>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ ...card, padding:'24px', height:'fit-content' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'0.95rem', fontWeight:700, margin:'0 0 14px' }}>
                      🛡️ Privacy Score
                    </h3>
                    {(() => {
                      const score = Math.round((Object.values(privacyS).filter(Boolean).length / PRIVACY_OPTS.length)*100)
                      const color = score > 70 ? '#15B2CF' : score > 40 ? '#FFD700' : '#1FA8C9'
                      return (
                        <>
                          <div style={{ position:'relative', width:'100px', margin:'0 auto 16px' }}>
                            <svg width="100" height="100" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="10"/>
                              <motion.circle
                                cx="50" cy="50" r="38"
                                fill="none" stroke={color} strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={2*Math.PI*38}
                                initial={{ strokeDashoffset:2*Math.PI*38 }}
                                animate={{ strokeDashoffset:2*Math.PI*38*(1-score/100) }}
                                transition={{ duration:1.2 }}
                                transform="rotate(-90 50 50)"
                                style={{ filter:`drop-shadow(0 0 4px ${color})` }}
                              />
                            </svg>
                            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                              <div style={{ color, fontWeight:900, fontSize:'1.4rem', fontFamily:"'Clash Display',sans-serif" }}>{score}</div>
                              <div style={{ color:'#4B5563', fontSize:'0.58rem' }}>Score</div>
                            </div>
                          </div>
                          <div style={{ color:color, textAlign:'center', fontWeight:700, fontSize:'0.88rem', marginBottom:'8px' }}>
                            {score > 70 ? '🛡️ Well Protected' : score > 40 ? '⚠️ Moderate' : '🔓 Very Open'}
                          </div>
                          <div style={{ color:'#4B5563', textAlign:'center', fontSize:'0.75rem', lineHeight:1.5 }}>
                            {Object.values(privacyS).filter(Boolean).length} of {PRIVACY_OPTS.length} privacy options active
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ CONNECTED APPS TAB ═══════════════ */}
            {activeTab==='apps' && (
              <motion.div key="apps"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'16px' }}>
                  {apps.map((app,i) => (
                    <motion.div key={app.name}
                      initial={{ opacity:0, scale:0.9 }}
                      animate={{ opacity:1, scale:1 }}
                      transition={{ delay:i*0.07, type:'spring' }}
                      whileHover={{ y:-6, boxShadow:`0 16px 40px ${app.color}20` }}
                      style={{
                        ...card, padding:'24px',
                        background: app.connected ? `${app.color}06` : 'var(--bg-card)',
                        border:`1px solid ${app.connected ? app.color+'25' : 'var(--border)'}`,
                        cursor:'pointer'
                      }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                        <motion.span
                          animate={app.connected ? { rotate:[0,10,-10,0] } : {}}
                          transition={{ duration:3, repeat:Infinity, delay:i*0.3 }}
                          style={{ fontSize:'2.2rem', filter: app.connected ? `drop-shadow(0 0 8px ${app.color})` : 'grayscale(0.8)' }}
                        >{app.icon}</motion.span>
                        <div style={{
                          background: app.connected ? `${app.color}15` : 'var(--border)',
                          border:`1px solid ${app.connected ? app.color+'30' : 'var(--border)'}`,
                          borderRadius:'99px', padding:'3px 10px',
                          color: app.connected ? app.color : '#4B5563',
                          fontSize:'0.68rem', fontWeight:700
                        }}>{app.connected ? '● Connected' : 'Disconnected'}</div>
                      </div>
                      <div style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontWeight:700, fontSize:'0.95rem', marginBottom:'4px' }}>
                        {app.name}
                      </div>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginBottom:'14px', lineHeight:1.4 }}>
                        {app.desc}
                      </div>
                      <motion.button
                        whileHover={{ scale:1.04 }}
                        whileTap={{ scale:0.96 }}
                        onClick={()=>setApps(p=>p.map(a=>a.name===app.name?{...a,connected:!a.connected}:a))}
                        style={{
                          width:'100%', padding:'9px',
                          background: app.connected ? 'rgba(239,68,68,0.12)' : `${app.color}18`,
                          border:`1px solid ${app.connected ? 'rgba(239,68,68,0.3)' : app.color+'35'}`,
                          borderRadius:'10px',
                          color: app.connected ? '#EF4444' : app.color,
                          cursor:'pointer', fontSize:'0.82rem', fontWeight:700
                        }}
                      >{app.connected ? '🔌 Disconnect' : `🔗 Connect ${app.name}`}</motion.button>
                    </motion.div>
                  ))}
                </div>

                <div style={{ ...card, padding:'24px', marginTop:'20px', textAlign:'center' }}>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:'8px' }}>
                    Connected: <span style={{ color:theme.primary, fontWeight:700 }}>{apps.filter(a=>a.connected).length}</span> of {apps.length} apps
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', gap:'8px' }}>
                    {apps.map(a => (
                      <div key={a.name} style={{
                        width:'10px', height:'10px', borderRadius:'50%',
                        background: a.connected ? a.color : 'var(--border)',
                        boxShadow: a.connected ? `0 0 8px ${a.color}` : 'none'
                      }}/>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ═══════════════ AVATAR MODAL ═══════════════ */}
        <AnimatePresence>
          {showAvatarModal && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{
                position:'fixed', inset:0, zIndex:300,
                background:'var(--shadow-color)', backdropFilter:'blur(16px)',
                display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'
              }}
              onClick={e=>e.target===e.currentTarget&&setShowAvatarModal(false)}
            >
              <motion.div
                initial={{ scale:0.7, opacity:0, y:60 }}
                animate={{ scale:1, opacity:1, y:0 }}
                exit={{ scale:0.7, opacity:0 }}
                transition={{ type:'spring', stiffness:260, damping:22 }}
                style={{
                  width:'100%',
                  background:'rgba(10,10,18,0.99)',
                  border:`1px solid ${theme.primary}30`,
                  borderRadius:'32px',
                  boxShadow:`0 60px 120px var(--shadow-color), 0 0 80px ${theme.primary}15`,
                  overflow:'hidden'
                }}
              >
                <div style={{ height:'3px', background:`linear-gradient(90deg,${theme.primary},${theme.secondary},transparent)` }}/>
                <div style={{ padding:'32px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
                    <h2 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.4rem', fontWeight:800, margin:0 }}>
                      ✨ Choose Your Avatar
                    </h2>
                    <button onClick={()=>setShowAvatarModal(false)} style={{
                      background:'var(--border)', border:'1px solid var(--border)',
                      borderRadius:'50%', width:'36px', height:'36px',
                      color:'var(--text-muted)', cursor:'pointer', fontSize:'1rem'
                    }}>✕</button>
                  </div>

                  {/* Big preview */}
                  <div style={{ textAlign:'center', marginBottom:'24px' }}>
                    <div style={{ position:'relative', display:'inline-block' }}>
                      <motion.div
                        key={selectedAvatar}
                        animate={{ rotate:360 }}
                        transition={{ duration:10, repeat:Infinity, ease:'linear' }}
                        style={{
                          position:'absolute', inset:'-8px', borderRadius:'50%',
                          background:`conic-gradient(${avatar.ring}, transparent 40%, ${avatar.ring} 60%, transparent)`,
                          opacity:0.7
                        }}
                      />
                      <motion.div
                        key={`av-${selectedAvatar}`}
                        initial={{ scale:0.5, rotate:-15 }}
                        animate={{ scale:1, rotate:0 }}
                        transition={{ type:'spring', stiffness:300 }}
                        style={{
                          width:'100px', height:'100px', borderRadius:'50%',
                          background:avatar.gradient,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'3.5rem', position:'relative', zIndex:1,
                          border:`3px solid ${avatar.ring}`,
                          boxShadow:`0 0 40px ${avatar.ring}60` 
                        }}
                      >{avatar.emoji}</motion.div>
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontWeight:700, marginTop:'10px', fontSize:'0.95rem' }}>{avatar.label}</div>
                    <div style={{ color:avatar.ring, fontSize:'0.78rem' }}>Selected</div>
                  </div>

                  {/* Grid */}
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'10px', marginBottom:'20px' }}>
                    {AVATAR_STYLES.map(a => (
                      <motion.div key={a.id}
                        whileHover={{ scale:1.1, y:-4 }}
                        whileTap={{ scale:0.9 }}
                        onClick={()=>setSelectedAvatar(a.id)}
                        style={{
                          display:'flex', flexDirection:'column', alignItems:'center', gap:'5px',
                          cursor:'pointer', padding:'8px', borderRadius:'16px',
                          background: selectedAvatar===a.id ? `${a.ring}15` : 'transparent',
                          border:`1px solid ${selectedAvatar===a.id ? a.ring+'50' : 'transparent'}`,
                          transition:'all 0.2s'
                        }}
                      >
                        <div style={{
                          width:'56px', height:'56px', borderRadius:'18px',
                          background:a.gradient,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'1.8rem',
                          boxShadow: selectedAvatar===a.id ? `0 0 16px ${a.ring}60` : 'none',
                          border:`2px solid ${selectedAvatar===a.id ? a.ring : 'transparent'}`,
                          transition:'all 0.2s'
                        }}>{a.emoji}</div>
                        <div style={{ color: selectedAvatar===a.id ? a.ring : '#4B5563', fontSize:'0.68rem', fontWeight:selectedAvatar===a.id?700:400 }}>
                          {a.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Frame picker */}
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ color:'#4B5563', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'10px' }}>
                      Avatar Frame
                    </div>
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      {FRAME_STYLES.map(f => (
                        <motion.button key={f.id}
                          whileHover={{ scale:1.06 }}
                          whileTap={{ scale:0.94 }}
                          onClick={()=>setSelectedFrame(f.id)}
                          style={{
                            padding:'7px 16px', borderRadius:'99px',
                            background: selectedFrame===f.id ? `${theme.primary}18` : 'var(--border)',
                            border:`1px solid ${selectedFrame===f.id ? theme.primary+'50' : 'var(--border)'}`,
                            color: selectedFrame===f.id ? theme.primary : 'var(--text-muted)',
                            fontWeight: selectedFrame===f.id ? 700 : 400,
                            cursor:'pointer', fontSize:'0.8rem'
                          }}
                        >{f.label}</motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale:1.03, boxShadow:`0 8px 30px ${theme.primary}40` }}
                    whileTap={{ scale:0.97 }}
                    onClick={()=>setShowAvatarModal(false)}
                    style={{
                      width:'100%', padding:'14px',
                      background:`linear-gradient(135deg,${theme.primary},${theme.secondary})`,
                      border:'none', borderRadius:'14px',
                      color:'#000', fontWeight:900, cursor:'pointer',
                      fontSize:'0.95rem', fontFamily:"'Clash Display',sans-serif"
                    }}
                  >✅ Apply Avatar</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
