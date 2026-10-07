'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMeals, logMeal, deleteMeal, getCurrentUser, ml } from '../../lib/api'
import {
  searchFoods, scaleFood,
  getRecentFoods, addRecentFood,
  getFavoriteFoods, toggleFavorite, isFavorite,
} from '../../lib/foods-db'
import useIsMobile from '../../lib/useIsMobile'
import ScenicBackdrop from '@/components/shared/ScenicBackdrop'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const PORTIONS = [
  { label: '½×', factor: 0.5 },
  { label: '1×', factor: 1 },
  { label: '1½×', factor: 1.5 },
  { label: '2×', factor: 2 },
]

export default function MealLogger() {
  const isMobile = useIsMobile()
  const [activeMeal, setActiveMeal] = useState('Breakfast')
  const [search, setSearch] = useState('')
  const [logged, setLogged] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  // Food search state: portion sheet, recents, favorites
  const [portionFood, setPortionFood] = useState(null)
  const [portion, setPortion] = useState(1)
  const [recents, setRecents] = useState([])
  const [favs, setFavs] = useState([])
  const [favOnly, setFavOnly] = useState(false)

  useEffect(() => {
    const loadTodayMeals = async () => {
      try {
        setLoading(true)
        setError('')
        const meals = await getMeals()
        if (meals) {
          // Group meals by type and filter for today (local timezone, not UTC)
          const now = new Date()
          const todayMeals = meals.filter(meal => {
            if (!meal.date) return false
            const md = new Date(meal.date)
            return md.getFullYear() === now.getFullYear() &&
                   md.getMonth() === now.getMonth() &&
                   md.getDate() === now.getDate()
          })
          setLogged(todayMeals)
        }
      } catch (err) {
        console.error('Meal load error:', err)
        setError('Failed to load meals')
      } finally {
        setLoading(false)
      }
    }

    loadTodayMeals()
  }, [])

  const card = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(26px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(26px) saturate(1.6)',
    border: '1px solid var(--glass-border)',
    borderRadius: '26px',
    padding: '24px',
    boxShadow: 'var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)',
  }

  const searching = search.trim().length > 0
  const results = searching ? searchFoods(search) : []
  const favList = favOnly ? getFavoriteFoods() : []

  useEffect(() => {
    if (showSearch) {
      setRecents(getRecentFoods())
      setFavs(getFavoriteFoods())
      setFavOnly(false)
      setPortionFood(null)
      setPortion(1)
    }
  }, [showSearch])

  const totals = logged.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const addFood = async (food) => {
    try {
      // foods-db uses kcal/p/c/f; backend expects calories/protein/carbs/fat
      const mealData = {
        name: food.name,
        calories: Math.round(food.kcal ?? food.calories ?? 0),
        protein: food.p ?? food.protein ?? 0,
        carbs: food.c ?? food.carbs ?? 0,
        fat: food.f ?? food.fat ?? 0,
        mealType: activeMeal,
      }
      addRecentFood(food.name)
      setRecents(getRecentFoods())
      const res = await logMeal(mealData)
      if (res && res.data) {
        // Use the returned meal which has the database ID
        setLogged(prev => [...prev, res.data])
      } else {
        // Fallback optimistic update
        setLogged(prev => [...prev, { ...mealData, id: Date.now().toString() }])
      }
    } catch (err) {
      console.error('Failed to log meal to backend:', err)
      // Optimistic update on error to keep UI functional
      setLogged(prev => [...prev, { ...mealData, id: Date.now().toString() }])
    }
    setShowSearch(false)
    setSearch('')
  }

  // Voice logging: speech → search text → the page's existing food-search flow.
  const recognitionRef = useRef(null)

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceError('Voice input is not supported in this browser — please type instead.')
      return
    }
    if (recognitionRef.current) return // already listening
    const rec = new SR()
    recognitionRef.current = rec
    rec.lang = 'en-GB'
    rec.interimResults = false
    rec.maxAlternatives = 1
    setListening(true)
    setVoiceError('')
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript
      if (transcript) {
        // Reuse the existing text flow: fill the search box and open the
        // food picker so matching entries are shown for one tap to log.
        setSearch(transcript)
        setShowSearch(true)
      }
    }
    rec.onerror = () => {
      setVoiceError('Could not hear you — please try again or type instead.')
    }
    rec.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    try { rec.start() } catch {
      recognitionRef.current = null
      setListening(false)
    }
  }

  const addCustom = () => {
    if (!custom.name || !custom.calories) return
    addFood({
      name: custom.name,
      calories: parseInt(custom.calories) || 0,
      protein: parseInt(custom.protein) || 0,
      carbs: parseInt(custom.carbs) || 0,
      fat: parseInt(custom.fat) || 0,
      emoji: '🍽️'
    })
    setCustom({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowCustom(false)
  }

  const removeFood = async (idx) => {
    const mealToRemove = logged[idx]
    if (!mealToRemove) return

    // Update UI immediately (optimistic UI)
    setLogged(prev => prev.filter((_, i) => i !== idx))

    // Only persisted meals have backend IDs — optimistic entries use numeric
    // timestamps (Date.now()), backend ids are cuid() which always contain letters
    const isPersisted = typeof mealToRemove.id === 'string' && /[a-zA-Z]/.test(mealToRemove.id)
    if (isPersisted) {
      try {
        await deleteMeal(mealToRemove.id)
      } catch (err) {
        console.error('Failed to delete meal from backend:', err)
        // Revert the optimistic removal so the meal isn't silently lost
        setLogged(prev => {
          const next = [...prev]
          next.splice(Math.min(idx, next.length), 0, mealToRemove)
          return next
        })
      }
    }
  }

  const toggleFav = (name) => {
    toggleFavorite(name)
    setFavs(getFavoriteFoods())
  }

  const renderFoodRow = (food) => {
    const fav = isFavorite(food.name)
    return (
      <motion.div
        key={food.name}
        whileHover={{ backgroundColor: 'rgba(255, 107, 94,0.05)', x: 4 }}
        onClick={() => { setPortionFood(food); setPortion(1) }}
        role="button"
        tabIndex={0}
        aria-label={`Log ${food.name}, ${food.kcal} kilocalories`}
        onKeyDown={(e) => { if (e.key === 'Enter') { setPortionFood(food); setPortion(1) } }}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px', borderRadius: '12px',
          cursor: 'pointer', marginBottom: '6px',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <span style={{ fontSize: '1.5rem' }} aria-hidden="true">{food.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>{food.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {food.serving} · P:{food.p}g · C:{food.c}g · F:{food.f}g
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            aria-label={fav ? `Remove ${food.name} from favorites` : `Add ${food.name} to favorites`}
            aria-pressed={fav}
            onClick={(e) => { e.stopPropagation(); toggleFav(food.name) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.1rem', opacity: fav ? 1 : 0.35, padding: '4px',
            }}
          >{fav ? '⭐' : '☆'}</button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#FF6B5E', fontWeight: 700 }}>{food.kcal}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>kcal</div>
          </div>
        </div>
      </motion.div>
    )
  }

  const sectionTitle = (t) => (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '14px 4px 8px' }}>{t}</div>
  )

  const mealGroups = MEAL_TYPES.map(type => ({
    type,
    items: logged.filter(l => l.mealType === type),
    total: logged.filter(l => l.mealType === type).reduce((a, m) => a + m.calories, 0)
  }))

  const inputStyle = {
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'Satoshi', sans-serif",
  }

  return (
      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
      <ScenicBackdrop />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{
              fontFamily: "'Clash Display',sans-serif",
              fontSize: '2rem', fontWeight: 700,
              color: 'var(--text-primary)', margin: 0, marginBottom: '6px'
            }}>Log Meal 🍽️</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Track your nutrition for today
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startVoice}
              title={listening ? 'Listening…' : 'Log by voice'}
              style={{
                background: listening ? 'rgba(255, 107, 94,0.25)' : 'rgba(255, 107, 94,0.1)',
                border: listening ? '1px solid #FF6B5E' : '1px solid rgba(255, 107, 94,0.3)',
                borderRadius: '12px', padding: '10px 18px',
                color: '#FF6B5E', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
              <motion.span
                animate={listening ? { scale: [1, 1.3, 1] } : {}}
                transition={listening ? { duration: 1, repeat: Infinity } : {}}
              >🎙️</motion.span>
              {listening ? 'Listening…' : 'Voice'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowCamera(true) }}
              style={{
                background: 'rgba(255, 107, 94,0.1)',
                border: '1px solid rgba(255, 107, 94,0.3)',
                borderRadius: '12px', padding: '10px 18px',
                color: '#FF6B5E', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
              📸 Scan Food
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(true)}
              style={{
                background: 'linear-gradient(135deg,#FF6B5E,#FFB020)',
                border: 'none', borderRadius: '12px',
                padding: '10px 18px', color: '#000',
                cursor: 'pointer', fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
              + Add Food
            </motion.button>
          </div>
        </div>

        {/* VOICE ERROR */}
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '16px', padding: '10px 16px',
              background: 'rgba(255,107,94,0.08)',
              border: '1px solid rgba(255,107,94,0.3)',
              borderRadius: '12px', color: '#E14E42', fontSize: '0.85rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
            <span>{voiceError}</span>
            <button
              onClick={() => setVoiceError('')}
              style={{ background: 'none', border: 'none', color: '#E14E42', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </motion.div>
        )}

        {/* DAILY SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...card, marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(255, 107, 94,0.08), rgba(255, 176, 32,0.05))',
            border: '1px solid rgba(255, 107, 94,0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Total Today
              </div>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '2.5rem', fontWeight: 700, color: '#FF6B5E' }}>
                {totals.calories}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}> / 1800 kcal</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { label: 'Protein', val: totals.protein, color: '#15B2CF', unit: 'g' },
                { label: 'Carbs', val: totals.carbs, color: '#FFB020', unit: 'g' },
                { label: 'Fat', val: totals.fat, color: '#7B61FF', unit: 'g' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ color: m.color, fontFamily: "'Clash Display',sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>
                    {m.val}{m.unit}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{m.label}</div>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Daily Goal</span>
                <span style={{ color: '#FF6B5E', fontSize: '0.8rem', fontWeight: 600 }}>
                  {Math.round((totals.calories / 1800) * 100)}%
                </span>
              </div>
              <div style={{ height: '10px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.calories / 1800) * 100, 100)}%` }}
                  transition={{ duration: 1 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg,#FF6B5E,#FFB020)',
                    borderRadius: '99px',
                    boxShadow: '0 0 10px rgba(255, 107, 94,0.4)'
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* MEAL TYPE TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {MEAL_TYPES.map(type => {
            const count = logged.filter(l => l.mealType === type).length
            const active = activeMeal === type
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveMeal(type)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '99px',
                  border: active ? 'none' : '1px solid var(--border)',
                  background: active
                    ? 'linear-gradient(135deg,#FF6B5E,#FFB020)'
                    : 'var(--bg-card)',
                  color: active ? '#000' : 'var(--text-muted)',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: "'Satoshi',sans-serif",
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                {type}
                {count > 0 && (
                  <span style={{
                    background: active ? 'var(--shadow-color)' : 'rgba(255, 107, 94,0.2)',
                    borderRadius: '99px', padding: '1px 8px',
                    fontSize: '0.75rem', color: active ? '#000' : '#FF6B5E'
                  }}>{count}</span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* MEAL GROUPS */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
          {mealGroups.map((group, gi) => (
            <motion.div
              key={group.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.1 }}
              style={card}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {group.type === 'Breakfast' ? '🌅' :
                    group.type === 'Lunch' ? '☀️' :
                      group.type === 'Dinner' ? '🌙' : '🍎'} {group.type}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {group.total} kcal
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setActiveMeal(group.type); setShowSearch(true) }}
                    style={{
                      background: 'rgba(255, 107, 94,0.1)',
                      border: '1px solid rgba(255, 107, 94,0.2)',
                      borderRadius: '8px', padding: '4px 10px',
                      color: '#FF6B5E', cursor: 'pointer',
                      fontSize: '0.78rem', fontWeight: 600
                    }}>+ Add</motion.button>
                </div>
              </div>

              {group.items.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '24px',
                  color: 'var(--text-muted)', fontSize: '0.85rem',
                  border: '1px dashed var(--border)',
                  borderRadius: '12px'
                }}>
                  No foods logged yet
                </div>
              ) : (
                <AnimatePresence>
                  {group.items.map((item, idx) => {
                    const realIdx = logged.findIndex((l, i) =>
                      l.name === item.name && l.mealType === group.type &&
                      logged.filter((ll, ii) => ll.name === item.name && ll.mealType === group.type && ii <= i).length ===
                      group.items.filter((gi2, ii2) => gi2.name === item.name && ii2 <= idx).length
                    )
                    return (
                      <motion.div
                        key={`${item.name}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: 'var(--border)',
                          marginBottom: '8px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>{item.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#FF6B5E', fontWeight: 700, fontSize: '0.9rem' }}>
                            {item.calories}
                          </span>
                          <button
                            onClick={() => removeFood(realIdx)}
                            style={{
                              background: 'rgba(255,59,48,0.1)',
                              border: '1px solid rgba(255,59,48,0.2)',
                              borderRadius: '8px', padding: '3px 8px',
                              color: '#FF3B30', cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}>✕</button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </motion.div>
          ))}
        </div>

        {/* SEARCH MODAL */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'var(--shadow-color)',
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
              }}
              onClick={(e) => e.target === e.currentTarget && setShowSearch(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  ...card,
                  width: '100%', maxWidth: '520px',
                  maxHeight: '80vh', overflowY: 'auto'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontFamily: "'Clash Display',sans-serif", color: 'var(--text-primary)', margin: 0, fontSize: '1.3rem' }}>
                    Add to {activeMeal}
                  </h2>
                  <button
                    onClick={() => setShowSearch(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    autoFocus
                    placeholder="Search 140+ foods..."
                    aria-label="Search foods"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setFavOnly(false) }}
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  />
                  <button
                    onClick={() => setFavOnly(v => !v)}
                    aria-pressed={favOnly}
                    aria-label="Show favorites only"
                    title="Favorites only"
                    style={{
                      padding: '0 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem',
                      background: favOnly ? 'rgba(255,176,32,0.15)' : 'var(--border)',
                      border: favOnly ? '1px solid #FFB020' : '1px solid var(--border)',
                    }}
                  >⭐</button>
                </div>

                <button
                  onClick={() => { setShowCustom(true); setShowSearch(false) }}
                  style={{
                    width: '100%', padding: '10px',
                    background: 'rgba(123,97,255,0.1)',
                    border: '1px dashed rgba(123,97,255,0.3)',
                    borderRadius: '12px', color: '#7B61FF',
                    cursor: 'pointer', marginBottom: '16px',
                    fontSize: '0.85rem', fontWeight: 600
                  }}>
                  + Add Custom Food
                </button>

                {/* RESULTS / SECTIONS */}
                {portionFood ? (
                  <div>
                    <button
                      onClick={() => setPortionFood(null)}
                      aria-label="Back to food list"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '12px', padding: 0 }}
                    >← Back to results</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '2.2rem' }} aria-hidden="true">{portionFood.emoji}</span>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' }}>{portionFood.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>per {portionFood.serving}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }} role="group" aria-label="Portion size">
                      {PORTIONS.map(p => (
                        <button
                          key={p.factor}
                          onClick={() => setPortion(p.factor)}
                          aria-pressed={portion === p.factor}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: '12px', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.9rem',
                            background: portion === p.factor ? 'rgba(255,107,94,0.15)' : 'var(--border)',
                            border: portion === p.factor ? '1px solid #FF6B5E' : '1px solid var(--border)',
                            color: portion === p.factor ? '#FF6B5E' : 'var(--text-primary)',
                          }}
                        >{p.label}</button>
                      ))}
                    </div>
                    {(() => {
                      const s = scaleFood(portionFood, portion)
                      return (
                        <div style={{
                          display: 'flex', justifyContent: 'space-around',
                          padding: '14px', borderRadius: '14px', marginBottom: '16px',
                          background: 'rgba(255,107,94,0.06)', border: '1px solid var(--border)',
                        }}>
                          {[['kcal', s.kcal, '#FF6B5E'], ['Protein', `${s.p}g`, '#7B61FF'], ['Carbs', `${s.c}g`, '#2FBF9B'], ['Fat', `${s.f}g`, '#FFB020']].map(([l, v, c]) => (
                            <div key={l} style={{ textAlign: 'center' }}>
                              <div style={{ color: c, fontWeight: 700, fontSize: '1.05rem' }}>{v}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{l}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    <button
                      onClick={() => { addFood(scaleFood(portionFood, portion)) }}
                      style={{
                        width: '100%', padding: '13px', borderRadius: '14px', border: 'none',
                        background: 'linear-gradient(135deg, #FF6B5E, #FF8E53)', color: '#fff',
                        fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                      }}
                    >Log {portion}× to {activeMeal}</button>
                  </div>
                ) : (
                  <>
                    {!searching && !favOnly && (
                      <>
                        {favs.length > 0 && (<>{sectionTitle('⭐ Favorites')}{favs.map(renderFoodRow)}</>)}
                        {recents.length > 0 && (<>{sectionTitle('🕘 Recently logged')}{recents.map(renderFoodRow)}</>)}
                        {favs.length === 0 && recents.length === 0 && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 12px' }}>
                            Search 140+ Indian & global foods above —<br />or tap ☆ on any food to pin it here.
                          </div>
                        )}
                      </>
                    )}
                    {searching && results.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 12px' }}>
                        No matches for “{search}”.<br />Try “Add Custom Food” below — or check spelling.
                      </div>
                    )}
                    {(searching ? results : favOnly ? favList : []).map(renderFoodRow)}
                    {favOnly && favList.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 12px' }}>
                        No favorites yet — tap ☆ on any food to pin it.
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CUSTOM FOOD MODAL */}
        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'var(--shadow-color)',
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{ ...card, width: '100%', maxWidth: '420px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontFamily: "'Clash Display',sans-serif", color: 'var(--text-primary)', margin: 0 }}>Custom Food</h2>
                  <button onClick={() => setShowCustom(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
                {[
                  { key: 'name', label: 'Food Name', placeholder: 'e.g. Homemade Dal' },
                  { key: 'calories', label: 'Calories', placeholder: 'kcal' },
                  { key: 'protein', label: 'Protein (g)', placeholder: 'grams' },
                  { key: 'carbs', label: 'Carbs (g)', placeholder: 'grams' },
                  { key: 'fat', label: 'Fat (g)', placeholder: 'grams' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '12px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                    <input
                      placeholder={f.placeholder}
                      value={custom[f.key]}
                      onChange={e => setCustom(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <button
                  onClick={addCustom}
                  style={{
                    width: '100%', padding: '12px', marginTop: '8px',
                    background: 'linear-gradient(135deg,#FF6B5E,#FFB020)',
                    border: 'none', borderRadius: '12px',
                    color: '#000', fontWeight: 700, cursor: 'pointer',
                    fontSize: '0.95rem', fontFamily: "'Satoshi',sans-serif"
                  }}>Add Food ✓</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAMERA MODAL */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'var(--shadow-color)',
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ ...card, width: '100%', maxWidth: '420px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📸</div>
                <h2 style={{ fontFamily: "'Clash Display',sans-serif", color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Scan Food
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
                  Take a photo of your food and AI will detect calories automatically
                </p>
                <div 
                  onClick={() => !isScanning && document.getElementById('food-input').click()}
                  style={{
                    border: isScanning ? '2px solid #FF6B5E' : '2px dashed rgba(255, 107, 94,0.3)',
                    borderRadius: '16px', padding: '40px',
                    marginBottom: '20px', cursor: isScanning ? 'wait' : 'pointer',
                    background: 'rgba(255, 107, 94,0.03)',
                    transition: 'all 0.3s'
                  }}
                >
                  <input 
                    id="food-input" 
                    type="file" 
                    accept="image/*" 
                    hidden 
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      // Reset so re-selecting the same photo retriggers onChange
                      e.target.value = ''
                      if (!file) return
                      
                      setIsScanning(true)
                      setScanError('')
                      try {
                        const formData = new FormData()
                        formData.append('image', file)
                        const res = await ml.detect(formData)

                        // Backend returns { foods: [{ name, calories, confidence }], total_calories }
                        const foods = res.data?.foods || []
                        if (foods.length > 0) {
                          // Log every detected item (a plate photo often has several),
                          // highest confidence first
                          const sorted = [...foods].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                          for (const item of sorted) {
                            await addFood({
                              name: item.name || 'Detected Food',
                              calories: Math.round(item.calories || 0),
                              protein: 0,
                              carbs: 0,
                              fat: 0,
                              emoji: '🤖'
                            })
                          }
                          setShowCamera(false)
                        } else {
                          setScanError('Could not identify food. Please try another photo.')
                        }
                      } catch (err) {
                        console.error('Scan error:', err)
                        setScanError('AI Service error. Please try again later.')
                      } finally {
                        setIsScanning(false)
                      }
                    }}
                  />
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                    {isScanning ? '🔍' : '🤖'}
                  </div>
                  <div style={{ color: '#FF6B5E', fontSize: '0.9rem', fontWeight: 600 }}>
                    {isScanning ? 'AI is analyzing...' : 'Click to Upload Photo'}
                  </div>
                  {scanError && (
                    <div style={{ color: '#E14E42', fontSize: '0.8rem', marginTop: '8px' }}>
                      {scanError}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                    AI vision food detection
                  </div>
                </div>
                <button
                  onClick={() => setShowCamera(false)}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'var(--border)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px', color: 'var(--text-primary)',
                    cursor: 'pointer', fontSize: '0.9rem'
                  }}>Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
  )
}
