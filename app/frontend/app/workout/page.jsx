'use client'
import { useState, useEffect, useMemo } from 'react'
import { workouts as workoutsApi } from '../../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import useIsMobile from '../../lib/useIsMobile'
import MuscleBodyMap from '../../components/workout/MuscleBodyMap'
import EditorialMuscleExplorer from '../../components/workout/EditorialMuscleExplorer'
import ScenicBackdrop from '@/components/shared/ScenicBackdrop'
// PageWrapper removed to fix double-wrap bug

// ─── Gym utility helpers ──────────────────────────────────────────────────────
const PLATES = [
  { kg: 25,   color: '#EF4444' },
  { kg: 20,   color: '#3B82F6' },
  { kg: 15,   color: '#EAB308' },
  { kg: 10,   color: '#22C55E' },
  { kg: 5,    color: '#E5E7EB' },
  { kg: 2.5,  color: '#EF4444' },
  { kg: 1.25, color: '#9CA3AF' },
]

/** Greedy plate loading: returns array of {kg,color} per side + remainder */
function calcPlates(targetKg, barKg) {
  let perSide = (targetKg - barKg) / 2
  if (perSide <= 0) return { plates: [], remainder: perSide }
  const plates = []
  for (const p of PLATES) {
    while (perSide >= p.kg - 1e-9) {
      plates.push(p)
      perSide = Math.round((perSide - p.kg) * 100) / 100
    }
  }
  return { plates, remainder: Math.round(perSide * 100) / 100 }
}

/** Epley estimated 1RM: weight × (1 + reps/30) */
function epley1RM(weightKg, reps) {
  const w = Number(weightKg)
  const r = Number(reps)
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) return null
  return Math.round(w * (1 + r / 30) * 2) / 2
}

/** Parse a rep scheme like '6-8', '10/leg', '30 sec', 'flows' → representative rep number */
function parseReps(repStr) {
  if (!repStr) return null
  const s = String(repStr)
  const range = s.match(/(\d+)\s*-\s*(\d+)/)
  if (range) return Math.round((Number(range[1]) + Number(range[2])) / 2)
  const single = s.match(/(\d+)/)
  if (single) return Number(single[1])
  return null
}

const PR_STORAGE_KEY = 'nutriai_prs_v1'
const SESSION_LOG_KEY = 'nutriai_session_log_v1'

function loadPRs() {
  try { return JSON.parse(localStorage.getItem(PR_STORAGE_KEY) || '{}') } catch { return {} }
}
function savePR(exName, weight, reps, oneRM) {
  const prs = loadPRs()
  prs[exName] = { weight, reps, oneRM, date: new Date().toISOString() }
  try { localStorage.setItem(PR_STORAGE_KEY, JSON.stringify(prs)) } catch {}
  return prs
}
function appendSessionLog(entry) {
  try {
    const log = JSON.parse(localStorage.getItem(SESSION_LOG_KEY) || '[]')
    log.push(entry)
    localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(log.slice(-200)))
  } catch {}
}

