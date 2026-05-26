'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

const RECIPES = [
  {
    id:1, name:'Paneer Butter Masala', emoji:'🧀', time:30, calories:420,
    protein:18, carbs:28, fat:28, difficulty:'Medium', cuisine:'Indian',
    tags:['Vegetarian','High Protein','Gluten Free'],
    color:'#FF6B35', glow:'rgba(255,107,53,0.3)',
    ingredients:['200g Paneer','2 Tomatoes','1 Onion','50ml Cream','Butter','Spices'],
    steps:['Sauté onions until golden','Add tomato puree and spices','Add paneer cubes','Finish with cream']
  },
  {
    id:2, name:'Grilled Chicken Bowl', emoji:'🍗', time:25, calories:380,
    protein:42, carbs:22, fat:12, difficulty:'Easy', cuisine:'Western',
    tags:['High Protein','Low Carb','Keto'],
    color:'#00FF87', glow:'rgba(0,255,135,0.3)',
    ingredients:['200g Chicken','Brown Rice','Broccoli','Olive Oil','Garlic','Lemon'],
    steps:['Marinate chicken 30 mins','Grill 6 mins each side','Steam broccoli','Assemble bowl']
  },
  {
    id:3, name:'Quinoa Power Bowl', emoji:'🥗', time:20, calories:340,
    protein:14, carbs:48, fat:11, difficulty:'Easy', cuisine:'Healthy',
    tags:['Vegan','High Fiber','Antioxidants'],
    color:'#7B61FF', glow:'rgba(123,97,255,0.3)',
    ingredients:['1 cup Quinoa','Chickpeas','Spinach','Cherry Tomatoes','Tahini','Lemon'],
    steps:['Cook quinoa 15 mins','Roast chickpeas','Prepare tahini dressing','Assemble and serve']
  },
  {
    id:4, name:'Dal Tadka', emoji:'🍲', time:35, calories:290,
    protein:16, carbs:42, fat:8, difficulty:'Easy', cuisine:'Indian',
    tags:['Vegan','High Fiber','Budget'],
    color:'#FFD700', glow:'rgba(255,215,0,0.3)',
    ingredients:['1 cup Yellow Dal','Tomatoes','Onion','Ghee','Cumin','Turmeric'],
    steps:['Pressure cook dal','Prepare tadka','Combine and simmer','Garnish with coriander']
  },
  {
    id:5, name:'Salmon Teriyaki', emoji:'🐟', time:20, calories:310,
    protein:35, carbs:18, fat:10, difficulty:'Medium', cuisine:'Japanese',
    tags:['Omega-3','High Protein','Heart Healthy'],
    color:'#00D4FF', glow:'rgba(0,212,255,0.3)',
    ingredients:['180g Salmon','Teriyaki Sauce','Sesame Seeds','Spring Onion','Ginger','Rice'],
    steps:['Marinate salmon','Pan sear 4 mins each side','Glaze with sauce','Serve with rice']
  },
  {
    id:6, name:'Avocado Egg Toast', emoji:'🥑', time:10, calories:280,
    protein:12, carbs:24, fat:18, difficulty:'Easy', cuisine:'Western',
    tags:['Healthy Fats','Quick','Breakfast'],
    color:'#4ADE80', glow:'rgba(74,222,128,0.3)',
    ingredients:['2 Eggs','1 Avocado','Sourdough Bread','Cherry Tomatoes','Chili Flakes','Lime'],
    steps:['Toast sourdough','Mash avocado with lime','Poach or fry eggs','Top and season']
  },
]

const FILTERS = ['All','Indian','Western','Japanese','Healthy','Vegan','High Protein','Quick']

