'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../../components/shared/PageWrapper'

const COACH_PERSONAS = [
  {
    id:'nutrition', name:'NutriBot', emoji:'🥗',
    color:'#00FF87', glow:'rgba(0,255,135,0.3)',
    title:'Nutrition Expert',
    description:'Personalized meal plans, macro calculations, food analysis',
    systemPrompt:`You are NutriBot, an elite AI nutrition coach for NutriAI fitness app.
You are an expert in:
- Personalized nutrition planning and macro calculations
- Indian and international food database with calories
- Meal timing, nutrient timing around workouts
- Weight loss, muscle gain, and maintenance diets
- Micronutrients, vitamins, minerals
- Food allergies and dietary restrictions
- Supplement recommendations
- Gut health and digestion

User context: Fitness-focused individual using NutriAI app.
Always give specific, actionable advice with exact numbers.
Format responses with emojis, bullet points, and clear sections.
Keep responses concise but highly informative.
When calculating macros, always show your math.
Suggest specific Indian foods when relevant.`,
    starters:[
      'Calculate my macros for muscle building at 70kg',
      'What should I eat before and after workout?',
      'Create a 7-day meal plan for fat loss',
      'How many calories in a typical Indian thali?',
      'Best high protein vegetarian foods in India',
    ]
  },
  {
    id:'workout', name:'FitCoach', emoji:'💪',
    color:'#7B61FF', glow:'rgba(123,97,255,0.3)',
    title:'Workout Specialist',
    description:'Custom workout plans, form tips, progressive overload',
    systemPrompt:`You are FitCoach, an elite AI personal trainer for NutriAI fitness app.
You are an expert in:
- Strength training, hypertrophy, powerlifting
- Calisthenics and bodyweight training
- HIIT, cardio, and athletic performance
- Exercise form, technique, and injury prevention
- Progressive overload and periodization
- Recovery, rest days, and deload weeks
- Home workouts with minimal equipment
- Sport-specific training
- Warm-up and cool-down protocols

Always provide:
- Specific sets, reps, rest times
- Form cues and common mistakes to avoid
- Progression schemes
- Alternative exercises
Format with clear structure and emojis.`,
    starters:[
      'Build me a 4-day push pull legs split',
      'How do I increase my bench press by 20kg?',
      'Best exercises for visible abs in 8 weeks',
      'I only have dumbbells at home, full body workout?',
      'Why am I not gaining muscle despite training hard?',
    ]
  },
  {
    id:'health', name:'WellnessAI', emoji:'🧬',
    color:'#00D4FF', glow:'rgba(0,212,255,0.3)',
    title:'Health & Wellness Coach',
    description:'Sleep, recovery, stress management, longevity',
    systemPrompt:`You are WellnessAI, an elite health and wellness coach for NutriAI.
You are an expert in:
- Sleep optimization and circadian rhythm
- Stress management and cortisol control
- Recovery protocols and HRV
- Hormonal health and optimization
- Mental health and fitness connection
- Injury prevention and mobility
- Longevity and anti-aging strategies
- Blood work interpretation basics
- Gut microbiome and digestion
- Breathing techniques and mindfulness

Always provide evidence-based advice.
Mention when to consult a doctor for medical issues.
Give practical, implementable daily habits.
Use NutriAI context and frame advice for fitness-focused users.`,
    starters:[
      'How to optimize sleep for muscle recovery?',
      'My cortisol is high, how does it affect fitness?',
      'Morning routine for peak performance all day',
      'How to reduce DOMS after heavy leg day?',
      'Signs of overtraining and how to fix it',
    ]
  },
  {
    id:'transformation', name:'TransformAI', emoji:'🔥',
    color:'#FF6B35', glow:'rgba(255,107,53,0.3)',
    title:'Body Transformation Expert',
    description:'Body recomposition, cutting, bulking strategies',
    systemPrompt:`You are TransformAI, an elite body transformation coach for NutriAI.
You are an expert in:
- Body recomposition (lose fat + gain muscle simultaneously)
- Cutting phases with muscle preservation
- Bulking phases with minimal fat gain
- Calorie cycling and carb cycling
- Contest prep and peak week protocols
- Body fat measurement and tracking
- Before/after transformation planning
- Realistic timeline setting
- Habit formation and consistency
- Mindset and motivation strategies

Be direct, motivating, and data-driven.
Always set realistic expectations with timelines.
Provide specific protocols not generic advice.
Use success stories and examples to motivate.`,
    starters:[
      'I want to go from 25% to 15% body fat, make a plan',
      'Can I build muscle and lose fat at same time?',
      'Best cutting protocol to keep maximum muscle',
      'How long to see visible abs for someone at 20% BF?',
      'Calorie cycling plan for fastest fat loss',
    ]
  },
]