const WORKOUTS = [
  {
    id:1, name:'Upper Body Strength', emoji:'💪', duration:45, calories:320,
    difficulty:'Intermediate', category:'Strength', equipment:'Gym',
    color:'#FF6B5E', glow:'rgba(255,107,94,0.3)',
    muscles:['Chest','Shoulders','Triceps','Back'],
    description:'Build powerful upper body with compound movements',
    exercises:[
      { name:'Barbell Bench Press',    sets:4, reps:'6-8',   rest:90,  muscle:'Chest',      emoji:'🏋️', tip:'Keep shoulder blades retracted', calories:45 },
      { name:'Incline Dumbbell Press', sets:3, reps:'10-12', rest:75,  muscle:'Upper Chest', emoji:'💪', tip:'Control the negative', calories:35 },
      { name:'Cable Chest Fly',        sets:3, reps:'12-15', rest:60,  muscle:'Chest',       emoji:'🦅', tip:'Squeeze at peak contraction', calories:28 },
      { name:'Overhead Press',         sets:4, reps:'8-10',  rest:90,  muscle:'Shoulders',   emoji:'⬆️', tip:'Brace your core throughout', calories:42 },
      { name:'Lateral Raises',         sets:4, reps:'15-20', rest:45,  muscle:'Side Delts',  emoji:'🦅', tip:'Lead with elbows not hands', calories:22 },
      { name:'Front Raises',           sets:3, reps:'12-15', rest:45,  muscle:'Front Delts', emoji:'⬆️', tip:'Avoid swinging', calories:20 },
      { name:'Tricep Pushdown',        sets:4, reps:'12-15', rest:60,  muscle:'Triceps',     emoji:'💥', tip:'Keep elbows pinned to sides', calories:25 },
      { name:'Skull Crushers',         sets:3, reps:'10-12', rest:75,  muscle:'Triceps',     emoji:'💀', tip:'Lower bar to forehead slowly', calories:28 },
      { name:'Pull Ups',               sets:3, reps:'8-10',  rest:90,  muscle:'Back',        emoji:'🔝', tip:'Full range of motion', calories:38 },
      { name:'Face Pulls',             sets:3, reps:'15-20', rest:45,  muscle:'Rear Delts',  emoji:'🎯', tip:'External rotate at end', calories:18 },
    ]
  },
  {
    id:2, name:'Lower Body Power', emoji:'🦵', duration:55, calories:420,
    difficulty:'Advanced', category:'Strength', equipment:'Gym',
    color:'#7B61FF', glow:'rgba(123,97,255,0.3)',
    muscles:['Quads','Hamstrings','Glutes','Calves'],
    description:'Explosive lower body power and muscle building',
    exercises:[
      { name:'Barbell Back Squat',    sets:5, reps:'5',      rest:180, muscle:'Quads',       emoji:'🏋️', tip:'Break parallel for full activation', calories:65 },
      { name:'Romanian Deadlift',     sets:4, reps:'8-10',   rest:120, muscle:'Hamstrings',  emoji:'💪', tip:'Hinge at hips, soft knee bend', calories:55 },
      { name:'Leg Press',             sets:4, reps:'12-15',  rest:90,  muscle:'Quads',       emoji:'🦵', tip:'Feet shoulder width apart', calories:48 },
      { name:'Bulgarian Split Squat', sets:3, reps:'10/leg', rest:75,  muscle:'Glutes',      emoji:'🎯', tip:'Front shin stays vertical', calories:42 },
      { name:'Leg Curl',              sets:4, reps:'12-15',  rest:60,  muscle:'Hamstrings',  emoji:'🔄', tip:'Full squeeze at top', calories:32 },
      { name:'Leg Extension',         sets:3, reps:'15',     rest:60,  muscle:'Quads',       emoji:'⚡', tip:'Hold 1 second at extension', calories:28 },
      { name:'Hip Thrust',            sets:4, reps:'12',     rest:75,  muscle:'Glutes',      emoji:'🍑', tip:'Drive through heels', calories:38 },
      { name:'Walking Lunges',        sets:3, reps:'20/leg', rest:60,  muscle:'Full Legs',   emoji:'🚶', tip:'Keep torso upright', calories:45 },
      { name:'Standing Calf Raise',   sets:5, reps:'20',     rest:45,  muscle:'Calves',      emoji:'🦶', tip:'Full stretch at bottom', calories:22 },
      { name:'Seated Calf Raise',     sets:4, reps:'20',     rest:45,  muscle:'Soleus',      emoji:'🦶', tip:'Slow controlled reps', calories:18 },
    ]
  },
  {
    id:3, name:'HIIT Cardio Blast', emoji:'🔥', duration:30, calories:480,
    difficulty:'Advanced', category:'Cardio', equipment:'None',
    color:'#FFB020', glow:'rgba(255,176,32,0.3)',
    muscles:['Full Body','Core','Cardiovascular'],
    description:'Maximum calorie burn in minimum time',
    exercises:[
      { name:'Burpees',              sets:4, reps:'15',     rest:20,  muscle:'Full Body', emoji:'💥', tip:'Explode up on jump', calories:55 },
      { name:'Jump Squats',          sets:4, reps:'20',     rest:20,  muscle:'Legs',      emoji:'⬆️', tip:'Land softly, absorb impact', calories:48 },
      { name:'Mountain Climbers',    sets:4, reps:'30 sec', rest:15,  muscle:'Core',      emoji:'🏔️', tip:'Keep hips level', calories:42 },
      { name:'High Knees',           sets:4, reps:'30 sec', rest:15,  muscle:'Cardio',    emoji:'🏃', tip:'Pump arms vigorously', calories:40 },
      { name:'Plank to Push Up',     sets:3, reps:'12',     rest:20,  muscle:'Core/Chest',emoji:'💪', tip:'Maintain plank position', calories:35 },
      { name:'Box Jumps',            sets:4, reps:'10',     rest:30,  muscle:'Explosive', emoji:'📦', tip:'Full hip extension at top', calories:52 },
      { name:'Battle Rope Slams',    sets:4, reps:'20 sec', rest:20,  muscle:'Full Body', emoji:'🌊', tip:'Use whole body not just arms', calories:50 },
      { name:'Sprint Intervals',     sets:8, reps:'20 sec', rest:10,  muscle:'Cardio',    emoji:'⚡', tip:'Maximum effort every rep', calories:60 },
      { name:'Lateral Bounds',       sets:3, reps:'10/side',rest:20,  muscle:'Legs/Core', emoji:'↔️', tip:'Stick the landing', calories:38 },
      { name:'Tuck Jumps',           sets:3, reps:'12',     rest:30,  muscle:'Full Body', emoji:'🦘', tip:'Pull knees to chest', calories:48 },
    ]
  },
  {
    id:4, name:'Core Destroyer', emoji:'🎯', duration:35, calories:220,
    difficulty:'Intermediate', category:'Core', equipment:'Minimal',
    color:'#9DCE2C', glow:'rgba(157,206,44,0.3)',
    muscles:['Rectus Abdominis','Obliques','Transverse Abs','Lower Back'],
    description:'Build a rock-solid core from every angle',
    exercises:[
      { name:'Weighted Crunches',    sets:4, reps:'20',     rest:30,  muscle:'Upper Abs',   emoji:'💪', tip:'Hold weight at chest', calories:28 },
      { name:'Hanging Leg Raises',   sets:4, reps:'12-15',  rest:45,  muscle:'Lower Abs',   emoji:'⬆️', tip:'Posterior pelvic tilt at top', calories:32 },
      { name:'Cable Woodchop',       sets:3, reps:'15/side',rest:45,  muscle:'Obliques',    emoji:'🪓', tip:'Rotate from hips not shoulders', calories:25 },
      { name:'Ab Wheel Rollout',     sets:4, reps:'10-12',  rest:60,  muscle:'Full Core',   emoji:'⚙️', tip:'Keep hips from sagging', calories:35 },
      { name:'Dragon Flag',          sets:3, reps:'6-8',    rest:60,  muscle:'Full Core',   emoji:'🐉', tip:'Control the descent', calories:38 },
      { name:'Pallof Press',         sets:3, reps:'12/side',rest:45,  muscle:'Anti-Rotation',emoji:'🎯',tip:'Resist rotation throughout', calories:20 },
      { name:'V-Ups',                sets:4, reps:'15',     rest:30,  muscle:'Full Abs',    emoji:'✌️', tip:'Touch toes at top', calories:30 },
      { name:'Side Plank',           sets:3, reps:'45 sec', rest:30,  muscle:'Obliques',    emoji:'📐', tip:'Stack feet or stagger', calories:22 },
      { name:'Dead Bug',             sets:3, reps:'10/side',rest:30,  muscle:'Deep Core',   emoji:'🐛', tip:'Lower back pressed to floor', calories:18 },
      { name:'L-Sit Hold',           sets:4, reps:'20 sec', rest:40,  muscle:'Core/Hip Flex',emoji:'🔡',tip:'Depress and protract scapula', calories:25 },
    ]
  },
  {
    id:5, name:'Pull Day', emoji:'🎣', duration:50, calories:360,
    difficulty:'Intermediate', category:'Strength', equipment:'Gym',
    color:'#FFD700', glow:'rgba(255,215,0,0.3)',
    muscles:['Back','Biceps','Rear Delts','Traps'],
    description:'Complete back and bicep development',
    exercises:[
      { name:'Deadlift',             sets:4, reps:'5',      rest:180, muscle:'Full Back',   emoji:'🏋️', tip:'Bar stays close to body', calories:72 },
      { name:'Bent Over Barbell Row',sets:4, reps:'8-10',   rest:90,  muscle:'Mid Back',    emoji:'🚣', tip:'Pull to lower chest', calories:52 },
      { name:'Wide Grip Pull Up',    sets:4, reps:'8-10',   rest:90,  muscle:'Lats',        emoji:'🔝', tip:'Depress shoulders before pull', calories:45 },
      { name:'Seated Cable Row',     sets:3, reps:'12',     rest:75,  muscle:'Mid Back',    emoji:'🎣', tip:'Keep chest tall throughout', calories:38 },
      { name:'Lat Pulldown',         sets:4, reps:'12-15',  rest:60,  muscle:'Lats',        emoji:'⬇️', tip:'Lean back slightly at top', calories:35 },
      { name:'Single Arm Row',       sets:3, reps:'12/arm', rest:60,  muscle:'Lats/Rhomboids',emoji:'💪',tip:'Full stretch at bottom', calories:30 },
      { name:'Barbell Curl',         sets:4, reps:'10-12',  rest:60,  muscle:'Biceps',      emoji:'💪', tip:'Full supination at top', calories:28 },
      { name:'Hammer Curl',          sets:3, reps:'12-15',  rest:45,  muscle:'Brachialis',  emoji:'🔨', tip:'Neutral grip throughout', calories:22 },
      { name:'Reverse Curl',         sets:3, reps:'15',     rest:45,  muscle:'Brachioradialis',emoji:'🔄',tip:'Slow eccentric', calories:20 },
      { name:'Face Pulls',           sets:4, reps:'20',     rest:45,  muscle:'Rear Delts',  emoji:'🎯', tip:'Pull to eye level', calories:18 },
    ]
  },
  {
    id:6, name:'Push Day', emoji:'⬆️', duration:48, calories:340,
    difficulty:'Intermediate', category:'Strength', equipment:'Gym',
    color:'#22D3EE', glow:'rgba(34,211,238,0.3)',
    muscles:['Chest','Shoulders','Triceps'],
    description:'Maximum push strength and hypertrophy',
    exercises:[
      { name:'Flat Barbell Press',   sets:4, reps:'6-8',   rest:120, muscle:'Chest',       emoji:'🏋️', tip:'Touch chest on each rep', calories:52 },
      { name:'Dumbbell Shoulder Press',sets:4,reps:'10',   rest:90,  muscle:'Shoulders',   emoji:'💪', tip:'Control the negative', calories:45 },
      { name:'Incline DB Press',     sets:3, reps:'12',    rest:75,  muscle:'Upper Chest',  emoji:'⬆️', tip:'30-45 degree incline', calories:38 },
      { name:'Cable Lateral Raise',  sets:4, reps:'15',    rest:45,  muscle:'Side Delts',   emoji:'🦅', tip:'Consistent tension throughout', calories:25 },
      { name:'Chest Dips',           sets:3, reps:'12-15', rest:75,  muscle:'Lower Chest',  emoji:'↓', tip:'Lean forward to hit chest', calories:35 },
      { name:'Arnold Press',         sets:3, reps:'12',    rest:60,  muscle:'Full Delt',    emoji:'🎭', tip:'Full rotation on way up', calories:32 },
      { name:'Pec Deck Fly',         sets:3, reps:'15',    rest:60,  muscle:'Chest',        emoji:'🦋', tip:'Maintain slight arm bend', calories:28 },
      { name:'Tricep Pushdown',      sets:4, reps:'15',    rest:45,  muscle:'Triceps',      emoji:'⬇️', tip:'Lock elbows at sides', calories:22 },
      { name:'Overhead Tricep Ext',  sets:3, reps:'12',    rest:60,  muscle:'Long Head',    emoji:'💪', tip:'Full stretch overhead', calories:25 },
      { name:'Diamond Push Ups',     sets:3, reps:'15',    rest:45,  muscle:'Triceps',      emoji:'💎', tip:'Keep elbows close to body', calories:28 },
    ]
  },
  {
    id:7, name:'Full Body Functional', emoji:'⚡', duration:45, calories:380,
    difficulty:'Beginner', category:'Functional', equipment:'Minimal',
    color:'#15B2CF', glow:'rgba(21, 178, 207,0.3)',
    muscles:['Full Body','Core','Stability'],
    description:'Movement patterns for real world strength',
    exercises:[
      { name:'Goblet Squat',          sets:4, reps:'15',    rest:60,  muscle:'Quads/Core',  emoji:'🏆', tip:'Keep chest tall', calories:38 },
      { name:'Push Up Variations',    sets:4, reps:'15',    rest:45,  muscle:'Chest/Core',  emoji:'💪', tip:'3 types: wide/narrow/archer', calories:32 },
      { name:'Kettlebell Swing',      sets:4, reps:'20',    rest:45,  muscle:'Posterior',   emoji:'🔔', tip:'Hip hinge not squat', calories:45 },
      { name:'TRX Row',               sets:3, reps:'15',    rest:45,  muscle:'Back',        emoji:'🎯', tip:'Body at 45 degrees', calories:28 },
      { name:'Lunge to Press',        sets:3, reps:'10/leg',rest:60,  muscle:'Full Body',   emoji:'⬆️', tip:'Stable base before press', calories:42 },
      { name:'Bear Crawl',            sets:3, reps:'20m',   rest:45,  muscle:'Full Body',   emoji:'🐻', tip:'Opposite arm/leg move', calories:35 },
      { name:'Single Leg Deadlift',   sets:3, reps:'10/leg',rest:60,  muscle:'Hamstrings',  emoji:'🦩', tip:'Hip hinge with balance', calories:30 },
      { name:'Renegade Row',          sets:3, reps:'10/arm',rest:60,  muscle:'Back/Core',   emoji:'🚣', tip:'Minimize hip rotation', calories:35 },
      { name:'Turkish Get Up',        sets:3, reps:'5/side',rest:90,  muscle:'Full Body',   emoji:'🌅', tip:'Slow controlled movement', calories:45 },
      { name:'Plank Variations',      sets:4, reps:'45 sec',rest:30,  muscle:'Core',        emoji:'🧱', tip:'4 variations: front/side/RKC/stir',calories:22 },
    ]
  },
  {
    id:8, name:'Yoga Flow', emoji:'🧘', duration:50, calories:160,
    difficulty:'Beginner', category:'Flexibility', equipment:'Mat',
    color:'#F472B6', glow:'rgba(244,114,182,0.3)',
    muscles:['Full Body','Spine','Hips','Shoulders'],
    description:'Improve flexibility, balance and mindfulness',
    exercises:[
      { name:'Sun Salutation A',      sets:5, reps:'flows',  rest:30,  muscle:'Full Body',  emoji:'☀️', tip:'Sync breath with movement', calories:18 },
      { name:'Sun Salutation B',      sets:3, reps:'flows',  rest:30,  muscle:'Full Body',  emoji:'🌅', tip:'Hold warrior 1 for 5 breaths', calories:22 },
      { name:'Warrior I',             sets:2, reps:'60 sec', rest:15,  muscle:'Hips/Legs',  emoji:'⚔️', tip:'Square hips to front', calories:12 },
      { name:'Warrior II',            sets:2, reps:'60 sec', rest:15,  muscle:'Hips/Legs',  emoji:'🛡️', tip:'Arms parallel to ground', calories:12 },
      { name:'Warrior III',           sets:2, reps:'45 sec', rest:20,  muscle:'Balance',    emoji:'✈️', tip:'Flex standing foot', calories:15 },
      { name:'Triangle Pose',         sets:2, reps:'60 sec', rest:15,  muscle:'Side Body',  emoji:'📐', tip:'Lengthen both sides equally', calories:10 },
      { name:'Pigeon Pose',           sets:2, reps:'90 sec', rest:15,  muscle:'Hip Flexors',emoji:'🕊️', tip:'Square hips to mat', calories:8 },
      { name:'Camel Pose',            sets:3, reps:'30 sec', rest:20,  muscle:'Spine/Chest',emoji:'🐪', tip:'Push hips forward first', calories:12 },
      { name:'Crow Pose',             sets:5, reps:'15 sec', rest:30,  muscle:'Core/Arms',  emoji:'🦅', tip:'Gaze forward not down', calories:18 },
      { name:'Headstand',             sets:3, reps:'30 sec', rest:60,  muscle:'Core/Balance',emoji:'🔃',tip:'Build up against wall', calories:15 },
    ]
  },
  {
    id:9, name:'Powerlifting', emoji:'🏋️', duration:70, calories:450,
    difficulty:'Advanced', category:'Strength', equipment:'Gym',
    color:'#5B5BD6', glow:'rgba(91,91,214,0.3)',
    muscles:['Full Body','CNS','Max Strength'],
    description:'Build maximum strength with the big three',
    exercises:[
      { name:'Competition Squat',    sets:5, reps:'3',      rest:300, muscle:'Full Body',   emoji:'🏆', tip:'Compete grip width, high bar', calories:80 },
      { name:'Paused Squat',         sets:3, reps:'3',      rest:240, muscle:'Quads',       emoji:'⏸️', tip:'2 second pause at bottom', calories:65 },
      { name:'Squat Walkout',        sets:3, reps:'5 sec',  rest:180, muscle:'Neural',      emoji:'🧠', tip:'Walk out heavier than max', calories:25 },
      { name:'Competition Bench',    sets:5, reps:'3',      rest:300, muscle:'Chest',       emoji:'🏋️', tip:'Pause on chest, leg drive', calories:55 },
      { name:'Board Press',          sets:3, reps:'3',      rest:240, muscle:'Triceps',     emoji:'🪵', tip:'Builds lockout strength', calories:45 },
      { name:'Spoto Press',          sets:3, reps:'4',      rest:180, muscle:'Chest',       emoji:'⏸️', tip:'1 inch off chest pause', calories:42 },
      { name:'Competition Deadlift', sets:5, reps:'3',      rest:300, muscle:'Full Body',   emoji:'⚡', tip:'Conventional or sumo stance', calories:90 },
      { name:'Deficit Deadlift',     sets:3, reps:'4',      rest:240, muscle:'Hamstrings',  emoji:'📉', tip:'Stand on 2 inch platform', calories:72 },
      { name:'Romanian Deadlift',    sets:3, reps:'6',      rest:180, muscle:'Hamstrings',  emoji:'💪', tip:'Feel stretch in hamstrings', calories:55 },
      { name:'Hip Flexor Stretch',   sets:3, reps:'60 sec', rest:20,  muscle:'Recovery',    emoji:'🧘', tip:'Essential for powerlifters', calories:5 },
    ]
  },
  {
    id:10, name:'Calisthenics Skills', emoji:'🤸', duration:60, calories:320,
    difficulty:'Advanced', category:'Calisthenics', equipment:'Bar',
    color:'#A78BFA', glow:'rgba(167,139,250,0.3)',
    muscles:['Full Body','Core','Relative Strength'],
    description:'Master bodyweight skills and progressions',
    exercises:[
      { name:'Muscle Up',            sets:5, reps:'3-5',    rest:180, muscle:'Full Body',   emoji:'⬆️', tip:'False grip for rings version', calories:45 },
      { name:'Front Lever',          sets:5, reps:'5-10 sec',rest:120,muscle:'Back/Core',   emoji:'↔️', tip:'Start with tuck progression', calories:35 },
      { name:'Back Lever',           sets:5, reps:'5-10 sec',rest:120,muscle:'Shoulders',   emoji:'↔️', tip:'German hang first', calories:30 },
      { name:'Planche Leans',        sets:5, reps:'10 sec', rest:90,  muscle:'Shoulders',   emoji:'✈️', tip:'Protract and lean forward', calories:28 },
      { name:'Handstand Push Up',    sets:4, reps:'5-8',    rest:120, muscle:'Shoulders',   emoji:'🙃', tip:'Kick up to wall first', calories:38 },
      { name:'Pistol Squat',         sets:4, reps:'5/leg',  rest:75,  muscle:'Quads',       emoji:'🔫', tip:'Heel elevated progression', calories:32 },
      { name:'One Arm Push Up',      sets:3, reps:'5/arm',  rest:90,  muscle:'Chest',       emoji:'☝️', tip:'Wide foot stance to start', calories:35 },
      { name:'Human Flag',           sets:5, reps:'5 sec',  rest:120, muscle:'Core/Lats',   emoji:'🚩', tip:'Push bottom arm, pull top', calories:30 },
      { name:'Dragon Flag',          sets:4, reps:'5-8',    rest:90,  muscle:'Full Core',   emoji:'🐉', tip:'Control every inch down', calories:38 },
      { name:'L-Sit to V-Sit',       sets:4, reps:'5-8',    rest:75,  muscle:'Core/Hip Flex',emoji:'✌️',tip:'Hollow body position key', calories:28 },
    ]
  },
  {
    id:11, name:'Athletic Speed & Agility', emoji:'⚡', duration:40, calories:420,
    difficulty:'Intermediate', category:'Athletic', equipment:'Open Space',
    color:'#FBBF24', glow:'rgba(251,191,36,0.3)',
    muscles:['Fast Twitch','Explosive Power','Coordination'],
    description:'Train like a professional athlete',
    exercises:[
      { name:'Sprint Drills',         sets:6, reps:'40m',    rest:60,  muscle:'Full Body',  emoji:'🏃', tip:'Drive knees high', calories:55 },
      { name:'Plyometric Box Jump',   sets:5, reps:'8',      rest:60,  muscle:'Explosive',  emoji:'📦', tip:'Absorb landing quietly', calories:48 },
      { name:'Lateral Shuffle',       sets:4, reps:'10m x3', rest:45,  muscle:'Agility',    emoji:'↔️', tip:'Stay low throughout', calories:35 },
      { name:'Cone Drills',           sets:4, reps:'30 sec', rest:45,  muscle:'Agility',    emoji:'🔶', tip:'Sharp cuts on toes', calories:42 },
      { name:'Depth Jumps',           sets:4, reps:'6',      rest:90,  muscle:'Reactive',   emoji:'⬇️', tip:'Minimum ground contact', calories:45 },
      { name:'Bounding',              sets:4, reps:'30m',    rest:60,  muscle:'Explosive',  emoji:'🦘', tip:'Maximum distance per bound', calories:50 },
      { name:'T-Drill',               sets:5, reps:'full',   rest:60,  muscle:'Agility',    emoji:'🅃', tip:'Touch each cone properly', calories:40 },
      { name:'Reaction Drills',       sets:4, reps:'30 sec', rest:30,  muscle:'Neural',     emoji:'⚡', tip:'Respond to visual cues', calories:30 },
      { name:'Broad Jump',            sets:4, reps:'8',      rest:60,  muscle:'Explosive',  emoji:'⬆️', tip:'Swing arms for momentum', calories:42 },
      { name:'Ladder Drills',         sets:5, reps:'full',   rest:45,  muscle:'Coordination',emoji:'🪜',tip:'High cadence not high steps', calories:35 },
    ]
  },
  {
    id:12, name:'Boxing & MMA Conditioning', emoji:'🥊', duration:45, calories:540,
    difficulty:'Advanced', category:'Combat', equipment:'Bag/Gloves',
    color:'#15B2CF', glow:'rgba(21, 178, 207,0.3)',
    muscles:['Full Body','Core','Cardiovascular'],
    description:'Fighter-level conditioning and striking power',
    exercises:[
      { name:'Shadow Boxing',         sets:5, reps:'2 min',  rest:30,  muscle:'Full Body',  emoji:'👊', tip:'Visualize opponent movements', calories:55 },
      { name:'Heavy Bag Combos',      sets:6, reps:'2 min',  rest:45,  muscle:'Full Body',  emoji:'🥊', tip:'1-2-3-2 basic combo', calories:68 },
      { name:'Speed Bag',             sets:4, reps:'90 sec', rest:30,  muscle:'Shoulders',  emoji:'⚡', tip:'Rhythmic triple hit pattern', calories:42 },
      { name:'Jump Rope',             sets:5, reps:'3 min',  rest:45,  muscle:'Cardio',     emoji:'🪢', tip:'Double unders for intensity', calories:62 },
      { name:'Defensive Slips',       sets:4, reps:'30 sec', rest:20,  muscle:'Core/Neck',  emoji:'👀', tip:'Slip and roll combinations', calories:28 },
      { name:'Teep Kick Drills',      sets:4, reps:'20/leg', rest:30,  muscle:'Hips/Core',  emoji:'🦵', tip:'Extend hip at impact', calories:38 },
      { name:'Sprawl Drills',         sets:4, reps:'10',     rest:30,  muscle:'Full Body',  emoji:'⬇️', tip:'Explosive hip sprawl back', calories:45 },
      { name:'Clinch Work',           sets:3, reps:'2 min',  rest:45,  muscle:'Core/Arms',  emoji:'🤼', tip:'Control head position', calories:40 },
      { name:'Pad Work',              sets:4, reps:'2 min',  rest:45,  muscle:'Full Body',  emoji:'🎯', tip:'Sharp snappy shots', calories:58 },
      { name:'Conditioning Circuit',  sets:3, reps:'3 min',  rest:60,  muscle:'Full Body',  emoji:'⚡', tip:'Max effort each round', calories:72 },
    ]
  },
]