export default function RecipeMaker() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [ingredients, setIngredients] = useState('')
  const [aiMode, setAiMode] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const filtered = RECIPES.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = activeFilter === 'All' ||
      r.cuisine === activeFilter ||
      r.tags.includes(activeFilter) ||
      (activeFilter === 'Quick' && r.time <= 20)
    return matchSearch && matchFilter
  })

  const handleMouseMove = (e) => {
    mouseX.set(e.clientX)
    mouseY.set(e.clientY)
  }

  const handleAIMatch = () => {
    if (!ingredients.trim()) return
    setAiLoading(true)
    setTimeout(() => {
      setAiLoading(false)
      setAiResult(RECIPES[Math.floor(Math.random() * RECIPES.length)])
    }, 2000)
  }

  const card = (glowColor = 'rgba(0,255,135,0.1)') => ({
    background: 'rgba(18,18,26,0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px',
    boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
    overflow: 'hidden',
  })

  return (
      <div style={{ width:'100%' }} onMouseMove={handleMouseMove}>

        {/* AMBIENT GLOW BG */}
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          background:`
            radial-gradient(600px circle at 20% 30%, rgba(0,255,135,0.04) 0%, transparent 60%),
            radial-gradient(400px circle at 80% 70%, rgba(123,97,255,0.04) 0%, transparent 60%)
          `
        }}/>

        <div style={{ position:'relative', zIndex:1 }}>

          {/* HEADER */}
          <motion.div
            initial={{ opacity:0, y:-20 }}
            animate={{ opacity:1, y:0 }}
            style={{ marginBottom:'32px' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <h1 style={{
                  fontFamily:"'Clash Display',sans-serif",
                  fontSize:'2.2rem', fontWeight:800,
                  margin:0, marginBottom:'6px',
                  background:'linear-gradient(135deg, #ffffff 0%, #00FF87 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                }}>
                  Recipe Intelligence 👨‍🍳
                </h1>
                <p style={{ color:'#6B7280', margin:0, fontSize:'0.9rem' }}>
                  AI-powered recipe matching from your ingredients
                </p>
              </div>
              <motion.button
                whileHover={{ scale:1.05, boxShadow:'0 0 30px rgba(0,255,135,0.4)' }}
                whileTap={{ scale:0.95 }}
                onClick={() => setAiMode(!aiMode)}
                style={{
                  padding:'12px 24px',
                  background: aiMode
                    ? 'linear-gradient(135deg,#00FF87,#00D4FF)'
                    : 'rgba(0,255,135,0.1)',
                  border:'1px solid rgba(0,255,135,0.4)',
                  borderRadius:'14px',
                  color: aiMode ? '#000' : '#00FF87',
                  fontWeight:700, cursor:'pointer',
                  fontSize:'0.9rem', fontFamily:"'Satoshi',sans-serif",
                  display:'flex', alignItems:'center', gap:'8px',
                  transition:'all 0.3s'
                }}>
                🤖 {aiMode ? 'Browse Recipes' : 'AI Match Mode'}
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {aiMode ? (
              /* AI INGREDIENT MATCHER */
              <motion.div
                key="ai"
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-20 }}
              >
                <div style={{
                  ...card(),
                  padding:'40px',
                  marginBottom:'24px',
                  background:'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(0,255,135,0.03))',
                  border:'1px solid rgba(0,255,135,0.15)',
                }}>
                  {/* Animated orbs */}
                  <div style={{ position:'relative' }}>
                    <div style={{
                      position:'absolute', top:'-20px', right:'-20px',
                      width:'200px', height:'200px', borderRadius:'50%',
                      background:'radial-gradient(circle, rgba(0,255,135,0.08) 0%, transparent 70%)',
                      pointerEvents:'none'
                    }}/>
                    <div style={{
                      position:'absolute', bottom:'-40px', left:'30%',
                      width:'150px', height:'150px', borderRadius:'50%',
                      background:'radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%)',
                      pointerEvents:'none'
                    }}/>

                    <div style={{ textAlign:'center', marginBottom:'32px' }}>
                      <motion.div
                        animate={{ rotate:[0,5,-5,0], scale:[1,1.05,1] }}
                        transition={{ duration:4, repeat:Infinity }}
                        style={{ fontSize:'4rem', marginBottom:'12px' }}
                      >🧠</motion.div>
                      <h2 style={{
                        fontFamily:"'Clash Display',sans-serif",
                        fontSize:'1.6rem', color:'white', margin:0, marginBottom:'8px'
                      }}>What's in your kitchen?</h2>
                      <p style={{ color:'#6B7280', margin:0, fontSize:'0.9rem' }}>
                        Type your available ingredients and AI finds the perfect recipe
                      </p>
                    </div>

                    <div style={{ width:'100%', margin:'0' }}>
                      <div style={{ position:'relative', marginBottom:'16px' }}>
                        <textarea
                          placeholder="e.g. paneer, tomatoes, onion, garlic, cream..."
                          value={ingredients}
                          onChange={e => setIngredients(e.target.value)}
                          rows={3}
                          style={{
                            width:'100%', boxSizing:'border-box',
                            background:'rgba(255,255,255,0.04)',
                            border:'1px solid rgba(0,255,135,0.2)',
                            borderRadius:'16px', padding:'16px 20px',
                            color:'#F0F0FF', fontSize:'0.95rem',
                            outline:'none', resize:'none',
                            fontFamily:"'Satoshi',sans-serif",
                            lineHeight:1.6,
                            boxShadow:'inset 0 0 20px rgba(0,0,0,0.2)'
                          }}
                        />
                        <div style={{
                          position:'absolute', bottom:'12px', right:'12px',
                          color:'#374151', fontSize:'0.75rem'
                        }}>{ingredients.length} chars</div>
                      </div>

                      {/* Quick tags */}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px' }}>
                        {['paneer','chicken','dal','rice','eggs','spinach','tomatoes'].map(ing => (
                          <motion.button
                            key={ing}
                            whileHover={{ scale:1.05 }}
                            whileTap={{ scale:0.95 }}
                            onClick={() => setIngredients(p => p ? `${p}, ${ing}` : ing)}
                            style={{
                              background:'rgba(255,255,255,0.04)',
                              border:'1px solid rgba(255,255,255,0.1)',
                              borderRadius:'99px', padding:'5px 14px',
                              color:'#9CA3AF', cursor:'pointer',
                              fontSize:'0.8rem',
                              fontFamily:"'Satoshi',sans-serif"
                            }}>+ {ing}</motion.button>
                        ))}
                      </div>

                      <motion.button
                        whileHover={{ scale:1.02, boxShadow:'0 8px 40px rgba(0,255,135,0.4)' }}
                        whileTap={{ scale:0.98 }}
                        onClick={handleAIMatch}
                        disabled={aiLoading || !ingredients.trim()}
                        style={{
                          width:'100%', padding:'16px',
                          background:'linear-gradient(135deg,#00FF87,#00D4FF)',
                          border:'none', borderRadius:'16px',
                          color:'#000', fontWeight:800,
                          fontSize:'1rem', cursor:'pointer',
                          fontFamily:"'Clash Display',sans-serif",
                          letterSpacing:'0.02em',
                          opacity: ingredients.trim() ? 1 : 0.5,
                          transition:'all 0.3s'
                        }}>
                        {aiLoading ? (
                          <motion.span
                            animate={{ opacity:[1,0.5,1] }}
                            transition={{ duration:1, repeat:Infinity }}
                          >🧠 Analyzing ingredients...</motion.span>
                        ) : '✨ Find My Recipe'}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* AI RESULT */}
                <AnimatePresence>
                  {aiResult && (
                    <motion.div
                      initial={{ opacity:0, scale:0.95, y:20 }}
                      animate={{ opacity:1, scale:1, y:0 }}
                      exit={{ opacity:0, scale:0.95 }}
                      style={{
                        ...card(aiResult.glow),
                        padding:'32px',
                        border:`1px solid ${aiResult.color}40`,
                        boxShadow:`0 0 60px ${aiResult.glow}, 0 8px 40px rgba(0,0,0,0.5)` 
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                        <div style={{
                          background:`${aiResult.color}20`,
                          border:`1px solid ${aiResult.color}40`,
                          borderRadius:'99px', padding:'4px 14px',
                          color: aiResult.color, fontSize:'0.78rem', fontWeight:700
                        }}>🤖 AI RECOMMENDED</div>
                        <div style={{ color:'#6B7280', fontSize:'0.8rem' }}>95% ingredient match</div>
                      </div>
                      <div style={{ display:'flex', gap:'24px', flexWrap:'wrap' }}>
                        <div style={{ fontSize:'5rem' }}>{aiResult.emoji}</div>
                        <div style={{ flex:1 }}>
                          <h2 style={{
                            fontFamily:"'Clash Display',sans-serif",
                            fontSize:'1.8rem', color:'white', margin:0, marginBottom:'8px'
                          }}>{aiResult.name}</h2>
                          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
                            {aiResult.tags.map(t => (
                              <span key={t} style={{
                                background:'rgba(255,255,255,0.06)',
                                borderRadius:'99px', padding:'3px 12px',
                                color:'#9CA3AF', fontSize:'0.75rem'
                              }}>{t}</span>
                            ))}
                          </div>
                          <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
                            {[
                              { label:'Calories', val:`${aiResult.calories} kcal`, color:aiResult.color },
                              { label:'Protein',  val:`${aiResult.protein}g`,      color:'#00FF87' },
                              { label:'Time',     val:`${aiResult.time} min`,      color:'#00D4FF' },
                            ].map(s => (
                              <div key={s.label}>
                                <div style={{ color: s.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.4rem', fontWeight:700 }}>{s.val}</div>
                                <div style={{ color:'#6B7280', fontSize:'0.75rem' }}>{s.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale:1.05 }}
                          whileTap={{ scale:0.95 }}
                          onClick={() => { setSelected(aiResult); setAiMode(false) }}
                          style={{
                            alignSelf:'center',
                            background:`linear-gradient(135deg, ${aiResult.color}, ${aiResult.color}99)`,
                            border:'none', borderRadius:'14px',
                            padding:'12px 24px', color:'#000',
                            fontWeight:700, cursor:'pointer',
                            fontFamily:"'Satoshi',sans-serif", fontSize:'0.9rem',
                            boxShadow:`0 4px 20px ${aiResult.glow}` 
                          }}>View Recipe →</motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

            ) : (
              /* RECIPE BROWSER */
              <motion.div
                key="browse"
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-20 }}
              >
                {/* SEARCH + FILTERS */}
                <div style={{ marginBottom:'24px' }}>
                  <div style={{ position:'relative', marginBottom:'16px' }}>
                    <span style={{
                      position:'absolute', left:'16px', top:'50%',
                      transform:'translateY(-50%)', fontSize:'1.1rem'
                    }}>🔍</span>
                    <input
                      placeholder="Search recipes..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        width:'100%', boxSizing:'border-box',
                        background:'rgba(22,22,31,0.8)',
                        backdropFilter:'blur(20px)',
                        border:'1px solid rgba(255,255,255,0.08)',
                        borderRadius:'14px', padding:'14px 16px 14px 48px',
                        color:'#F0F0FF', fontSize:'0.95rem', outline:'none',
                        fontFamily:"'Satoshi',sans-serif",
                        transition:'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor='rgba(0,255,135,0.4)'}
                      onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
                    />
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {FILTERS.map(f => (
                      <motion.button
                        key={f}
                        whileHover={{ scale:1.05 }}
                        whileTap={{ scale:0.95 }}
                        onClick={() => setActiveFilter(f)}
                        style={{
                          padding:'7px 18px', borderRadius:'99px',
                          border: activeFilter===f ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          background: activeFilter===f
                            ? 'linear-gradient(135deg,#00FF87,#00D4FF)'
                            : 'rgba(22,22,31,0.8)',
                          color: activeFilter===f ? '#000' : '#9CA3AF',
                          fontWeight: activeFilter===f ? 700 : 400,
                          cursor:'pointer', fontSize:'0.82rem',
                          fontFamily:"'Satoshi',sans-serif",
                          transition:'all 0.2s',
                          backdropFilter:'blur(10px)'
                        }}>{f}</motion.button>
                    ))}
                  </div>
                </div>

                {/* RECIPE GRID */}
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(3,1fr)',
                  gap:'20px'
                }}>
                  {filtered.map((recipe, i) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity:0, y:30 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ y:-8, scale:1.02 }}
                      onHoverStart={() => setHoveredId(recipe.id)}
                      onHoverEnd={() => setHoveredId(null)}
                      onClick={() => setSelected(recipe)}
                      style={{
                        ...card(recipe.glow),
                        cursor:'pointer',
                        transition:'box-shadow 0.3s',
                        boxShadow: hoveredId===recipe.id
                          ? `0 20px 60px ${recipe.glow}, 0 0 0 1px ${recipe.color}30` 
                          : '0 8px 32px rgba(0,0,0,0.4)',
                      }}
                    >
                      {/* Card top accent */}
                      <div style={{
                        height:'3px',
                        background:`linear-gradient(90deg, ${recipe.color}, transparent)`,
                        marginBottom:'0'
                      }}/>

                      <div style={{ padding:'24px' }}>
                        {/* Emoji with glow */}
                        <div style={{ marginBottom:'16px' }}>
                          <motion.div
                            animate={hoveredId===recipe.id ? { scale:1.2, rotate:[-5,5,-5] } : { scale:1, rotate:0 }}
                            transition={{ duration:0.4 }}
                            style={{
                              fontSize:'3.5rem', display:'inline-block',
                              filter: hoveredId===recipe.id ? `drop-shadow(0 0 20px ${recipe.color})` : 'none',
                              transition:'filter 0.3s'
                            }}
                          >{recipe.emoji}</motion.div>
                        </div>

                        <h3 style={{
                          fontFamily:"'Clash Display',sans-serif",
                          fontSize:'1.05rem', color:'white',
                          margin:0, marginBottom:'10px', fontWeight:700
                        }}>{recipe.name}</h3>

                        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'16px' }}>
                          {recipe.tags.slice(0,2).map(t => (
                            <span key={t} style={{
                              background:`${recipe.color}15`,
                              border:`1px solid ${recipe.color}30`,
                              borderRadius:'99px', padding:'3px 10px',
                              color: recipe.color, fontSize:'0.72rem', fontWeight:600
                            }}>{t}</span>
                          ))}
                          <span style={{
                            background:'rgba(255,255,255,0.04)',
                            borderRadius:'99px', padding:'3px 10px',
                            color:'#6B7280', fontSize:'0.72rem'
                          }}>⏱ {recipe.time}m</span>
                        </div>

                        {/* Macro pills */}
                        <div style={{
                          display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                          gap:'8px', marginBottom:'16px'
                        }}>
                          {[
                            { label:'Cal',  val:recipe.calories, color:'#FF6B35' },
                            { label:'Prot', val:`${recipe.protein}g`, color:'#00FF87' },
                            { label:'Carb', val:`${recipe.carbs}g`,   color:'#7B61FF' },
                          ].map(m => (
                            <div key={m.label} style={{
                              background:'rgba(255,255,255,0.03)',
                              borderRadius:'10px', padding:'8px 6px',
                              textAlign:'center',
                              border:'1px solid rgba(255,255,255,0.05)'
                            }}>
                              <div style={{ color:m.color, fontWeight:700, fontSize:'0.85rem' }}>{m.val}</div>
                              <div style={{ color:'#4B5563', fontSize:'0.68rem', marginTop:'2px' }}>{m.label}</div>
                            </div>
                          ))}
                        </div>

                        <motion.div
                          animate={hoveredId===recipe.id ? { opacity:1, y:0 } : { opacity:0, y:6 }}
                          style={{
                            display:'flex', alignItems:'center',
                            justifyContent:'center', gap:'6px',
                            color: recipe.color, fontSize:'0.82rem', fontWeight:700
                          }}
                        >View Recipe ↗</motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RECIPE DETAIL MODAL */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              style={{
                position:'fixed', inset:0, zIndex:200,
                background:'rgba(0,0,0,0.75)',
                backdropFilter:'blur(12px)',
                display:'flex', alignItems:'center',
                justifyContent:'center', padding:'20px'
              }}
              onClick={e => e.target===e.currentTarget && setSelected(null)}
            >
              <motion.div
                initial={{ scale:0.85, opacity:0, y:40 }}
                animate={{ scale:1, opacity:1, y:0 }}
                exit={{ scale:0.85, opacity:0, y:40 }}
                transition={{ type:'spring', stiffness:300, damping:25 }}
                style={{
                  width:'100%', maxWidth:'680px',
                  maxHeight:'85vh', overflowY:'auto',
                  background:'rgba(14,14,20,0.98)',
                  backdropFilter:'blur(40px)',
                  border:`1px solid ${selected.color}30`,
                  borderRadius:'28px',
                  boxShadow:`0 40px 100px rgba(0,0,0,0.8), 0 0 80px ${selected.glow}`,
                }}
              >
                {/* Modal top accent */}
                <div style={{
                  height:'4px',
                  background:`linear-gradient(90deg, ${selected.color}, ${selected.color}40, transparent)`,
                  borderRadius:'28px 28px 0 0'
                }}/>

                <div style={{ padding:'32px' }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'24px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                      <motion.div
                        animate={{ rotate:[0,10,-10,0] }}
                        transition={{ duration:3, repeat:Infinity }}
                        style={{
                          fontSize:'4rem',
                          filter:`drop-shadow(0 0 20px ${selected.color})` 
                        }}
                      >{selected.emoji}</motion.div>
                      <div>
                        <h2 style={{
                          fontFamily:"'Clash Display',sans-serif",
                          fontSize:'1.6rem', color:'white',
                          margin:0, marginBottom:'6px'
                        }}>{selected.name}</h2>
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                          {selected.tags.map(t => (
                            <span key={t} style={{
                              background:`${selected.color}15`,
                              border:`1px solid ${selected.color}30`,
                              borderRadius:'99px', padding:'3px 10px',
                              color:selected.color, fontSize:'0.72rem', fontWeight:600
                            }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      style={{
                        background:'rgba(255,255,255,0.06)',
                        border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:'50%', width:'36px', height:'36px',
                        color:'#9CA3AF', cursor:'pointer',
                        fontSize:'1rem', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        flexShrink:0
                      }}>✕</button>
                  </div>

                  {/* Stats row */}
                  <div style={{
                    display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                    gap:'12px', marginBottom:'28px'
                  }}>
                    {[
                      { label:'Calories', val:`${selected.calories}`, unit:'kcal', color:selected.color, icon:'🔥' },
                      { label:'Protein',  val:`${selected.protein}`,  unit:'g',    color:'#00FF87',       icon:'💪' },
                      { label:'Carbs',    val:`${selected.carbs}`,    unit:'g',    color:'#7B61FF',       icon:'⚡' },
                      { label:'Time',     val:`${selected.time}`,     unit:'min',  color:'#00D4FF',       icon:'⏱' },
                    ].map(s => (
                      <div key={s.label} style={{
                        background:`${s.color}08`,
                        border:`1px solid ${s.color}20`,
                        borderRadius:'16px', padding:'16px',
                        textAlign:'center'
                      }}>
                        <div style={{ fontSize:'1.4rem', marginBottom:'6px' }}>{s.icon}</div>
                        <div style={{
                          color: s.color,
                          fontFamily:"'Clash Display',sans-serif",
                          fontSize:'1.4rem', fontWeight:700
                        }}>{s.val}<span style={{ fontSize:'0.75rem' }}>{s.unit}</span></div>
                        <div style={{ color:'#6B7280', fontSize:'0.72rem', marginTop:'2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Two column */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
                    {/* Ingredients */}
                    <div>
                      <h3 style={{
                        fontFamily:"'Clash Display',sans-serif",
                        color:'white', fontSize:'1rem',
                        marginBottom:'14px', fontWeight:600
                      }}>🥬 Ingredients</h3>
                      {selected.ingredients.map((ing, i) => (
                        <motion.div
                          key={ing}
                          initial={{ opacity:0, x:-10 }}
                          animate={{ opacity:1, x:0 }}
                          transition={{ delay: i*0.06 }}
                          style={{
                            display:'flex', alignItems:'center', gap:'10px',
                            padding:'8px 12px', marginBottom:'6px',
                            background:'rgba(255,255,255,0.03)',
                            borderRadius:'10px',
                            border:'1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <span style={{
                            width:'6px', height:'6px', borderRadius:'50%',
                            background:selected.color, flexShrink:0
                          }}/>
                          <span style={{ color:'#D1D5DB', fontSize:'0.85rem' }}>{ing}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Steps */}
                    <div>
                      <h3 style={{
                        fontFamily:"'Clash Display',sans-serif",
                        color:'white', fontSize:'1rem',
                        marginBottom:'14px', fontWeight:600
                      }}>📋 Steps</h3>
                      {selected.steps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity:0, x:10 }}
                          animate={{ opacity:1, x:0 }}
                          transition={{ delay: i*0.06 }}
                          style={{
                            display:'flex', gap:'12px',
                            marginBottom:'10px'
                          }}
                        >
                          <div style={{
                            width:'24px', height:'24px', borderRadius:'50%',
                            background:`${selected.color}20`,
                            border:`1px solid ${selected.color}40`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:selected.color, fontSize:'0.75rem', fontWeight:700,
                            flexShrink:0
                          }}>{i+1}</div>
                          <p style={{ color:'#9CA3AF', fontSize:'0.83rem', margin:0, lineHeight:1.5 }}>{step}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ display:'flex', gap:'12px', marginTop:'28px' }}>
                    <motion.button
                      whileHover={{ scale:1.03, boxShadow:`0 8px 30px ${selected.glow}` }}
                      whileTap={{ scale:0.97 }}
                      style={{
                        flex:1, padding:'14px',
                        background:`linear-gradient(135deg, ${selected.color}, ${selected.color}80)`,
                        border:'none', borderRadius:'14px',
                        color:'#000', fontWeight:800, cursor:'pointer',
                        fontSize:'0.95rem', fontFamily:"'Clash Display',sans-serif"
                      }}>🍽️ Start Cooking</motion.button>
                    <motion.button
                      whileHover={{ scale:1.03 }}
                      whileTap={{ scale:0.97 }}
                      style={{
                        padding:'14px 20px',
                        background:'rgba(255,255,255,0.05)',
                        border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:'14px', color:'#9CA3AF',
                        cursor:'pointer', fontSize:'0.9rem'
                      }}>+ Add to Meal Plan</motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
