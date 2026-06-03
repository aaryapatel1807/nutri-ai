'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMeals, logMeal, deleteMeal, getCurrentUser, ml } from '../../lib/api'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const SAMPLE_FOODS = [
  { name: 'Oatmeal with Banana', calories: 320, protein: 12, carbs: 58, fat: 6, emoji: '🥣' },
  { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 4, emoji: '🍗' },
  { name: 'Dal Rice', calories: 380, protein: 14, carbs: 72, fat: 4, emoji: '🍛' },
  { name: 'Egg Bhurji (2 eggs)', calories: 210, protein: 14, carbs: 4, fat: 15, emoji: '🍳' },
  { name: 'Paneer Tikka (100g)', calories: 265, protein: 18, carbs: 8, fat: 18, emoji: '🧀' },
  { name: 'Mixed Fruit Bowl', calories: 120, protein: 2, carbs: 28, fat: 1, emoji: '🍱' },
  { name: 'Roti (2 pieces)', calories: 180, protein: 5, carbs: 36, fat: 2, emoji: '🫓' },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 1, emoji: '🥛' },
  { name: 'Banana', calories: 89, protein: 1, carbs: 23, fat: 0, emoji: '🍌' },
  { name: 'Almonds (30g)', calories: 174, protein: 6, carbs: 6, fat: 15, emoji: '🥜' },
  { name: 'Protein Shake', calories: 150, protein: 25, carbs: 8, fat: 3, emoji: '🥤' },
  { name: 'Rajma Chawal', calories: 420, protein: 16, carbs: 78, fat: 5, emoji: '🍲' },
]