const WEEKLY_PLAN = [
  { day:'Mon', workout:'Upper Body Strength', status:'done',    calories:320 },
  { day:'Tue', workout:'HIIT Cardio Blast',   status:'done',    calories:480 },
  { day:'Wed', workout:'Lower Body Power',    status:'done',    calories:420 },
  { day:'Thu', workout:'Rest Day',            status:'rest',    calories:0 },
  { day:'Fri', workout:'Pull Day',            status:'active',  calories:360 },
  { day:'Sat', workout:'Core Destroyer',      status:'upcoming',calories:220 },
  { day:'Sun', workout:'Yoga Flow',           status:'upcoming',calories:160 },
]

const CATEGORIES = ['All','Strength','Cardio','Core','Flexibility','Functional','Calisthenics','Athletic','Combat']
const DIFFICULTIES = ['All','Beginner','Intermediate','Advanced']
const EQUIPMENT = ['All','None','Minimal','Bar','Gym','Mat','Open Space','Bag/Gloves']

const PRS = [
  { lift:'Bench Press', weight:'80kg', date:'Feb 28', emoji:'🏋️', color:'#1FA8C9' },
  { lift:'Squat',       weight:'120kg',date:'Mar 2',  emoji:'🦵', color:'#7B61FF' },
  { lift:'Deadlift',    weight:'140kg',date:'Mar 5',  emoji:'⚡', color:'#15B2CF' },
  { lift:'OHP',         weight:'55kg', date:'Feb 20', emoji:'⬆️', color:'#4FD3ED' },
]