const QUICK_ACTIONS = [
  { label:'Analyze My Diet',    emoji:'🔍', prompt:'Analyze a typical day of eating for me: breakfast is oatmeal with milk, lunch is dal rice, dinner is roti sabzi. What am I missing nutritionally?' },
  { label:'Today\'s Workout',   emoji:'💪', prompt:'Give me today\'s workout. I train 5 days a week, today is push day, I have access to a full gym. Make it challenging for intermediate level.' },
  { label:'Calorie Calculator', emoji:'🔢', prompt:'Calculate my daily calorie needs. I am 22 years old, 70kg, 175cm, male, moderately active (4 workouts per week), goal is muscle building.' },
  { label:'Meal Prep Sunday',   emoji:'🍱', prompt:'Give me a complete Sunday meal prep guide for entire week. High protein Indian foods, budget-friendly, 2800 calories per day target.' },
  { label:'Fat Loss Fast',      emoji:'⚡', prompt:'I want to lose 5kg in 8 weeks. Give me exact diet + workout plan. I can train 4 days a week and cook my own food.' },
  { label:'Supplement Guide',   emoji:'💊', prompt:'What supplements should I take for muscle building? Budget is 2000 rupees per month. Rank by importance with dosage.' },
  { label:'Fix My Sleep',       emoji:'😴', prompt:'I sleep only 5-6 hours and feel tired. How is this affecting my fitness gains? Give me a complete sleep optimization protocol.' },
  { label:'Protein Sources',    emoji:'🥩', prompt:'List the top 20 protein sources available in India with protein per 100g, cost per 100g protein, and cooking suggestions. Include both veg and non-veg.' },
]