export default function MealLogger() {
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

  useEffect(() => {
    const loadTodayMeals = async () => {
      try {
        setLoading(true)
        setError('')
        const meals = await getMeals()
        if (meals) {
          // Group meals by type and filter for today
          const today = new Date().toISOString().split('T')[0]
          const todayMeals = meals.filter(meal => 
            meal.date && meal.date.startsWith(today)
          )
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
    background: 'rgba(22,22,31,0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }

  const filtered = SAMPLE_FOODS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const totals = logged.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const addFood = async (food) => {
    try {
      const mealData = {
        name: food.name,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        mealType: activeMeal,
      }
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
      setLogged(prev => [...prev, { ...food, mealType: activeMeal, id: Date.now().toString() }])
    }
    setShowSearch(false)
    setSearch('')
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
    
    // Update UI immediately (optimistic UI)
    setLogged(prev => prev.filter((_, i) => i !== idx))
    
    // If it has a database ID, delete it from the backend
    if (mealToRemove && mealToRemove.id && typeof mealToRemove.id === 'string' && mealToRemove.id.length > 10) {
      try {
        await deleteMeal(mealToRemove.id)
      } catch (err) {
        console.error('Failed to delete meal from backend:', err)
        // If deletion failed, we could optionally revert the UI change here
      }
    }
  }

  const mealGroups = MEAL_TYPES.map(type => ({
    type,
    items: logged.filter(l => l.mealType === type),
    total: logged.filter(l => l.mealType === type).reduce((a, m) => a + m.calories, 0)
  }))

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#F0F0FF',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'Satoshi', sans-serif",
  }

  return (
      <div style={{ width: '100%' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{
              fontFamily: "'Clash Display',sans-serif",
              fontSize: '2rem', fontWeight: 700,
              color: 'white', margin: 0, marginBottom: '6px'
            }}>Log Meal 🍽️</h1>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '0.9rem' }}>
              Track your nutrition for today
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowCamera(true) }}
              style={{
                background: 'rgba(0,255,135,0.1)',
                border: '1px solid rgba(0,255,135,0.3)',
                borderRadius: '12px', padding: '10px 18px',
                color: '#00FF87', cursor: 'pointer',
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
                background: 'linear-gradient(135deg,#00FF87,#00D4FF)',
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

        {/* DAILY SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...card, marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,212,255,0.05))',
            border: '1px solid rgba(0,255,135,0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Total Today
              </div>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '2.5rem', fontWeight: 700, color: '#00FF87' }}>
                {totals.calories}
                <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: 400 }}> / 1800 kcal</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { label: 'Protein', val: totals.protein, color: '#00FF87', unit: 'g' },
                { label: 'Carbs', val: totals.carbs, color: '#7B61FF', unit: 'g' },
                { label: 'Fat', val: totals.fat, color: '#FF6B35', unit: 'g' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ color: m.color, fontFamily: "'Clash Display',sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>
                    {m.val}{m.unit}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{m.label}</div>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>Daily Goal</span>
                <span style={{ color: '#00FF87', fontSize: '0.8rem', fontWeight: 600 }}>
                  {Math.round((totals.calories / 1800) * 100)}%
                </span>
              </div>
              <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.calories / 1800) * 100, 100)}%` }}
                  transition={{ duration: 1 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg,#00FF87,#00D4FF)',
                    borderRadius: '99px',
                    boxShadow: '0 0 10px rgba(0,255,135,0.4)'
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
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  background: active
                    ? 'linear-gradient(135deg,#00FF87,#00D4FF)'
                    : 'rgba(22,22,31,0.8)',
                  color: active ? '#000' : '#9CA3AF',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: "'Satoshi',sans-serif",
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                {type}
                {count > 0 && (
                  <span style={{
                    background: active ? 'rgba(0,0,0,0.2)' : 'rgba(0,255,135,0.2)',
                    borderRadius: '99px', padding: '1px 8px',
                    fontSize: '0.75rem', color: active ? '#000' : '#00FF87'
                  }}>{count}</span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* MEAL GROUPS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {mealGroups.map((group, gi) => (
            <motion.div
              key={group.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.1 }}
              style={card}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '1rem', color: 'white', fontWeight: 600 }}>
                  {group.type === 'Breakfast' ? '🌅' :
                    group.type === 'Lunch' ? '☀️' :
                      group.type === 'Dinner' ? '🌙' : '🍎'} {group.type}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>
                    {group.total} kcal
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setActiveMeal(group.type); setShowSearch(true) }}
                    style={{
                      background: 'rgba(0,255,135,0.1)',
                      border: '1px solid rgba(0,255,135,0.2)',
                      borderRadius: '8px', padding: '4px 10px',
                      color: '#00FF87', cursor: 'pointer',
                      fontSize: '0.78rem', fontWeight: 600
                    }}>+ Add</motion.button>
                </div>
              </div>

              {group.items.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '24px',
                  color: '#6B7280', fontSize: '0.85rem',
                  border: '1px dashed rgba(255,255,255,0.08)',
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
                          background: 'rgba(255,255,255,0.03)',
                          marginBottom: '8px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                          <div>
                            <div style={{ color: '#F0F0FF', fontSize: '0.85rem', fontWeight: 500 }}>{item.name}</div>
                            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                              P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#00FF87', fontWeight: 700, fontSize: '0.9rem' }}>
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
                background: 'rgba(0,0,0,0.7)',
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
                  <h2 style={{ fontFamily: "'Clash Display',sans-serif", color: 'white', margin: 0, fontSize: '1.3rem' }}>
                    Add to {activeMeal}
                  </h2>
                  <button
                    onClick={() => setShowSearch(false)}
                    style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                <input
                  autoFocus
                  placeholder="Search foods..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '16px' }}
                />

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

                {filtered.map((food, i) => (
                  <motion.div
                    key={food.name}
                    whileHover={{ backgroundColor: 'rgba(0,255,135,0.05)', x: 4 }}
                    onClick={() => addFood(food)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px', borderRadius: '12px',
                      cursor: 'pointer', marginBottom: '6px',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{food.emoji}</span>
                      <div>
                        <div style={{ color: '#F0F0FF', fontSize: '0.9rem', fontWeight: 500 }}>{food.name}</div>
                        <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                          P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#00FF87', fontWeight: 700 }}>{food.calories}</div>
                      <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>kcal</div>
                    </div>
                  </motion.div>
                ))}
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
                background: 'rgba(0,0,0,0.7)',
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
                  <h2 style={{ fontFamily: "'Clash Display',sans-serif", color: 'white', margin: 0 }}>Custom Food</h2>
                  <button onClick={() => setShowCustom(false)}
                    style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
                {[
                  { key: 'name', label: 'Food Name', placeholder: 'e.g. Homemade Dal' },
                  { key: 'calories', label: 'Calories', placeholder: 'kcal' },
                  { key: 'protein', label: 'Protein (g)', placeholder: 'grams' },
                  { key: 'carbs', label: 'Carbs (g)', placeholder: 'grams' },
                  { key: 'fat', label: 'Fat (g)', placeholder: 'grams' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '12px' }}>
                    <label style={{ color: '#9CA3AF', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>{f.label}</label>
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
                    background: 'linear-gradient(135deg,#00FF87,#00D4FF)',
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
                background: 'rgba(0,0,0,0.8)',
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
                <h2 style={{ fontFamily: "'Clash Display',sans-serif", color: 'white', marginBottom: '8px' }}>
                  Scan Food
                </h2>
                <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.9rem' }}>
                  Take a photo of your food and AI will detect calories automatically
                </p>
                <div 
                  onClick={() => !isScanning && document.getElementById('food-input').click()}
                  style={{
                    border: isScanning ? '2px solid #00FF87' : '2px dashed rgba(0,255,135,0.3)',
                    borderRadius: '16px', padding: '40px',
                    marginBottom: '20px', cursor: isScanning ? 'wait' : 'pointer',
                    background: 'rgba(0,255,135,0.03)',
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
                      if (!file) return
                      
                      setIsScanning(true)
                      setScanError('')
                      try {
                        const formData = new FormData()
                        formData.append('image', file)
                        const res = await ml.detect(formData)
                        
                        if (res.data && res.data.detection) {
                          const { name, calories, protein, carbs, fat } = res.data.detection
                          // Automatically add the detected food
                          await addFood({
                            name: name || 'Detected Food',
                            calories: calories || 0,
                            protein: protein || 0,
                            carbs: carbs || 0,
                            fat: fat || 0,
                            emoji: '🤖'
                          })
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
                  <div style={{ color: '#00FF87', fontSize: '0.9rem', fontWeight: 600 }}>
                    {isScanning ? 'AI is analyzing...' : 'Click to Upload Photo'}
                  </div>
                  {scanError && (
                    <div style={{ color: '#FF6B35', fontSize: '0.8rem', marginTop: '8px' }}>
                      {scanError}
                    </div>
                  )}
                  <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '4px' }}>
                    YOLOv8 food detection
                  </div>
                </div>
                <button
                  onClick={() => setShowCamera(false)}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'white',
                    cursor: 'pointer', fontSize: '0.9rem'
                  }}>Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
  )
}