export default function WorkoutPage() {
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeDifficulty, setActiveDifficulty] = useState('All')
  const [activeEquipment, setActiveEquipment] = useState('All')
  const [selected, setSelected] = useState(null)
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [completedExercises, setCompletedExercises] = useState([])
  const [myWorkouts, setMyWorkouts] = useState([])

  // Real workout history for stats + heatmap
  const loadMyWorkouts = async () => {
    try {
      const res = await workoutsApi.getAll()
      if (Array.isArray(res.data)) setMyWorkouts(res.data)
    } catch (e) { console.error('Failed to load workout history:', e.message) }
  }
  useEffect(() => { loadMyWorkouts() }, [])
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [restTimer, setRestTimer] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('workouts')
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [expandedExercise, setExpandedExercise] = useState(null)
  // ─── Gym utilities state ───
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const [plateTarget, setPlateTarget] = useState(100)
  const [plateBar, setPlateBar] = useState(20)
  const [prCelebration, setPrCelebration] = useState([])
  const [exInputs, setExInputs] = useState({}) // idx → { weight, reps } working-set input during active workout
  const [detailWeights, setDetailWeights] = useState({}) // idx → weight input inside the detail modal
  const [realPRs, setRealPRs] = useState({})
  useEffect(() => { try { setRealPRs(loadPRs()) } catch {} }, [])

  useEffect(() => {
    let interval
    if (timerRunning) interval = setInterval(() => setTimer(t => t+1), 1000)
    return () => clearInterval(interval)
  }, [timerRunning])

  useEffect(() => {
    let interval
    if (restTimer > 0) interval = setInterval(() => setRestTimer(t => t-1), 1000)
    return () => clearInterval(interval)
  }, [restTimer])

  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  // ---- real stats from logged workouts ----
  const workoutStats = useMemo(() => {
    const days = new Set()
    let weekSessions = 0, totalKcal = 0
    const now = new Date()
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
    for (const w of myWorkouts) {
      const d = new Date(w.createdAt || w.date)
      if (isNaN(d)) continue
      days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
      if (d >= weekAgo) weekSessions++
      totalKcal += w.calories || 0
    }
    // consecutive-day streak ending today/yesterday
    let streak = 0
    const cursor = new Date(now)
    if (!days.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) cursor.setDate(cursor.getDate() - 1)
    while (days.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return { streak, weekSessions, totalKcal, total: myWorkouts.length }
  }, [myWorkouts])

  // 12-week heatmap grid: weeks x days, 1 = trained (intensity = sessions that day)
  const heatmapGrid = useMemo(() => {
    const counts = {}
    for (const w of myWorkouts) {
      const d = new Date(w.createdAt || w.date)
      if (isNaN(d)) continue
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      counts[key] = (counts[key] || 0) + 1
    }
    const weeks = []
    const today = new Date(); today.setHours(0,0,0,0)
    const monday = new Date(today); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    for (let wi = 11; wi >= 0; wi--) {
      const weekStart = new Date(monday); weekStart.setDate(weekStart.getDate() - wi * 7)
      const days = []
      for (let di = 0; di < 7; di++) {
        const d = new Date(weekStart); d.setDate(d.getDate() + di)
        const future = d > today
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        days.push({ trained: !future && !!counts[key], sessions: counts[key] || 0, future, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) })
      }
      weeks.push(days)
    }
    return weeks
  }, [myWorkouts])

  // deterministic per-muscle value so the label and bar always agree (no re-roll flicker)
  const stablePct = (str) => 40 + (str.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % 61)


  const filtered = WORKOUTS.filter(w => {
    const matchCat  = activeCategory   === 'All' || w.category  === activeCategory
    const matchDiff = activeDifficulty === 'All' || w.difficulty === activeDifficulty
    const matchEq   = activeEquipment  === 'All' || w.equipment  === activeEquipment
    const matchSrch = w.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchDiff && matchEq && matchSrch
  })

  const startWorkout = (w) => {
    setActiveWorkout(w)
    setCompletedExercises([])
    setTimer(0)
    setTimerRunning(true)
    setCurrentIdx(0)
    setSelected(null)
  }

  const doneExercise = (idx, rest) => {
    setCompletedExercises(p => [...p, idx])
    setRestTimer(rest)
    if (idx < activeWorkout.exercises.length-1) setCurrentIdx(idx+1)
  }

  const progress = activeWorkout
    ? Math.round((completedExercises.length / activeWorkout.exercises.length)*100)
    : 0

  const totalVolume = activeWorkout
    ? activeWorkout.exercises
        .filter((_,i) => completedExercises.includes(i))
        .reduce((a,e) => a + e.calories, 0)
    : 0

  // ─── Finish workout: log it, detect PRs from working-set inputs, persist session ───
  const finishWorkout = async () => {
    if (!activeWorkout) return
    if (completedExercises.length === 0 && !window.confirm('Finish without completing any exercises?')) return
    if (completedExercises.length > 0 && !window.confirm(`Finish workout? ${completedExercises.length} exercise${completedExercises.length === 1 ? '' : 's'} completed.`)) return

    // PR detection: best Epley 1RM per completed exercise from the user's working-set inputs
    const newPRs = []
    const prs = loadPRs()
    const sessionExercises = []
    for (const idx of completedExercises) {
      const ex = activeWorkout.exercises[idx]
      const input = exInputs[idx] || {}
      const weight = Number(input.weight)
      const reps = Number(input.reps) || parseReps(ex.reps)
      sessionExercises.push({ name: ex.name, weight: Number.isFinite(weight) ? weight : null, reps })
      const oneRM = epley1RM(weight, reps)
      if (oneRM == null) continue
      const prev = prs[ex.name]
      if (!prev || oneRM > prev.oneRM) {
        savePR(ex.name, weight, reps, oneRM)
        newPRs.push({ name: ex.name, oneRM, prev: prev ? prev.oneRM : null, weight, reps })
      }
    }
    if (newPRs.length > 0) {
      setPrCelebration(newPRs)
      setRealPRs(loadPRs())
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.25 }, colors: ['#9DCE2C', '#FF6B5E', '#FFB020', '#7B61FF'] })
      setTimeout(() => confetti({ particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.4 }, colors: ['#9DCE2C', '#FFB020'] }), 250)
      setTimeout(() => confetti({ particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.4 }, colors: ['#9DCE2C', '#FFB020'] }), 400)
    }
    // Persist session for the recap page (volume, top exercises)
    appendSessionLog({
      date: new Date().toISOString(),
      name: activeWorkout.name,
      category: activeWorkout.category,
      durationMin: Math.max(1, Math.round(timer / 60)),
      calories: totalVolume,
      exercises: sessionExercises,
    })

    try {
      await workoutsApi.log({
        name: activeWorkout.name || 'Workout',
        duration: Math.max(1, Math.round(timer / 60)),
        calories: totalVolume,
        category: activeWorkout.category || 'Strength',
        difficulty: activeWorkout.difficulty || 'Intermediate'
      })
      loadMyWorkouts()
    } catch (e) { console.error('Failed to log workout:', e.message) }
    setTimerRunning(false); setActiveWorkout(null); setExInputs({})
  }

  const card = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(26px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(26px) saturate(1.6)',
    border: '1px solid var(--glass-border)',
    borderRadius: '26px',
    boxShadow: 'var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)',
    overflow:'hidden',
  }

  return (
      <div style={{ width:'100%', position:'relative', zIndex:1 }}>
      <ScenicBackdrop />

        {/* AMBIENT BACKGROUND */}
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          background:`
            radial-gradient(600px circle at 15% 40%, rgba(157, 206, 44,0.04) 0%, transparent 60%),
            radial-gradient(400px circle at 85% 60%, rgba(123,97,255,0.04) 0%, transparent 60%),
            radial-gradient(300px circle at 50% 80%, rgba(122,168,30,0.03) 0%, transparent 60%)
          `
        }}/>

        <div style={{ position:'relative', zIndex:1 }}>

          {/* ═══ ACTIVE WORKOUT BANNER ═══ */}
          <AnimatePresence>
            {activeWorkout && (
              <motion.div
                initial={{ opacity:0, y:-30 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-30 }}
                style={{
                  ...card, marginBottom:'24px',
                  background:`linear-gradient(135deg, rgba(12,12,20,0.98), ${activeWorkout.color}10)`,
                  border:`1px solid ${activeWorkout.color}40`,
                  boxShadow:`0 0 80px ${activeWorkout.glow}, 0 8px 40px var(--shadow-color)`,
                  overflow:'visible'
                }}
              >
                <div style={{ height:'4px', background:`linear-gradient(90deg,${activeWorkout.color},${activeWorkout.color}60,transparent)` }}/>
                <div style={{ padding:'28px' }}>

                  {/* Top bar */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                      <motion.div
                        animate={{ scale:[1,1.15,1], boxShadow:[`0 0 20px ${activeWorkout.glow}`,`0 0 40px ${activeWorkout.glow}`,`0 0 20px ${activeWorkout.glow}`] }}
                        transition={{ duration:1.5, repeat:Infinity }}
                        style={{
                          width:'52px', height:'52px', borderRadius:'50%',
                          background:`${activeWorkout.color}20`,
                          border:`2px solid ${activeWorkout.color}`,
                          display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:'1.5rem'
                        }}
                      >🏋️</motion.div>
                      <div>
                        <div style={{ color:'var(--text-muted)', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                          ● LIVE WORKOUT
                        </div>
                        <div style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.3rem', fontWeight:700 }}>
                          {activeWorkout.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      {/* Stats */}
                      {[
                        { label:'TIME',     val:fmt(timer),        color:activeWorkout.color },
                        { label:'CALORIES', val:`${totalVolume} kcal`, color:'#FF6B5E' },
                        { label:'DONE',     val:`${completedExercises.length}/${activeWorkout.exercises.length}`, color:'#B5E04A' },
                      ].map(s => (
                        <div key={s.label} style={{
                          background:'var(--shadow-color)',
                          border:`1px solid ${s.color}30`,
                          borderRadius:'12px', padding:'10px 16px',
                          textAlign:'center', minWidth:'80px'
                        }}>
                          <div style={{
                            fontFamily:"'Clash Display',sans-serif",
                            fontSize:'1.3rem', fontWeight:800,
                            color:s.color, fontVariantNumeric:'tabular-nums'
                          }}>{s.val}</div>
                          <div style={{ color:'#4B5563', fontSize:'0.65rem', letterSpacing:'0.05em' }}>{s.label}</div>
                        </div>
                      ))}

                      <button onClick={() => setTimerRunning(p=>!p)} style={{
                        background: timerRunning ? 'rgba(122,168,30,0.15)' : 'rgba(157, 206, 44,0.15)',
                        border:`1px solid ${timerRunning ? 'rgba(122,168,30,0.4)' : 'rgba(157, 206, 44,0.4)'}`,
                        borderRadius:'12px', padding:'10px 18px',
                        color: timerRunning ? '#7AA81E' : '#9DCE2C',
                        cursor:'pointer', fontSize:'0.85rem', fontWeight:600
                      }}>{timerRunning ? '⏸ Pause' : '▶ Resume'}</button>

                      <button onClick={finishWorkout} style={{
                        background:'rgba(255,59,48,0.1)',
                        border:'1px solid rgba(255,59,48,0.3)',
                        borderRadius:'12px', padding:'10px 18px',
                        color:'#FF3B30', cursor:'pointer',
                        fontSize:'0.85rem', fontWeight:600
                      }}>✓ Finish</button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                      <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>Workout Progress</span>
                      <span style={{ color:activeWorkout.color, fontSize:'0.8rem', fontWeight:700 }}>{progress}% complete</span>
                    </div>
                    <div style={{ height:'10px', background:'var(--border)', borderRadius:'99px', overflow:'hidden' }}>
                      <motion.div
                        animate={{ width:`${progress}%` }}
                        transition={{ duration:0.5, type:'spring' }}
                        style={{
                          height:'100%',
                          background:`linear-gradient(90deg,${activeWorkout.color},${activeWorkout.color}80)`,
                          borderRadius:'99px',
                          boxShadow:`0 0 12px ${activeWorkout.glow}` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Rest timer */}
                  <AnimatePresence>
                    {restTimer > 0 && (
                      <motion.div
                        initial={{ opacity:0, scale:0.9 }}
                        animate={{ opacity:1, scale:1 }}
                        exit={{ opacity:0, scale:0.9 }}
                        style={{
                          background:'rgba(181, 224, 74,0.08)',
                          border:'1px solid rgba(181, 224, 74,0.25)',
                          borderRadius:'16px', padding:'14px 20px',
                          marginBottom:'16px',
                          display:'flex', alignItems:'center',
                          justifyContent:'space-between', flexWrap:'wrap', gap:'12px'
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <motion.span
                            animate={{ scale:[1,1.2,1] }}
                            transition={{ duration:1, repeat:Infinity }}
                            style={{ fontSize:'1.6rem' }}
                          >😮‍💨</motion.span>
                          <div>
                            <div style={{ color:'#B5E04A', fontWeight:700, fontSize:'0.9rem' }}>Rest Time</div>
                            <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>
                              Next: {activeWorkout.exercises[currentIdx]?.name}
                            </div>
                          </div>
                        </div>
                        <motion.div
                          key={restTimer}
                          initial={{ scale:1.3, color:'#7AA81E' }}
                          animate={{ scale:1, color:'#B5E04A' }}
                          style={{
                            fontFamily:"'Clash Display',sans-serif",
                            fontSize:'2.5rem', fontWeight:900,
                          }}
                        >{restTimer}s</motion.div>
                        <button onClick={() => setRestTimer(0)} style={{
                          background:'rgba(181, 224, 74,0.15)',
                          border:'1px solid rgba(181, 224, 74,0.3)',
                          borderRadius:'10px', padding:'8px 16px',
                          color:'#B5E04A', cursor:'pointer',
                          fontSize:'0.82rem', fontWeight:700
                        }}>Skip Rest →</button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Exercise grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                    {activeWorkout.exercises.map((ex, idx) => {
                      const done    = completedExercises.includes(idx)
                      const current = idx === currentIdx && !done
                      return (
                        <motion.div
                          key={ex.name}
                          initial={{ opacity:0, x:-10 }}
                          animate={{ opacity:1, x:0 }}
                          transition={{ delay:idx*0.04 }}
                          style={{
                            padding:'14px 16px', borderRadius:'14px',
                            background: done    ? 'rgba(157, 206, 44,0.08)'
                              : current ? `${activeWorkout.color}12` 
                              : 'var(--border)',
                            border: done    ? '1px solid rgba(157, 206, 44,0.25)'
                              : current ? `2px solid ${activeWorkout.color}50` 
                              : '1px solid var(--border)',
                            display:'flex', alignItems:'center',
                            justifyContent:'space-between', gap:'10px',
                            cursor:'pointer'
                          }}
                          onClick={() => setExpandedExercise(expandedExercise===idx ? null : idx)}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                            <motion.span
                              animate={current ? { scale:[1,1.2,1] } : {}}
                              transition={{ duration:1, repeat:Infinity }}
                              style={{ fontSize:'1.3rem' }}
                            >{done ? '✅' : ex.emoji}</motion.span>
                            <div style={{ flex:1 }}>
                              <div style={{
                                color: done ? '#9DCE2C' : current ? activeWorkout.color : 'var(--text-faint)',
                                fontSize:'0.83rem', fontWeight: current ? 700 : 500
                              }}>{ex.name}</div>
                              <div style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>
                                {ex.sets}×{ex.reps} · {ex.rest}s rest · {ex.calories} kcal
                              </div>
                              {/* Working-set input → live Epley 1RM (feeds PR detection on finish) */}
                              {!done && (() => {
                                const inp = exInputs[idx] || {}
                                const oneRM = epley1RM(inp.weight, inp.reps || parseReps(ex.reps))
                                const prevPR = realPRs[ex.name]
                                const setInp = (k, v) => setExInputs(p => ({ ...p, [idx]: { ...(p[idx] || {}), [k]: v } }))
                                const mini = {
                                  width:'64px', background:'var(--shadow-color)',
                                  border:'1px solid var(--border)', borderRadius:'8px',
                                  padding:'4px 8px', color:'var(--text-primary)',
                                  fontSize:'0.75rem', outline:'none',
                                  fontVariantNumeric:'tabular-nums'
                                }
                                return (
                                  <div
                                    style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'8px', flexWrap:'wrap' }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <input type="number" min="0" step="0.5" placeholder="kg" aria-label={`${ex.name} weight in kg`}
                                      value={inp.weight || ''} onChange={e => setInp('weight', e.target.value)} style={mini} />
                                    <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>×</span>
                                    <input type="number" min="0" step="1" placeholder={String(parseReps(ex.reps) || 'reps')} aria-label={`${ex.name} reps`}
                                      value={inp.reps || ''} onChange={e => setInp('reps', e.target.value)} style={mini} />
                                    {oneRM != null && (
                                      <span style={{
                                        background:'rgba(122,168,30,0.12)', border:'1px solid rgba(122,168,30,0.35)',
                                        borderRadius:'99px', padding:'3px 10px',
                                        color:'#7AA81E', fontSize:'0.7rem', fontWeight:700,
                                        fontVariantNumeric:'tabular-nums'
                                      }}>1RM ≈ {oneRM} kg</span>
                                    )}
                                    {prevPR && (
                                      <span style={{ color:'var(--text-muted)', fontSize:'0.68rem' }} title={`Set ${new Date(prevPR.date).toLocaleDateString('en-GB')}`}>
                                        🏆 PR {prevPR.oneRM} kg
                                      </span>
                                    )}
                                  </div>
                                )
                              })()}
                              <AnimatePresence>
                                {expandedExercise===idx && (
                                  <motion.div
                                    initial={{ height:0, opacity:0 }}
                                    animate={{ height:'auto', opacity:1 }}
                                    exit={{ height:0, opacity:0 }}
                                    style={{ overflow:'hidden' }}
                                  >
                                    <div style={{
                                      marginTop:'6px', padding:'6px 8px',
                                      background:'var(--border)',
                                      borderRadius:'8px',
                                      color:'var(--text-muted)', fontSize:'0.72rem',
                                      fontStyle:'italic'
                                    }}>💡 {ex.tip}</div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          {!done && (
                            <button
                              onClick={(e) => { e.stopPropagation(); doneExercise(idx, ex.rest) }}
                              style={{
                                background: current
                                  ? `linear-gradient(135deg,${activeWorkout.color},${activeWorkout.color}80)` 
                                  : 'var(--border)',
                                border:'none', borderRadius:'8px',
                                padding:'6px 12px',
                                color: current ? '#000' : 'var(--text-muted)',
                                cursor:'pointer', fontSize:'0.75rem',
                                fontWeight:700, flexShrink:0
                              }}>✓ Done</button>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ HEADER ═══ */}
          <motion.div
            initial={{ opacity:0, y:-20 }}
            animate={{ opacity:1, y:0 }}
            style={{ marginBottom:'28px' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px', marginBottom:'20px' }}>
              <div>
                <h1 style={{
                  fontFamily:"'Clash Display',sans-serif",
                  fontSize:'2.4rem', fontWeight:800,
                  margin:0, marginBottom:'6px',
                  background:'linear-gradient(135deg,var(--text-primary) 0%,#7B61FF 60%,#9DCE2C 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                }}>Workout Intelligence 💪</h1>
                <p style={{ color:'var(--text-muted)', margin:0, fontSize:'0.9rem' }}>
                  {WORKOUTS.length} premium workouts · {WORKOUTS.reduce((a,w) => a+w.exercises.length,0)} total exercises
                </p>
              </div>

              {/* Stats row */}
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                {[
                  { icon:'🔥', label:'Streak',    val:`${workoutStats.streak} day${workoutStats.streak === 1 ? '' : 's'}`, color:'#7AA81E' },
                  { icon:'💪', label:'This Week',  val:`${workoutStats.weekSessions} session${workoutStats.weekSessions === 1 ? '' : 's'}`, color:'#7B61FF' },
                  { icon:'⚡', label:'Burned',     val:`${workoutStats.totalKcal.toLocaleString()} kcal`, color:'#FF6B5E' },
                  { icon:'🏆', label:'Logged',     val:`${workoutStats.total} workout${workoutStats.total === 1 ? '' : 's'}`, color:'#FFD700' },
                ].map(s => (
                  <div key={s.label} style={{
                    background:'var(--bg-card)',
                    backdropFilter:'blur(20px)',
                    border:'1px solid var(--border)',
                    borderRadius:'14px', padding:'12px 16px',
                    textAlign:'center', minWidth:'90px'
                  }}>
                    <div style={{ fontSize:'1.3rem', marginBottom:'4px' }}>{s.icon}</div>
                    <div style={{ color:s.color, fontWeight:700, fontSize:'0.85rem' }}>{s.val}</div>
                    <div style={{ color:'#4B5563', fontSize:'0.7rem', marginTop:'2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* TABS */}
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {[
                { id:'workouts',  label:'🏋️ Workouts',    count:WORKOUTS.length },
                { id:'weekly',    label:'📅 Weekly Plan',  count:7 },
                { id:'muscles',   label:'💪 Muscle Map',   count:6 },
                { id:'prs',       label:'🏆 Personal Records', count:PRS.length },
                { id:'progress',  label:'📈 Progress',     count:null },
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale:1.03 }}
                  whileTap={{ scale:0.97 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding:'9px 20px', borderRadius:'12px',
                    border: activeTab===tab.id ? 'none' : '1px solid var(--border)',
                    background: activeTab===tab.id
                      ? 'linear-gradient(135deg,#7B61FF,#9DCE2C)'
                      : 'var(--bg-card)',
                    color: activeTab===tab.id ? 'white' : 'var(--text-muted)',
                    fontWeight: activeTab===tab.id ? 700 : 400,
                    cursor:'pointer', fontSize:'0.85rem',
                    fontFamily:"'Satoshi',sans-serif",
                    display:'flex', alignItems:'center', gap:'6px'
                  }}
                >
                  {tab.label}
                  {tab.count && (
                    <span style={{
                      background: activeTab===tab.id ? 'var(--track)' : 'var(--border)',
                      borderRadius:'99px', padding:'1px 8px',
                      fontSize:'0.72rem'
                    }}>{tab.count}</span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Utility buttons */}
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'10px' }}>
              <motion.button
                whileHover={{ scale:1.03 }}
                whileTap={{ scale:0.97 }}
                onClick={() => setShowPlateCalc(true)}
                style={{
                  padding:'9px 20px', borderRadius:'12px',
                  border:'1px solid rgba(122,168,30,0.4)',
                  background:'rgba(122,168,30,0.1)',
                  color:'#7AA81E', fontWeight:700, cursor:'pointer',
                  fontSize:'0.85rem', fontFamily:"'Satoshi',sans-serif"
                }}
              >🏋️ Plate Calc</motion.button>
              <motion.button
                whileHover={{ scale:1.03 }}
                whileTap={{ scale:0.97 }}
                onClick={() => { window.location.href = '/recap' }}
                style={{
                  padding:'9px 20px', borderRadius:'12px',
                  border:'1px solid var(--border)',
                  background:'var(--bg-card)',
                  color:'var(--text-muted)', fontWeight:600, cursor:'pointer',
                  fontSize:'0.85rem', fontFamily:"'Satoshi',sans-serif"
                }}
              >📊 My Recap</motion.button>
            </div>
          </motion.div>

          {/* ═══ WORKOUTS TAB ═══ */}
          <AnimatePresence mode="wait">
            {activeTab === 'workouts' && (
              <motion.div
                key="workouts"
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-20 }}
              >
                {/* Search */}
                <div style={{ position:'relative', marginBottom:'16px' }}>
                  <span style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', fontSize:'1rem' }}>🔍</span>
                  <input
                    placeholder={`Search ${WORKOUTS.length} workouts...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width:'100%', boxSizing:'border-box',
                      background:'var(--bg-card)',
                      backdropFilter:'blur(20px)',
                      border:'1px solid var(--border)',
                      borderRadius:'14px', padding:'13px 16px 13px 44px',
                      color:'var(--text-primary)', fontSize:'0.95rem', outline:'none',
                      fontFamily:"'Satoshi',sans-serif"
                    }}
                    onFocus={e => e.target.style.borderColor='rgba(123,97,255,0.5)'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}
                  />
                </div>

                {/* Filters */}
                <div style={{ marginBottom:'24px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  {/* Category */}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ color:'#4B5563', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', minWidth:'70px' }}>Category</span>
                    {CATEGORIES.map(c => (
                      <motion.button
                        key={c}
                        whileHover={{ scale:1.05 }}
                        whileTap={{ scale:0.95 }}
                        onClick={() => setActiveCategory(c)}
                        style={{
                          padding:'5px 14px', borderRadius:'99px',
                          border: activeCategory===c ? 'none' : '1px solid var(--border)',
                          background: activeCategory===c ? 'linear-gradient(135deg,#7B61FF,#9DCE2C)' : 'var(--bg-card)',
                          color: activeCategory===c ? 'white' : 'var(--text-muted)',
                          fontWeight: activeCategory===c ? 700 : 400,
                          cursor:'pointer', fontSize:'0.78rem',
                          fontFamily:"'Satoshi',sans-serif"
                        }}>{c}</motion.button>
                    ))}
                  </div>

                  {/* Difficulty */}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ color:'#4B5563', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', minWidth:'70px' }}>Level</span>
                    {DIFFICULTIES.map(d => {
                      const dc = d==='Beginner' ? '#9DCE2C' : d==='Intermediate' ? '#FFD700' : d==='Advanced' ? '#7AA81E' : 'var(--text-muted)'
                      const active = activeDifficulty===d
                      return (
                        <motion.button
                          key={d}
                          whileHover={{ scale:1.05 }}
                          whileTap={{ scale:0.95 }}
                          onClick={() => setActiveDifficulty(d)}
                          style={{
                            padding:'5px 14px', borderRadius:'99px',
                            border: active ? `1px solid ${dc}50` : '1px solid var(--border)',
                            background: active ? `${dc}15` : 'var(--bg-card)',
                            color: active ? dc : 'var(--text-muted)',
                            fontWeight: active ? 700 : 400,
                            cursor:'pointer', fontSize:'0.78rem'
                          }}>{d}</motion.button>
                      )
                    })}
                  </div>

                  {/* Equipment */}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ color:'#4B5563', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', minWidth:'70px' }}>Equipment</span>
                    {EQUIPMENT.map(eq => (
                      <motion.button
                        key={eq}
                        whileHover={{ scale:1.05 }}
                        whileTap={{ scale:0.95 }}
                        onClick={() => setActiveEquipment(eq)}
                        style={{
                          padding:'5px 14px', borderRadius:'99px',
                          border: activeEquipment===eq ? '1px solid rgba(181, 224, 74,0.4)' : '1px solid var(--border)',
                          background: activeEquipment===eq ? 'rgba(181, 224, 74,0.12)' : 'var(--bg-card)',
                          color: activeEquipment===eq ? '#B5E04A' : 'var(--text-muted)',
                          fontWeight: activeEquipment===eq ? 700 : 400,
                          cursor:'pointer', fontSize:'0.78rem'
                        }}>{eq}</motion.button>
                    ))}
                  </div>
                </div>

                {/* Results count */}
                <div style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:'16px' }}>
                  Showing <span style={{ color:'#9DCE2C', fontWeight:700 }}>{filtered.length}</span> of {WORKOUTS.length} workouts
                </div>

                {/* Grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'20px' }}>
                  {filtered.map((w, i) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity:0, y:30, scale:0.95 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={{ delay:i*0.06, type:'spring', stiffness:200 }}
                      whileHover={{ y:-10, scale:1.02 }}
                      onHoverStart={() => setHoveredId(w.id)}
                      onHoverEnd={() => setHoveredId(null)}
                      onClick={() => setSelected(w)}
                      style={{
                        ...card, cursor:'pointer',
                        boxShadow: hoveredId===w.id
                          ? `0 24px 80px ${w.glow}, 0 0 0 1px ${w.color}40` 
                          : '0 8px 32px var(--shadow-color)',
                        transition:'box-shadow 0.3s'
                      }}
                    >
                      <div style={{ height:'3px', background:`linear-gradient(90deg,${w.color},${w.color}40,transparent)` }}/>
                      <div style={{ padding:'24px' }}>

                        {/* Top row */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                          <motion.div
                            animate={hoveredId===w.id ? { scale:1.3, rotate:[-8,8,-8,0] } : { scale:1 }}
                            transition={{ duration:0.5 }}
                            style={{
                              fontSize:'3rem',
                              filter: hoveredId===w.id ? `drop-shadow(0 0 16px ${w.color})` : 'none',
                              transition:'filter 0.3s'
                            }}
                          >{w.emoji}</motion.div>
                          <div style={{
                            background: w.difficulty==='Beginner'   ? 'rgba(157, 206, 44,0.12)'
                              : w.difficulty==='Intermediate' ? 'rgba(255,215,0,0.12)'
                              : 'rgba(122,168,30,0.12)',
                            border:`1px solid ${
                              w.difficulty==='Beginner'   ? 'rgba(157, 206, 44,0.3)'
                              : w.difficulty==='Intermediate' ? 'rgba(255,215,0,0.3)'
                              : 'rgba(122,168,30,0.3)'}`,
                            borderRadius:'99px', padding:'3px 12px',
                            color: w.difficulty==='Beginner'   ? '#9DCE2C'
                              : w.difficulty==='Intermediate' ? '#FFD700'
                              : '#FF6B5E',
                            fontSize:'0.7rem', fontWeight:700
                          }}>{w.difficulty}</div>
                        </div>

                        <h3 style={{
                          fontFamily:"'Clash Display',sans-serif",
                          fontSize:'1rem', color: 'var(--text-primary)',
                          margin:0, marginBottom:'6px', fontWeight:700
                        }}>{w.name}</h3>

                        <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', margin:0, marginBottom:'14px', lineHeight:1.5 }}>
                          {w.description}
                        </p>

                        {/* Equipment badge */}
                        <div style={{ marginBottom:'14px' }}>
                          <span style={{
                            background:'var(--border)',
                            border:'1px solid var(--border)',
                            borderRadius:'6px', padding:'3px 10px',
                            color:'var(--text-muted)', fontSize:'0.72rem'
                          }}>🏃 {w.equipment}</span>
                        </div>

                        {/* Muscle tags */}
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'16px' }}>
                          {w.muscles.map(m => (
                            <span key={m} style={{
                              background:`${w.color}10`,
                              border:`1px solid ${w.color}25`,
                              borderRadius:'6px', padding:'2px 8px',
                              color: w.color, fontSize:'0.68rem', fontWeight:600
                            }}>{m}</span>
                          ))}
                        </div>

                        {/* Stats grid */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:'8px', marginBottom:'16px' }}>
                          {[
                            { label:'Duration', val:`${w.duration}m`, color:'#B5E04A' },
                            { label:'Calories',  val:w.calories,       color:'#FF6B5E' },
                            { label:'Exercises', val:w.exercises.length,color:w.color },
                          ].map(s => (
                            <div key={s.label} style={{
                              background:'var(--border)',
                              borderRadius:'10px', padding:'8px 4px',
                              textAlign:'center',
                              border:'1px solid var(--border)'
                            }}>
                              <div style={{ color:s.color, fontWeight:700, fontSize:'0.85rem' }}>{s.val}</div>
                              <div style={{ color:'#374151', fontSize:'0.65rem', marginTop:'1px' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Hover CTA */}
                        <motion.div
                          animate={hoveredId===w.id ? { opacity:1, y:0 } : { opacity:0, y:8 }}
                          style={{
                            display:'flex', alignItems:'center',
                            justifyContent:'center', gap:'6px',
                            color:w.color, fontSize:'0.82rem', fontWeight:700
                          }}
                        >View Details ↗</motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ WEEKLY PLAN TAB ═══ */}
            {activeTab === 'weekly' && (
              <motion.div
                key="weekly"
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'12px', marginBottom:'24px' }}>
                  {WEEKLY_PLAN.map((day, i) => {
                    const statusColor = day.status==='done' ? '#9DCE2C'
                      : day.status==='active' ? '#7B61FF'
                      : day.status==='rest' ? '#4B5563'
                      : 'var(--text-muted)'
                    const statusBg = day.status==='done' ? 'rgba(157, 206, 44,0.08)'
                      : day.status==='active' ? 'rgba(123,97,255,0.15)'
                      : day.status==='rest' ? 'var(--border)'
                      : 'var(--border)'
                    return (
                      <motion.div
                        key={day.day}
                        initial={{ opacity:0, y:20 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.07 }}
                        whileHover={{ y:-6, scale:1.03 }}
                        style={{
                          ...card, overflow:'hidden',
                          background: statusBg,
                          border:`1px solid ${statusColor}25`,
                          boxShadow: day.status==='active' ? `0 0 30px rgba(123,97,255,0.25)` : 'none',
                          cursor:'pointer'
                        }}
                      >
                        <div style={{ height:'3px', background: day.status==='rest' ? 'var(--border)' : `linear-gradient(90deg,${statusColor},transparent)` }}/>
                        <div style={{ padding:'16px', textAlign:'center' }}>
                          <div style={{ color: statusColor, fontFamily:"'Clash Display',sans-serif", fontSize:'1.1rem', fontWeight:800, marginBottom:'8px' }}>
                            {day.day}
                          </div>
                          <div style={{ fontSize:'1.6rem', marginBottom:'8px' }}>
                            {day.status==='done'     ? '✅'
                            : day.status==='active'  ? '🔥'
                            : day.status==='rest'    ? '😴'
                            : '⏳'}
                          </div>
                          <div style={{ color:'var(--text-faint)', fontSize:'0.72rem', fontWeight:600, marginBottom:'6px', lineHeight:1.3 }}>
                            {day.workout}
                          </div>
                          {day.calories > 0 && (
                            <div style={{ color: statusColor, fontSize:'0.7rem', fontWeight:700 }}>
                              {day.calories} kcal
                            </div>
                          )}
                          <div style={{
                            marginTop:'10px',
                            background: `${statusColor}15`,
                            border:`1px solid ${statusColor}30`,
                            borderRadius:'99px', padding:'3px 8px',
                            color: statusColor, fontSize:'0.65rem', fontWeight:700,
                            textTransform:'uppercase', letterSpacing:'0.05em'
                          }}>{day.status}</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Weekly summary */}
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'16px' }}>
                  {[
                    { label:'Sessions Completed', val:'3/5',       icon:'✅', color:'#9DCE2C', desc:'On track!' },
                    { label:'Total Calories',      val:'1,220',     icon:'🔥', color:'#FF6B5E', desc:'kcal burned' },
                    { label:'Total Duration',      val:'2h 30m',    icon:'⏱', color:'#B5E04A', desc:'active time' },
                    { label:'Weekly Volume',       val:'18,500kg',  icon:'💪', color:'#7B61FF', desc:'total lifted' },
                  ].map(s => (
                    <motion.div
                      key={s.label}
                      whileHover={{ y:-4 }}
                      style={{
                        ...card, padding:'24px',
                        background:`${s.color}08`,
                        border:`1px solid ${s.color}20` 
                      }}
                    >
                      <div style={{ fontSize:'2rem', marginBottom:'8px' }}>{s.icon}</div>
                      <div style={{
                        fontFamily:"'Clash Display',sans-serif",
                        fontSize:'1.8rem', color: s.color, fontWeight:800
                      }}>{s.val}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize:'0.85rem', fontWeight:600, marginTop:'4px' }}>{s.label}</div>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginTop:'2px' }}>{s.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ MUSCLE EXPLORER TAB ═══ */}
            {activeTab === 'muscles' && (
              <motion.div
                key="muscles"
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-20 }}
              >
                <EditorialMuscleExplorer onStartWorkout={startWorkout} />
              </motion.div>
            )}

            {/* ═══ PERSONAL RECORDS TAB ═══ */}
            {activeTab === 'prs' && (
              <motion.div
                key="prs"
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-20 }}
              >
                {/* Real PRs logged from finished workouts */}
                {Object.keys(realPRs).length > 0 && (
                  <div style={{ marginBottom:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'var(--text-primary)', fontSize:'1.1rem', marginBottom:'16px', fontWeight:700 }}>
                      🏆 Your Logged PRs <span style={{ color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:400 }}>(est. 1RM from finished workouts)</span>
                    </h3>
                    <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'16px' }}>
                      {Object.entries(realPRs).map(([name, pr], i) => (
                        <motion.div
                          key={name}
                          initial={{ opacity:0, scale:0.85 }}
                          animate={{ opacity:1, scale:1 }}
                          transition={{ delay:i*0.06, type:'spring', stiffness:200 }}
                          style={{
                            ...card, padding:'22px', textAlign:'center',
                            background:'rgba(122,168,30,0.06)',
                            border:'1px solid rgba(122,168,30,0.3)',
                            boxShadow:'0 0 32px rgba(122,168,30,0.12)'
                          }}
                        >
                          <div style={{ fontSize:'2rem', marginBottom:'8px' }}>🏆</div>
                          <div style={{
                            fontFamily:"'Clash Display',sans-serif", fontSize:'1.9rem', fontWeight:900,
                            color:'#7AA81E', fontVariantNumeric:'tabular-nums',
                            textShadow:'0 0 20px rgba(122,168,30,0.5)'
                          }}>{pr.oneRM}<span style={{ fontSize:'0.85rem', fontWeight:400 }}> kg</span></div>
                          <div style={{ color:'var(--text-primary)', fontSize:'0.85rem', fontWeight:600, margin:'4px 0' }}>{name}</div>
                          <div style={{ color:'var(--text-muted)', fontSize:'0.7rem' }}>
                            {pr.weight} kg × {pr.reps} · {new Date(pr.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'20px', marginBottom:'24px' }}>
                  {PRS.map((pr, i) => (
                    <motion.div
                      key={pr.lift}
                      initial={{ opacity:0, scale:0.8 }}
                      animate={{ opacity:1, scale:1 }}
                      transition={{ delay:i*0.1, type:'spring', stiffness:200 }}
                      whileHover={{ y:-8, scale:1.05 }}
                      style={{
                        ...card, padding:'28px',
                        background:`${pr.color}08`,
                        border:`1px solid ${pr.color}25`,
                        boxShadow:`0 0 40px ${pr.color}15`,
                        textAlign:'center'
                      }}
                    >
                      <motion.div
                        animate={{ rotate:[0,5,-5,0], scale:[1,1.1,1] }}
                        transition={{ duration:3, repeat:Infinity, delay:i*0.5 }}
                        style={{ fontSize:'3rem', marginBottom:'12px' }}
                      >{pr.emoji}</motion.div>
                      <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'2.2rem', fontWeight:900, color:pr.color, marginBottom:'4px',
                        textShadow:`0 0 20px ${pr.color}60` 
                      }}>{pr.weight}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize:'0.95rem', fontWeight:600, marginBottom:'6px' }}>{pr.lift}</div>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>Set on {pr.date}</div>
                      <div style={{
                        marginTop:'12px', display:'inline-block',
                        background:`${pr.color}15`,
                        border:`1px solid ${pr.color}30`,
                        borderRadius:'99px', padding:'4px 14px',
                        color:pr.color, fontSize:'0.72rem', fontWeight:700
                      }}>🏆 PERSONAL BEST</div>
                    </motion.div>
                  ))}
                </div>

                {/* PR History table */}
                <div style={{ ...card, padding:'28px', overflow:'visible' }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.1rem', marginBottom:'20px', fontWeight:700 }}>
                    📊 Strength Progress History
                  </h3>
                  {['Bench Press','Squat','Deadlift','OHP'].map((lift, li) => {
                    const data = [40,50,55,60,65,70,75,80].map((v,i) => ({ week:`W${i+1}`, val:v+(li*10) }))
                    const max = Math.max(...data.map(d=>d.val))
                    return (
                      <div key={lift} style={{ marginBottom:'24px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                          <span style={{ color:'var(--text-primary)', fontWeight:600, fontSize:'0.9rem' }}>{lift}</span>
                          <span style={{ color:PRS[li]?.color || '#9DCE2C', fontWeight:700, fontSize:'0.9rem' }}>
                            {PRS[li]?.weight || '80kg'} 1RM
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'60px' }}>
                          {data.map((d,di) => (
                            <motion.div
                              key={d.week}
                              initial={{ height:0 }}
                              animate={{ height:`${(d.val/max)*100}%` }}
                              transition={{ delay:li*0.1+di*0.05, duration:0.5 }}
                              style={{
                                flex:1, borderRadius:'4px 4px 0 0',
                                background: di===data.length-1
                                  ? `linear-gradient(180deg,${PRS[li]?.color||'#9DCE2C'},${PRS[li]?.color||'#9DCE2C'}60)` 
                                  : 'var(--border)',
                                position:'relative',
                                cursor:'pointer',
                                boxShadow: di===data.length-1 ? `0 0 12px ${PRS[li]?.color||'#9DCE2C'}40` : 'none'
                              }}
                              title={`${d.week}: ${d.val}kg`}
                            />
                          ))}
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                          {['W1','W4','W8'].map(w => (
                            <span key={w} style={{ color:'#374151', fontSize:'0.65rem' }}>{w}</span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ PROGRESS TAB ═══ */}
            {activeTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-20 }}
              >
                {/* Muscle map */}
                <div style={{ ...card, padding:'28px', marginBottom:'20px' }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.1rem', marginBottom:'6px' }}>
                    🗺️ Muscle Map
                  </h3>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', margin:'0 0 18px' }}>
                    Explore each muscle — its drive axis, movement pattern, best exercises and form cues.
                  </p>
                  <MuscleBodyMap />
                </div>

                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap:'20px', marginBottom:'20px' }}>

                  {/* Volume chart */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.1rem', marginBottom:'20px' }}>
                      📈 Weekly Volume (kg)
                    </h3>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:'12px', height:'120px' }}>
                      {[
                        { week:'W1', vol:12400, cal:1240 },
                        { week:'W2', vol:13800, cal:1380 },
                        { week:'W3', vol:11200, cal:1120 },
                        { week:'W4', vol:15600, cal:1560 },
                        { week:'W5', vol:14200, cal:1420 },
                        { week:'W6', vol:16800, cal:1680 },
                        { week:'W7', vol:18500, cal:1850 },
                        { week:'W8', vol:19200, cal:1920 },
                      ].map((d,i) => {
                        const max = 19200
                        const h = (d.vol/max)*100
                        return (
                          <div key={d.week} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end' }}>
                            <div style={{ color:'var(--text-muted)', fontSize:'0.68rem', marginBottom:'4px' }}>
                              {(d.vol/1000).toFixed(1)}k
                            </div>
                            <motion.div
                              initial={{ height:0 }}
                              animate={{ height:`${h}%` }}
                              transition={{ delay:i*0.08, duration:0.6, type:'spring' }}
                              style={{
                                width:'100%', borderRadius:'6px 6px 0 0',
                                background: i===7
                                  ? 'linear-gradient(180deg,#9DCE2C,#B5E04A)'
                                  : 'rgba(157, 206, 44,0.25)',
                                boxShadow: i===7 ? '0 0 20px rgba(157, 206, 44,0.4)' : 'none'
                              }}
                            />
                            <div style={{ color:'#4B5563', fontSize:'0.65rem', marginTop:'4px' }}>{d.week}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Body stats */}
                  <div style={{ ...card, padding:'24px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1rem', marginBottom:'16px' }}>
                      📊 Body Composition
                    </h3>
                    {[
                      { label:'Body Weight',   val:'72.4 kg',  change:'-1.2kg',   good:true,  color:'#9DCE2C' },
                      { label:'Body Fat',      val:'14.2%',    change:'-0.8%',    good:true,  color:'#B5E04A' },
                      { label:'Muscle Mass',   val:'58.8 kg',  change:'+0.6kg',   good:true,  color:'#7B61FF' },
                      { label:'Visceral Fat',  val:'Level 5',  change:'-1 level', good:true,  color:'#FFD700' },
                      { label:'BMR',           val:'1,842 kcal',change:'+24',     good:true,  color:'#7AA81E' },
                    ].map(s => (
                      <div key={s.label} style={{
                        display:'flex', justifyContent:'space-between',
                        alignItems:'center', padding:'10px 0',
                        borderBottom:'1px solid var(--border)'
                      }}>
                        <div>
                          <div style={{ color:'var(--text-faint)', fontSize:'0.82rem' }}>{s.label}</div>
                          <div style={{ color: s.color, fontWeight:700, fontSize:'0.95rem' }}>{s.val}</div>
                        </div>
                        <div style={{
                          background: s.good ? 'rgba(157, 206, 44,0.1)' : 'rgba(255,59,48,0.1)',
                          border:`1px solid ${s.good ? 'rgba(157, 206, 44,0.2)' : 'rgba(255,59,48,0.2)'}`,
                          borderRadius:'99px', padding:'3px 10px',
                          color: s.good ? '#9DCE2C' : '#FF3B30',
                          fontSize:'0.72rem', fontWeight:700
                        }}>{s.change}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workout frequency heatmap */}
                <div style={{ ...card, padding:'28px' }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.1rem', marginBottom:'20px' }}>
                    📅 Training Frequency — Last 12 Weeks
                  </h3>
                  {myWorkouts.length === 0 && (
                    <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', textAlign:'center', padding:'12px', gridColumn:'1 / -1' }}>
                      No workouts logged yet — finish a workout and it will appear here 💪
                    </div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:'8px' }}>
                    {heatmapGrid.map((week, wi) => (
                      <div key={wi}>
                        <div style={{ color:'#4B5563', fontSize:'0.65rem', marginBottom:'6px', textAlign:'center' }}>W{wi+1}</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                          {week.map((cell, di) => {
                            const intensity = Math.min(1, cell.sessions / 2)
                            return (
                              <motion.div
                                key={di}
                                initial={{ opacity:0, scale:0 }}
                                animate={{ opacity:1, scale:1 }}
                                transition={{ delay:(wi*7+di)*0.005 }}
                                title={cell.future ? cell.label : (cell.trained ? `${cell.label}: ${cell.sessions} workout${cell.sessions === 1 ? '' : 's'}` : `${cell.label}: Rest`)}
                                style={{
                                  width:'100%', aspectRatio:'1',
                                  borderRadius:'4px',
                                  background: cell.future ? 'transparent'
                                    : !cell.trained ? 'var(--border)'
                                    : intensity >= 1 ? 'rgba(157, 206, 44,0.85)'
                                    : intensity > 0.4 ? 'rgba(157, 206, 44,0.5)'
                                    : 'rgba(157, 206, 44,0.22)',
                                  border: cell.future ? '1px dashed var(--border)' : 'none',
                                  cursor:'pointer',
                                  boxShadow: intensity >= 1 ? '0 0 6px rgba(157, 206, 44,0.4)' : 'none'
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'14px' }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>Less</span>
                    {['var(--border)','rgba(157, 206, 44,0.2)','rgba(157, 206, 44,0.45)','rgba(157, 206, 44,0.8)'].map((bg,i) => (
                      <div key={i} style={{ width:'14px', height:'14px', borderRadius:'3px', background:bg }}/>
                    ))}
                    <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>More</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ WORKOUT DETAIL MODAL ═══ */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              style={{
                position:'fixed', inset:0, zIndex:200,
                background:'var(--shadow-color)',
                backdropFilter:'blur(16px)',
                display:'flex', alignItems:'center',
                justifyContent:'center', padding:'20px'
              }}
              onClick={e => e.target===e.currentTarget && setSelected(null)}
            >
              <motion.div
                initial={{ scale:0.8, opacity:0, y:60 }}
                animate={{ scale:1, opacity:1, y:0 }}
                exit={{ scale:0.8, opacity:0, y:60 }}
                transition={{ type:'spring', stiffness:280, damping:24 }}
                style={{
                  width:'100%', maxWidth:'780px',
                  maxHeight:'90vh', overflowY:'auto',
                  background:'rgba(10,10,18,0.99)',
                  backdropFilter:'blur(60px)',
                  border:`1px solid ${selected.color}35`,
                  borderRadius:'32px',
                  boxShadow:`0 60px 120px var(--shadow-color), 0 0 100px ${selected.glow}`,
                }}
              >
                <div style={{ height:'4px', background:`linear-gradient(90deg,${selected.color},${selected.color}60,transparent)`, borderRadius:'32px 32px 0 0' }}/>

                <div style={{ padding:'36px' }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'28px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
                      <motion.div
                        animate={{ rotate:[0,12,-12,0] }}
                        transition={{ duration:3, repeat:Infinity }}
                        style={{ fontSize:'4.5rem', filter:`drop-shadow(0 0 24px ${selected.color})` }}
                      >{selected.emoji}</motion.div>
                      <div>
                        <h2 style={{
                          fontFamily:"'Clash Display',sans-serif",
                          fontSize:'1.8rem', color: 'var(--text-primary)',
                          margin:0, marginBottom:'8px', fontWeight:800
                        }}>{selected.name}</h2>
                        <p style={{ color:'var(--text-muted)', margin:0, fontSize:'0.88rem', maxWidth:'400px' }}>
                          {selected.description}
                        </p>
                        <div style={{ display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>
                          <span style={{
                            background:`${selected.color}15`, border:`1px solid ${selected.color}30`,
                            borderRadius:'99px', padding:'3px 12px',
                            color:selected.color, fontSize:'0.75rem', fontWeight:700
                          }}>{selected.category}</span>
                          <span style={{
                            background:'var(--border)', borderRadius:'99px', padding:'3px 12px',
                            color:'var(--text-muted)', fontSize:'0.75rem'
                          }}>{selected.difficulty}</span>
                          <span style={{
                            background:'var(--border)', borderRadius:'99px', padding:'3px 12px',
                            color:'var(--text-muted)', fontSize:'0.75rem'
                          }}>🏃 {selected.equipment}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      style={{
                        background:'var(--border)',
                        border:'1px solid var(--border)',
                        borderRadius:'50%', width:'40px', height:'40px',
                        color:'var(--text-muted)', cursor:'pointer', fontSize:'1.1rem',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0
                      }}>✕</button>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:'12px', marginBottom:'32px' }}>
                    {[
                      { label:'Duration',  val:selected.duration,         unit:'min',     color:selected.color, icon:'⏱' },
                      { label:'Calories',  val:selected.calories,         unit:'kcal',    color:'#7AA81E',       icon:'🔥' },
                      { label:'Exercises', val:selected.exercises.length, unit:'moves',   color:'#7B61FF',       icon:'💪' },
                      { label:'Sets',      val:selected.exercises.reduce((a,e)=>a+e.sets,0), unit:'total', color:'#B5E04A', icon:'🔄' },
                      { label:'Muscles',   val:selected.muscles.length,   unit:'groups',  color:'#FFD700',       icon:'🎯' },
                    ].map(s => (
                      <div key={s.label} style={{
                        background:`${s.color}08`,
                        border:`1px solid ${s.color}20`,
                        borderRadius:'16px', padding:'16px 12px',
                        textAlign:'center'
                      }}>
                        <div style={{ fontSize:'1.3rem', marginBottom:'6px' }}>{s.icon}</div>
                        <div style={{
                          color:s.color, fontFamily:"'Clash Display',sans-serif",
                          fontSize:'1.4rem', fontWeight:800
                        }}>{s.val}<span style={{ fontSize:'0.7rem', fontWeight:400 }}> {s.unit}</span></div>
                        <div style={{ color:'var(--text-muted)', fontSize:'0.68rem', marginTop:'2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Muscles targeted */}
                  <div style={{ marginBottom:'24px' }}>
                    <div style={{ color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' }}>
                      MUSCLES TARGETED
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                      {selected.muscles.map(m => (
                        <span key={m} style={{
                          background:`${selected.color}12`,
                          border:`1px solid ${selected.color}30`,
                          borderRadius:'99px', padding:'5px 14px',
                          color:selected.color, fontSize:'0.8rem', fontWeight:600
                        }}>{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Exercise plan */}
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color: 'var(--text-primary)', fontSize:'1.1rem', marginBottom:'16px', fontWeight:700 }}>
                    📋 Complete Exercise Plan
                  </h3>
                  {selected.exercises.map((ex, i) => (
                    <motion.div
                      key={ex.name}
                      initial={{ opacity:0, x:-20 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay:i*0.05 }}
                      style={{
                        display:'flex', alignItems:'center',
                        gap:'14px', padding:'14px 18px', marginBottom:'8px',
                        background:'var(--border)',
                        borderRadius:'14px',
                        border:'1px solid var(--border)',
                        cursor:'pointer',
                        transition:'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--border)'}
                      onMouseLeave={e => e.currentTarget.style.background='var(--border)'}
                    >
                      <div style={{
                        width:'32px', height:'32px', borderRadius:'50%',
                        background:`${selected.color}18`,
                        border:`1px solid ${selected.color}35`,
                        display:'flex', alignItems:'center',
                        justifyContent:'center', color:selected.color,
                        fontWeight:800, fontSize:'0.78rem', flexShrink:0
                      }}>{i+1}</div>
                      <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{ex.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'var(--text-primary)', fontSize:'0.9rem', fontWeight:600 }}>{ex.name}</div>
                        <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{ex.muscle} · 💡 {ex.tip}</div>
                        {(() => {
                          const w = detailWeights[i]
                          const reps = parseReps(ex.reps)
                          const oneRM = epley1RM(w, reps)
                          return (
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'6px' }}>
                              <input type="number" min="0" step="0.5" placeholder="Your kg" aria-label={`${ex.name} working weight in kg`}
                                value={w || ''} onChange={e => setDetailWeights(p => ({ ...p, [i]: e.target.value }))}
                                style={{
                                  width:'76px', background:'var(--shadow-color)',
                                  border:'1px solid var(--border)', borderRadius:'8px',
                                  padding:'3px 8px', color:'var(--text-primary)', fontSize:'0.72rem', outline:'none',
                                  fontVariantNumeric:'tabular-nums'
                                }} />
                              {oneRM != null ? (
                                <span style={{ color:'#7AA81E', fontSize:'0.72rem', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
                                  est. 1RM {oneRM} kg{reps ? ` @ ${reps} reps` : ''}
                                </span>
                              ) : (
                                <span style={{ color:'#4B5563', fontSize:'0.68rem' }}>Enter weight for 1RM estimate</span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                      <div style={{ display:'flex', gap:'20px', textAlign:'center', flexShrink:0 }}>
                        {[
                          { label:'Sets', val:ex.sets, color:selected.color },
                          { label:'Reps', val:ex.reps, color: 'var(--text-primary)' },
                          { label:'Rest', val:`${ex.rest}s`, color:'#B5E04A' },
                          { label:'kcal', val:ex.calories, color:'#7AA81E' },
                        ].map(s => (
                          <div key={s.label}>
                            <div style={{ color:s.color, fontWeight:700, fontSize:'0.88rem' }}>{s.val}</div>
                            <div style={{ color:'#4B5563', fontSize:'0.65rem' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  {/* CTAs */}
                  <div style={{ display:'flex', gap:'12px', marginTop:'28px' }}>
                    <motion.button
                      whileHover={{ scale:1.03, boxShadow:`0 12px 40px ${selected.glow}` }}
                      whileTap={{ scale:0.97 }}
                      onClick={() => startWorkout(selected)}
                      style={{
                        flex:1, padding:'16px',
                        background:`linear-gradient(135deg,${selected.color},${selected.color}80)`,
                        border:'none', borderRadius:'16px',
                        color:'#000', fontWeight:900, cursor:'pointer',
                        fontSize:'1rem', fontFamily:"'Clash Display',sans-serif",
                        letterSpacing:'0.02em',
                        boxShadow:`0 4px 24px ${selected.glow}` 
                      }}>🚀 Start Workout</motion.button>

                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ PR CELEBRATION BANNER ═══ */}
        <AnimatePresence>
          {prCelebration.length > 0 && (
            <div style={{
              position:'fixed', top:'20px', left:0, right:0, zIndex:400,
              display:'flex', justifyContent:'center', pointerEvents:'none',
              padding:'0 16px', boxSizing:'border-box'
            }}>
            <motion.div
              initial={{ opacity:0, y:-60, scale:0.9 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-60, scale:0.9 }}
              transition={{ type:'spring', stiffness:260, damping:20 }}
              style={{
                maxWidth:'560px', width:'100%', pointerEvents:'auto',
                background:'linear-gradient(135deg, rgba(20,16,10,0.98), rgba(60,40,8,0.98))',
                border:'1px solid rgba(122,168,30,0.55)',
                borderRadius:'20px', padding:'18px 26px',
                boxShadow:'0 0 60px rgba(122,168,30,0.45), 0 20px 60px var(--shadow-color)',
                textAlign:'center'
              }}
            >
              <div style={{ fontSize:'2rem', marginBottom:'6px' }}>🎉</div>
              <div style={{
                fontFamily:"'Clash Display',sans-serif", color:'#7AA81E',
                fontSize:'1.2rem', fontWeight:800, marginBottom:'8px'
              }}>New PR{prCelebration.length > 1 ? 's' : ''}!</div>
              {prCelebration.map(pr => (
                <div key={pr.name} style={{ color:'var(--text-primary)', fontSize:'0.88rem', marginBottom:'4px' }}>
                  <strong>{pr.name}</strong> — <span style={{ color:'#7AA81E', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
                    {pr.oneRM} kg est. 1RM
                  </span>
                  <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>
                    {' '}({pr.weight} kg × {pr.reps}{pr.prev ? `, prev ${pr.prev} kg` : ', first logged'})
                  </span>
                </div>
              ))}
              <button
                onClick={() => setPrCelebration([])}
                style={{
                  marginTop:'12px', background:'rgba(122,168,30,0.15)',
                  border:'1px solid rgba(122,168,30,0.4)', borderRadius:'99px',
                  padding:'8px 24px', color:'#7AA81E', cursor:'pointer',
                  fontSize:'0.82rem', fontWeight:700
                }}>Keep Going 💪</button>
            </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══ PLATE CALCULATOR MODAL ═══ */}
        <AnimatePresence>
          {showPlateCalc && (() => {
            const target = Number(plateTarget)
            const bar = Number(plateBar)
            const { plates, remainder } = calcPlates(target, bar)
            const valid = Number.isFinite(target) && target > 0 && Number.isFinite(bar) && bar >= 0
            const tooLight = valid && target < bar
            return (
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{ opacity:0 }}
                style={{
                  position:'fixed', inset:0, zIndex:300,
                  background:'var(--shadow-color)',
                  backdropFilter:'blur(16px)',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'
                }}
                onClick={e => e.target === e.currentTarget && setShowPlateCalc(false)}
              >
                <motion.div
                  initial={{ scale:0.85, opacity:0, y:40 }}
                  animate={{ scale:1, opacity:1, y:0 }}
                  exit={{ scale:0.85, opacity:0, y:40 }}
                  transition={{ type:'spring', stiffness:280, damping:24 }}
                  style={{
                    width:'100%', maxWidth:'560px',
                    background:'rgba(10,10,18,0.99)',
                    border:'1px solid rgba(122,168,30,0.3)',
                    borderRadius:'28px', padding:'32px',
                    boxShadow:'0 40px 100px var(--shadow-color), 0 0 60px rgba(122,168,30,0.15)'
                  }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                    <h2 style={{ fontFamily:"'Clash Display',sans-serif", color:'var(--text-primary)', fontSize:'1.4rem', margin:0, fontWeight:800 }}>
                      🏋️ Plate Calculator
                    </h2>
                    <button onClick={() => setShowPlateCalc(false)} style={{
                      background:'var(--border)', border:'1px solid var(--border)',
                      borderRadius:'50%', width:'36px', height:'36px',
                      color:'var(--text-muted)', cursor:'pointer', fontSize:'1rem'
                    }}>✕</button>
                  </div>

                  <div style={{ display:'flex', gap:'12px', marginBottom:'24px', flexWrap:'wrap' }}>
                    {[
                      { label:'Target weight (kg)', val:plateTarget, set:setPlateTarget },
                      { label:'Bar weight (kg)', val:plateBar, set:setPlateBar },
                    ].map(f => (
                      <div key={f.label} style={{ flex:1, minWidth:'140px' }}>
                        <div style={{ color:'var(--text-muted)', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>
                          {f.label}
                        </div>
                        <input type="number" min="0" step="0.5" value={f.val}
                          onChange={e => f.set(e.target.value)}
                          style={{
                            width:'100%', boxSizing:'border-box',
                            background:'var(--shadow-color)', border:'1px solid var(--border)',
                            borderRadius:'12px', padding:'12px 14px',
                            color:'var(--text-primary)', fontSize:'1.05rem', outline:'none',
                            fontFamily:"'Clash Display',sans-serif", fontVariantNumeric:'tabular-nums'
                          }} />
                      </div>
                    ))}
                  </div>

                  {!valid ? (
                    <div style={{ color:'#FF6B6B', fontSize:'0.85rem', textAlign:'center', padding:'20px' }}>
                      Enter a valid target weight.
                    </div>
                  ) : tooLight ? (
                    <div style={{ color:'#FF6B6B', fontSize:'0.85rem', textAlign:'center', padding:'20px' }}>
                      Target is lighter than the bar — use dumbbells or just the bar ({bar} kg).
                    </div>
                  ) : (
                    <>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', textAlign:'center' }}>
                        Load per side · {(target - bar) / 2} kg
                      </div>
                      {/* Bar visualisation */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'3px', marginBottom:'8px', minHeight:'120px' }}>
                        {plates.map((p, i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleY:0 }}
                            animate={{ scaleY:1 }}
                            transition={{ delay:i*0.05, type:'spring', stiffness:300, damping:20 }}
                            title={`${p.kg} kg`}
                            style={{
                              width: p.kg >= 10 ? '26px' : p.kg >= 5 ? '20px' : '14px',
                              height: `${60 + p.kg * 2.4}px`,
                              maxHeight:'120px',
                              background:`linear-gradient(180deg, ${p.color}, ${p.color}88)`,
                              border:'1px solid rgba(255,255,255,0.25)',
                              borderRadius:'6px',
                              display:'flex', alignItems:'flex-start', justifyContent:'center',
                              boxShadow:`0 0 12px ${p.color}44`
                            }}
                          >
                            <span style={{
                              writingMode:'vertical-rl', color: p.kg === 5 ? '#111' : '#fff',
                              fontSize:'0.6rem', fontWeight:800, marginTop:'6px',
                              fontVariantNumeric:'tabular-nums'
                            }}>{p.kg}</span>
                          </motion.div>
                        ))}
                        {/* bar sleeve */}
                        <div style={{
                          width:'70px', height:'14px', borderRadius:'7px',
                          background:'linear-gradient(180deg,#9CA3AF,#4B5563)',
                          marginLeft:'4px'
                        }} />
                      </div>
                      {/* Plate list */}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginTop:'16px' }}>
                        {plates.length === 0 && (
                          <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Just the bar — no plates needed.</span>
                        )}
                        {[...new Set(plates.map(p => p.kg))].map(kg => {
                          const count = plates.filter(p => p.kg === kg).length
                          return (
                            <span key={kg} style={{
                              background:'var(--border)', border:'1px solid var(--border)',
                              borderRadius:'99px', padding:'5px 14px',
                              color:'var(--text-primary)', fontSize:'0.8rem', fontWeight:600,
                              fontVariantNumeric:'tabular-nums'
                            }}>{count} × {kg} kg</span>
                          )
                        })}
                      </div>
                      {remainder > 0.001 && (
                        <div style={{ color:'#FFD700', fontSize:'0.8rem', textAlign:'center', marginTop:'12px' }}>
                          ⚠️ {remainder} kg per side can't be made with standard plates — add fractional plates or adjust target.
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>

  )
}