export default function AICoach() {
  const [activePersona, setActivePersona] = useState(COACH_PERSONAS[0])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const [streamedText, setStreamedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, streamedText])

  useEffect(() => {
    // Welcome message when persona changes
    setMessages([{
      role:'assistant',
      content: `Hey! I'm **${activePersona.name}**, your ${activePersona.title}. 🎯\n\nI'm here to help you with ${activePersona.description.toLowerCase()}.\n\nAsk me anything or pick a quick action below to get started!`,
      timestamp: new Date().toISOString(),
      persona: activePersona.id
    }])
    setConversationHistory([])
    setShowQuickActions(true)
  }, [activePersona.id])

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim()
    if (!text || loading) return

    setInput('')
    setShowQuickActions(false)
    setLoading(true)
    setIsStreaming(true)
    setStreamedText('')

    const userMsg = {
      role:'user',
      content: text,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])

    const updatedHistory = [
      ...conversationHistory,
      { role:'user', content: text }
    ]

    try {
      // ✅ FIXED: Route all AI calls through the backend proxy.
      // Never call the Anthropic API directly from the browser — it exposes your API key.
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('nutriai_token')

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: updatedHistory,
          systemPrompt: activePersona.systemPrompt
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI service error')
      }

      const assistantText = data.text || 'Sorry, I could not generate a response.'

      // Simulate streaming effect
      let displayed = ''
      const words = assistantText.split(' ')
      for (let i = 0; i < words.length; i++) {
        displayed += (i > 0 ? ' ' : '') + words[i]
        setStreamedText(displayed)
        await new Promise(r => setTimeout(r, 18))
      }

      const assistantMsg = {
        role:'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
        persona: activePersona.id
      }

      setConversationHistory([
        ...updatedHistory,
        { role:'assistant', content: assistantText }
      ])

      setMessages(prev => [...prev, assistantMsg])
      setStreamedText('')
      setIsStreaming(false)

    } catch (err) {
      const errorMsg = {
        role:'assistant',
        content: `⚠️ Connection error: ${err.message}\n\nMake sure backend is running and your API key is configured.`,
        timestamp: new Date().toISOString(),
        isError: true
      }
      setMessages(prev => [...prev, errorMsg])
      setStreamedText('')
      setIsStreaming(false)
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    setConversationHistory([])
    setMessages([{
      role:'assistant',
      content:`Chat cleared! I'm ready to help you again. What would you like to know about ${activePersona.title.toLowerCase()}?`,
      timestamp: new Date().toISOString(),
      persona: activePersona.id
    }])
    setShowQuickActions(true)
  }

  const formatMessage = (text) => {
    // Convert markdown-like text to styled spans
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:white;font-weight:700">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color:#D1D5DB">$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.85em;color:#00FF87">$1</code>')
      .replace(/^### (.*)/gm, '<div style="color:white;font-weight:700;font-size:1rem;margin:12px 0 6px;font-family:Clash Display,sans-serif">$1</div>')
      .replace(/^## (.*)/gm, '<div style="color:white;font-weight:800;font-size:1.1rem;margin:14px 0 8px;font-family:Clash Display,sans-serif">$1</div>')
      .replace(/^# (.*)/gm, '<div style="font-size:1.2rem;font-weight:800;margin:16px 0 10px;font-family:Clash Display,sans-serif;background:linear-gradient(135deg,#00FF87,#00D4FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent">$1</div>')
      .replace(/^- (.*)/gm, '<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#00FF87;margin-top:2px">▸</span><span>$1</span></div>')
      .replace(/^\d+\. (.*)/gm, '<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#7B61FF;min-width:16px;margin-top:2px">•</span><span>$1</span></div>')
      .replace(/\n/g, '<br/>')
  }

  const card = {
    background:'rgba(18,18,26,0.85)',
    backdropFilter:'blur(24px)',
    WebkitBackdropFilter:'blur(24px)',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:'24px',
    overflow:'hidden',
  }

  return (
      <div style={{ width:'100%' }}>

        {/* AMBIENT */}
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          background:`
            radial-gradient(600px circle at 15% 50%, ${activePersona.color}08 0%, transparent 60%),
            radial-gradient(400px circle at 85% 30%, rgba(123,97,255,0.04) 0%, transparent 60%)
          `
        }}/>

        <div style={{ position:'relative', zIndex:1 }}>

          {/* HEADER */}
          <motion.div
            initial={{ opacity:0, y:-20 }}
            animate={{ opacity:1, y:0 }}
            style={{ marginBottom:'24px' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <h1 style={{
                  fontFamily:"'Clash Display',sans-serif",
                  fontSize:'2.4rem', fontWeight:800,
                  margin:0, marginBottom:'6px',
                  background:`linear-gradient(135deg,#ffffff 0%,${activePersona.color} 100%)`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                }}>AI Coach 🤖</h1>
                <p style={{ color:'#6B7280', margin:0, fontSize:'0.9rem' }}>
                  Powered by Claude AI · Real-time personalized coaching
                </p>
              </div>
              <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:'8px',
                  background:'rgba(0,255,135,0.1)',
                  border:'1px solid rgba(0,255,135,0.25)',
                  borderRadius:'99px', padding:'6px 14px'
                }}>
                  <motion.div
                    animate={{ scale:[1,1.4,1], opacity:[1,0.5,1] }}
                    transition={{ duration:2, repeat:Infinity }}
                    style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#00FF87' }}
                  />
                  <span style={{ color:'#00FF87', fontSize:'0.8rem', fontWeight:600 }}>Claude AI Live</span>
                </div>
                <button onClick={clearChat} style={{
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:'12px', padding:'8px 16px',
                  color:'#9CA3AF', cursor:'pointer', fontSize:'0.82rem'
                }}>🗑️ Clear Chat</button>
              </div>
            </div>
          </motion.div>

          {/* PERSONA SELECTOR */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'24px' }}>
            {COACH_PERSONAS.map((persona, i) => (
              <motion.div
                key={persona.id}
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.07 }}
                whileHover={{ y:-4, scale:1.02 }}
                whileTap={{ scale:0.98 }}
                onClick={() => setActivePersona(persona)}
                style={{
                  ...card, cursor:'pointer', padding:'18px',
                  border: activePersona.id===persona.id
                    ? `1px solid ${persona.color}50` 
                    : '1px solid rgba(255,255,255,0.07)',
                  background: activePersona.id===persona.id
                    ? `${persona.color}08` 
                    : 'rgba(18,18,26,0.85)',
                  boxShadow: activePersona.id===persona.id
                    ? `0 0 40px ${persona.glow}` 
                    : 'none',
                  transition:'all 0.3s'
                }}
              >
                <div style={{ height:'2px', background: activePersona.id===persona.id ? `linear-gradient(90deg,${persona.color},transparent)` : 'transparent', marginBottom:'12px', borderRadius:'99px' }}/>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                  <motion.span
                    animate={activePersona.id===persona.id ? { scale:[1,1.2,1] } : {}}
                    transition={{ duration:2, repeat:Infinity }}
                    style={{
                      fontSize:'1.6rem',
                      filter: activePersona.id===persona.id ? `drop-shadow(0 0 8px ${persona.color})` : 'none'
                    }}
                  >{persona.emoji}</motion.span>
                  <div>
                    <div style={{
                      fontFamily:"'Clash Display',sans-serif",
                      color: activePersona.id===persona.id ? persona.color : 'white',
                      fontSize:'0.9rem', fontWeight:700
                    }}>{persona.name}</div>
                    <div style={{ color:'#6B7280', fontSize:'0.7rem' }}>{persona.title}</div>
                  </div>
                </div>
                <div style={{ color:'#4B5563', fontSize:'0.72rem', lineHeight:1.4 }}>
                  {persona.description}
                </div>
                {activePersona.id===persona.id && (
                  <motion.div
                    initial={{ opacity:0 }}
                    animate={{ opacity:1 }}
                    style={{
                      marginTop:'10px',
                      background:`${persona.color}15`,
                      border:`1px solid ${persona.color}30`,
                      borderRadius:'99px', padding:'3px 10px',
                      color:persona.color, fontSize:'0.7rem', fontWeight:700,
                      display:'inline-block'
                    }}
                  >● ACTIVE</motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* MAIN CHAT AREA */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'20px' }}>

            {/* CHAT */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Messages */}
              <div style={{
                ...card,
                height:'520px',
                display:'flex', flexDirection:'column',
                border:`1px solid ${activePersona.color}15` 
              }}>
                {/* Chat header */}
                <div style={{
                  padding:'16px 20px',
                  borderBottom:'1px solid rgba(255,255,255,0.06)',
                  display:'flex', alignItems:'center', gap:'12px',
                  background:`${activePersona.color}05` 
                }}>
                  <motion.span
                    animate={{ rotate:[0,10,-10,0] }}
                    transition={{ duration:3, repeat:Infinity }}
                    style={{ fontSize:'1.5rem', filter:`drop-shadow(0 0 8px ${activePersona.color})` }}
                  >{activePersona.emoji}</motion.span>
                  <div>
                    <div style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontWeight:700, fontSize:'0.95rem' }}>
                      {activePersona.name}
                    </div>
                    <div style={{ color:'#6B7280', fontSize:'0.72rem' }}>
                      {loading ? '✍️ Thinking...' : `${activePersona.title} · Online`}
                    </div>
                  </div>
                  {loading && (
                    <motion.div
                      animate={{ opacity:[0.5,1,0.5] }}
                      transition={{ duration:1, repeat:Infinity }}
                      style={{ marginLeft:'auto', color:activePersona.color, fontSize:'0.8rem' }}
                    >⚡ Generating response...</motion.div>
                  )}
                </div>

                {/* Messages container */}
                <div style={{
                  flex:1, overflowY:'auto', padding:'20px',
                  display:'flex', flexDirection:'column', gap:'16px',
                  scrollbarWidth:'thin',
                  scrollbarColor:`${activePersona.color}30 transparent` 
                }}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity:0, y:10, scale:0.98 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={{ duration:0.3 }}
                      style={{
                        display:'flex',
                        justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start',
                        gap:'10px', alignItems:'flex-start'
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <div style={{
                          width:'32px', height:'32px', borderRadius:'50%',
                          background:`${activePersona.color}20`,
                          border:`1px solid ${activePersona.color}40`,
                          display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:'1rem',
                          flexShrink:0
                        }}>{activePersona.emoji}</div>
                      )}

                      <div style={{
                        maxWidth:'75%',
                        padding:'12px 16px',
                        borderRadius: msg.role==='user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                        background: msg.role==='user'
                          ? `linear-gradient(135deg,${activePersona.color},${activePersona.color}80)` 
                          : msg.isError
                            ? 'rgba(255,59,48,0.1)'
                            : 'rgba(255,255,255,0.05)',
                        border: msg.role==='user'
                          ? 'none'
                          : msg.isError
                            ? '1px solid rgba(255,59,48,0.2)'
                            : '1px solid rgba(255,255,255,0.08)',
                        color: msg.role==='user' ? '#000' : '#D1D5DB',
                        fontSize:'0.88rem',
                        lineHeight:1.6,
                        boxShadow: msg.role==='user' ? `0 4px 16px ${activePersona.glow}` : 'none'
                      }}>
                        {msg.role === 'assistant' ? (
                          <div
                            style={{ color:'#D1D5DB', lineHeight:1.7 }}
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                          />
                        ) : (
                          <div style={{ fontWeight:600 }}>{msg.content}</div>
                        )}
                        <div style={{
                          fontSize:'0.65rem',
                          color: msg.role==='user' ? 'rgba(0,0,0,0.5)' : '#4B5563',
                          marginTop:'6px', textAlign: msg.role==='user' ? 'right' : 'left'
                        }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div style={{
                          width:'32px', height:'32px', borderRadius:'50%',
                          background:'linear-gradient(135deg,#7B61FF,#00D4FF)',
                          display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:'0.85rem',
                          color:'white', fontWeight:700, flexShrink:0
                        }}>A</div>
                      )}
                    </motion.div>
                  ))}

                  {/* Streaming message */}
                  {isStreaming && streamedText && (
                    <motion.div
                      initial={{ opacity:0, y:10 }}
                      animate={{ opacity:1, y:0 }}
                      style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}
                    >
                      <div style={{
                        width:'32px', height:'32px', borderRadius:'50%',
                        background:`${activePersona.color}20`,
                        border:`1px solid ${activePersona.color}40`,
                        display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'1rem', flexShrink:0
                      }}>{activePersona.emoji}</div>
                      <div style={{
                        maxWidth:'75%', padding:'12px 16px',
                        borderRadius:'4px 18px 18px 18px',
                        background:'rgba(255,255,255,0.05)',
                        border:'1px solid rgba(255,255,255,0.08)',
                        fontSize:'0.88rem', lineHeight:1.6
                      }}>
                        <div
                          style={{ color:'#D1D5DB', lineHeight:1.7 }}
                          dangerouslySetInnerHTML={{ __html: formatMessage(streamedText) }}
                        />
                        <motion.span
                          animate={{ opacity:[1,0,1] }}
                          transition={{ duration:0.7, repeat:Infinity }}
                          style={{ color:activePersona.color, fontSize:'1rem' }}
                        >▋</motion.span>
                      </div>
                    </motion.div>
                  )}

                  {/* Typing indicator */}
                  {loading && !isStreaming && (
                    <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                      <div style={{
                        width:'32px', height:'32px', borderRadius:'50%',
                        background:`${activePersona.color}20`,
                        border:`1px solid ${activePersona.color}40`,
                        display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'1rem'
                      }}>{activePersona.emoji}</div>
                      <div style={{
                        padding:'12px 16px', borderRadius:'4px 18px 18px 18px',
                        background:'rgba(255,255,255,0.05)',
                        border:'1px solid rgba(255,255,255,0.08)',
                        display:'flex', gap:'6px', alignItems:'center'
                      }}>
                        {[0,1,2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ y:[0,-6,0] }}
                            transition={{ duration:0.6, repeat:Infinity, delay:i*0.15 }}
                            style={{
                              width:'8px', height:'8px', borderRadius:'50%',
                              background:activePersona.color
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef}/>
                </div>

                {/* Input area */}
                <div style={{
                  padding:'16px 20px',
                  borderTop:'1px solid rgba(255,255,255,0.06)',
                  background:'rgba(0,0,0,0.2)'
                }}>
                  {/* Quick starter buttons */}
                  <AnimatePresence>
                    {showQuickActions && messages.length <= 1 && (
                      <motion.div
                        initial={{ opacity:0, height:0 }}
                        animate={{ opacity:1, height:'auto' }}
                        exit={{ opacity:0, height:0 }}
                        style={{ marginBottom:'12px', overflow:'hidden' }}
                      >
                        <div style={{ color:'#4B5563', fontSize:'0.72rem', marginBottom:'8px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                          SUGGESTED QUESTIONS
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                          {activePersona.starters.map((starter, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity:0, scale:0.9 }}
                              animate={{ opacity:1, scale:1 }}
                              transition={{ delay:i*0.06 }}
                              whileHover={{ scale:1.03, background:`${activePersona.color}15` }}
                              whileTap={{ scale:0.97 }}
                              onClick={() => sendMessage(starter)}
                              style={{
                                background:'rgba(255,255,255,0.04)',
                                border:`1px solid ${activePersona.color}25`,
                                borderRadius:'20px', padding:'6px 14px',
                                color:'#9CA3AF', cursor:'pointer',
                                fontSize:'0.78rem', fontFamily:"'Satoshi',sans-serif",
                                transition:'all 0.2s', textAlign:'left'
                              }}
                            >{starter}</motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input row */}
                  <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                    <div style={{ flex:1, position:'relative' }}>
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key==='Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder={`Ask ${activePersona.name} anything... (Enter to send, Shift+Enter for new line)`}
                        rows={2}
                        style={{
                          width:'100%', boxSizing:'border-box',
                          background:'rgba(255,255,255,0.05)',
                          border:`1px solid ${activePersona.color}30`,
                          borderRadius:'14px', padding:'12px 16px',
                          color:'#F0F0FF', fontSize:'0.9rem',
                          outline:'none', resize:'none',
                          fontFamily:"'Satoshi',sans-serif",
                          lineHeight:1.5,
                          transition:'border-color 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor=`${activePersona.color}60`}
                        onBlur={e => e.target.style.borderColor=`${activePersona.color}30`}
                      />
                      <div style={{
                        position:'absolute', bottom:'8px', right:'12px',
                        color:'#374151', fontSize:'0.68rem'
                      }}>⌨️ Enter to send</div>
                    </div>
                    <motion.button
                      whileHover={{ scale:1.05, boxShadow:`0 8px 24px ${activePersona.glow}` }}
                      whileTap={{ scale:0.95 }}
                      onClick={() => sendMessage()}
                      disabled={loading || !input.trim()}
                      style={{
                        width:'48px', height:'48px', borderRadius:'14px',
                        background: input.trim() && !loading
                          ? `linear-gradient(135deg,${activePersona.color},${activePersona.color}80)` 
                          : 'rgba(255,255,255,0.06)',
                        border:`1px solid ${input.trim() && !loading ? activePersona.color : 'rgba(255,255,255,0.1)'}`,
                        color: input.trim() && !loading ? '#000' : '#4B5563',
                        cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                        fontSize:'1.1rem', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        transition:'all 0.2s', flexShrink:0
                      }}
                    >
                      {loading ? (
                        <motion.span
                          animate={{ rotate:360 }}
                          transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                        >⚙️</motion.span>
                      ) : '➤'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Quick Actions */}
              <div style={{ ...card, padding:'20px', border:`1px solid ${activePersona.color}15` }}>
                <div style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'0.95rem', fontWeight:700, marginBottom:'14px' }}>
                  ⚡ Quick Actions
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {QUICK_ACTIONS.map((action, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity:0, x:20 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay:i*0.05 }}
                      whileHover={{ x:4, background:`${activePersona.color}10` }}
                      whileTap={{ scale:0.97 }}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={loading}
                      style={{
                        background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.06)',
                        borderRadius:'12px', padding:'10px 12px',
                        color:'#D1D5DB', cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize:'0.8rem', textAlign:'left',
                        display:'flex', alignItems:'center', gap:'8px',
                        fontFamily:"'Satoshi',sans-serif",
                        transition:'all 0.2s', opacity: loading ? 0.5 : 1
                      }}
                    >
                      <span style={{ fontSize:'1rem', flexShrink:0 }}>{action.emoji}</span>
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ ...card, padding:'20px' }}>
                <div style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'0.95rem', fontWeight:700, marginBottom:'14px' }}>
                  📊 Session Stats
                </div>
                {[
                  { label:'Messages',   val:messages.filter(m=>m.role==='user').length,     icon:'💬', color:activePersona.color },
                  { label:'AI Responses',val:messages.filter(m=>m.role==='assistant').length,icon:'🤖', color:'#7B61FF' },
                  { label:'Coach',       val:activePersona.name,                              icon:'👤', color:'#00D4FF' },
                  { label:'Model',       val:'Claude 3.5',                                    icon:'⚡', color:'#FFD700' },
                ].map(s => (
                  <div key={s.label} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{ color:'#6B7280', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'6px' }}>
                      {s.icon} {s.label}
                    </span>
                    <span style={{ color:s.color, fontWeight:700, fontSize:'0.82rem' }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div style={{
                ...card, padding:'20px',
                background:`${activePersona.color}06`,
                border:`1px solid ${activePersona.color}20` 
              }}>
                <div style={{ fontFamily:"'Clash Display',sans-serif", color:activePersona.color, fontSize:'0.95rem', fontWeight:700, marginBottom:'12px' }}>
                  💡 Pro Tips
                </div>
                {[
                  'Be specific about your weight, height, age for better advice',
                  'Mention your fitness level and available equipment',
                  'Ask follow-up questions to dive deeper into any topic',
                  'Use Shift+Enter for multi-line messages',
                ].map((tip, i) => (
                  <div key={i} style={{
                    display:'flex', gap:'8px', marginBottom:'8px',
                    color:'#9CA3AF', fontSize:'0.75rem', lineHeight:1.5
                  }}>
                    <span style={{ color:activePersona.color, flexShrink:0 }}>▸</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
