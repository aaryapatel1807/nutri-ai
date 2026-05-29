'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MEAL_PLANS = [
  {
    id:1, name:'Muscle Building', emoji:'💪', duration:'8 weeks',
    calories:2800, protein:210, carbs:320, fat:85,
    difficulty:'Intermediate', goal:'Hypertrophy',
    color:'#00FF87', glow:'rgba(0,255,135,0.3)',
    tags:['High Protein','Calorie Surplus','Bulking'],
    description:'Optimized macros for maximum muscle growth with clean calorie surplus',
    meals:{
      Monday:[
        { time:'7:00 AM',  type:'Breakfast', name:'Protein Oatmeal Bowl',      cal:480, p:35, c:58, f:10, emoji:'🥣', ingredients:['1.5 cup oats','2 scoops whey','1 banana','30g almonds','1 tbsp honey'], prep:10 },
        { time:'10:00 AM', type:'Snack',     name:'Greek Yogurt + Berries',    cal:220, p:22, c:28, f:3,  emoji:'🫐', ingredients:['200g greek yogurt','100g mixed berries','10g chia seeds'], prep:2 },
        { time:'1:00 PM',  type:'Lunch',     name:'Chicken Rice Power Bowl',   cal:620, p:52, c:72, f:12, emoji:'🍗', ingredients:['200g chicken breast','1.5 cup brown rice','100g broccoli','1 tbsp olive oil','spices'], prep:25 },
        { time:'4:00 PM',  type:'Pre-Workout',name:'Banana + Peanut Butter',   cal:280, p:8,  c:38, f:12, emoji:'🍌', ingredients:['2 bananas','2 tbsp peanut butter'], prep:2 },
        { time:'7:00 PM',  type:'Dinner',    name:'Salmon + Sweet Potato',     cal:580, p:48, c:52, f:18, emoji:'🐟', ingredients:['200g salmon','200g sweet potato','1 cup spinach','lemon','garlic'], prep:30 },
        { time:'9:00 PM',  type:'Night',     name:'Cottage Cheese + Walnuts',  cal:220, p:26, c:8,  f:11, emoji:'🧀', ingredients:['200g cottage cheese','30g walnuts','cinnamon'], prep:3 },
      ],
      Tuesday:[
        { time:'7:00 AM',  type:'Breakfast', name:'Egg White Omelette',        cal:420, p:38, c:32, f:14, emoji:'🍳', ingredients:['5 egg whites','1 whole egg','50g spinach','50g mushroom','1 toast'], prep:15 },
        { time:'10:00 AM', type:'Snack',     name:'Protein Shake + Apple',     cal:240, p:28, c:30, f:4,  emoji:'🥤', ingredients:['2 scoops protein','250ml milk','1 apple'], prep:3 },
        { time:'1:00 PM',  type:'Lunch',     name:'Tuna Pasta Salad',          cal:580, p:48, c:65, f:10, emoji:'🍝', ingredients:['150g tuna','200g whole wheat pasta','vegetables','olive oil'], prep:20 },
        { time:'4:00 PM',  type:'Pre-Workout',name:'Rice Cakes + Jam',         cal:200, p:4,  c:44, f:1,  emoji:'🍚', ingredients:['4 rice cakes','2 tbsp jam'], prep:2 },
        { time:'7:00 PM',  type:'Dinner',    name:'Beef Stir Fry + Rice',      cal:640, p:50, c:68, f:16, emoji:'🥩', ingredients:['200g lean beef','1.5 cup rice','mixed vegetables','soy sauce'], prep:25 },
        { time:'9:00 PM',  type:'Night',     name:'Casein Protein Pudding',    cal:200, p:30, c:10, f:3,  emoji:'🍮', ingredients:['1 scoop casein','200ml milk','cocoa'], prep:5 },
      ],
      Wednesday:[
        { time:'7:00 AM',  type:'Breakfast', name:'Pancakes + Protein Syrup',  cal:500, p:36, c:62, f:12, emoji:'🥞', ingredients:['protein pancake mix','2 eggs','banana','protein syrup'], prep:15 },
        { time:'10:00 AM', type:'Snack',     name:'Boiled Eggs + Avocado',     cal:260, p:18, c:6,  f:20, emoji:'🥑', ingredients:['3 boiled eggs','half avocado','salt pepper'], prep:10 },
        { time:'1:00 PM',  type:'Lunch',     name:'Paneer Bhurji + Roti',      cal:560, p:36, c:58, f:18, emoji:'🫓', ingredients:['200g paneer','4 rotis','onion tomato','spices'], prep:20 },
        { time:'4:00 PM',  type:'Pre-Workout',name:'Dates + Almonds',          cal:220, p:5,  c:40, f:8,  emoji:'🌴', ingredients:['8 dates','20g almonds'], prep:1 },
        { time:'7:00 PM',  type:'Dinner',    name:'Grilled Chicken + Quinoa',  cal:600, p:54, c:56, f:14, emoji:'🍗', ingredients:['200g chicken','1 cup quinoa','roasted vegetables'], prep:30 },
        { time:'9:00 PM',  type:'Night',     name:'Milk + Peanut Butter',      cal:220, p:14, c:18, f:10, emoji:'🥛', ingredients:['300ml whole milk','1 tbsp peanut butter'], prep:2 },
      ],
    }
  },
  {
    id:2, name:'Fat Loss Shred', emoji:'🔥', duration:'12 weeks',
    calories:1600, protein:180, carbs:140, fat:45,
    difficulty:'Advanced', goal:'Fat Loss',
    color:'#FF6B35', glow:'rgba(255,107,53,0.3)',
    tags:['Calorie Deficit','High Protein','Low Carb'],
    description:'Aggressive fat loss while preserving lean muscle mass',
    meals:{
      Monday:[
        { time:'7:00 AM',  type:'Breakfast', name:'Egg White + Spinach',      cal:220, p:28, c:8,  f:6,  emoji:'🍳', ingredients:['5 egg whites','100g spinach','1 tsp oil'], prep:10 },
        { time:'10:00 AM', type:'Snack',     name:'Protein Shake',             cal:130, p:25, c:5,  f:2,  emoji:'🥤', ingredients:['1 scoop whey','water'], prep:1 },
        { time:'1:00 PM',  type:'Lunch',     name:'Grilled Chicken Salad',     cal:320, p:42, c:18, f:10, emoji:'🥗', ingredients:['200g chicken','mixed greens','cucumber','olive oil dressing'], prep:15 },
        { time:'4:00 PM',  type:'Snack',     name:'Cucumber + Hummus',         cal:120, p:6,  c:14, f:5,  emoji:'🥒', ingredients:['1 cucumber','60g hummus'], prep:3 },
        { time:'7:00 PM',  type:'Dinner',    name:'Baked Cod + Veggies',       cal:380, p:48, c:28, f:10, emoji:'🐟', ingredients:['200g cod','200g mixed veg','spices'], prep:25 },
        { time:'9:00 PM',  type:'Night',     name:'Casein + Berries',          cal:180, p:26, c:14, f:2,  emoji:'🫐', ingredients:['1 scoop casein','100g berries','water'], prep:3 },
      ],
      Tuesday:[
        { time:'7:00 AM',  type:'Breakfast', name:'Greek Yogurt Parfait',      cal:240, p:24, c:22, f:6,  emoji:'🥛', ingredients:['200g 0% greek yogurt','50g granola','berries'], prep:5 },
        { time:'10:00 AM', type:'Snack',     name:'Almonds + Green Tea',       cal:100, p:4,  c:4,  f:8,  emoji:'🍵', ingredients:['20g almonds','green tea'], prep:2 },
        { time:'1:00 PM',  type:'Lunch',     name:'Tuna Lettuce Wraps',        cal:280, p:38, c:12, f:8,  emoji:'🥬', ingredients:['150g tuna','lettuce cups','tomato','mustard'], prep:10 },
        { time:'4:00 PM',  type:'Snack',     name:'Protein Bar',               cal:180, p:20, c:18, f:5,  emoji:'🍫', ingredients:['1 protein bar (low sugar)'], prep:0 },
        { time:'7:00 PM',  type:'Dinner',    name:'Turkey Mince Bowl',         cal:380, p:46, c:22, f:12, emoji:'🍲', ingredients:['200g turkey mince','vegetables','tomato sauce'], prep:20 },
        { time:'9:00 PM',  type:'Night',     name:'Herbal Tea',                cal:5,   p:0,  c:1,  f:0,  emoji:'🍵', ingredients:['herbal tea','hot water'], prep:3 },
      ],
    }
  },
  {
    id:3, name:'Vegetarian Power', emoji:'🥦', duration:'6 weeks',
    calories:2200, protein:140, carbs:280, fat:65,
    difficulty:'Beginner', goal:'Maintenance + Health',
    color:'#4ADE80', glow:'rgba(74,222,128,0.3)',
    tags:['Vegetarian','Plant Based','High Fiber'],
    description:'Complete plant-based nutrition with all essential amino acids',
    meals:{
      Monday:[
        { time:'8:00 AM',  type:'Breakfast', name:'Tofu Scramble + Toast',     cal:380, p:28, c:42, f:12, emoji:'🍳', ingredients:['200g firm tofu','2 slices whole grain toast','spinach','turmeric'], prep:15 },
        { time:'11:00 AM', type:'Snack',     name:'Mixed Nuts + Fruit',        cal:220, p:6,  c:28, f:12, emoji:'🥜', ingredients:['30g mixed nuts','1 apple','1 orange'], prep:2 },
        { time:'2:00 PM',  type:'Lunch',     name:'Lentil Dal + Brown Rice',   cal:520, p:22, c:88, f:8,  emoji:'🍲', ingredients:['200g lentils','1.5 cup brown rice','tomatoes','spices'], prep:30 },
        { time:'5:00 PM',  type:'Snack',     name:'Smoothie Bowl',             cal:280, p:12, c:52, f:6,  emoji:'🫐', ingredients:['banana','berries','plant protein','granola','seeds'], prep:8 },
        { time:'8:00 PM',  type:'Dinner',    name:'Paneer Tikka + Roti',       cal:480, p:32, c:46, f:18, emoji:'🧀', ingredients:['200g paneer','3 rotis','bell peppers','spices'], prep:25 },
        { time:'10:00 PM', type:'Night',     name:'Golden Milk',               cal:160, p:8,  c:18, f:6,  emoji:'🥛', ingredients:['300ml plant milk','turmeric','ginger','honey'], prep:5 },
      ],
    }
  },
  {
    id:4, name:'Keto Performance', emoji:'⚡', duration:'4 weeks',
    calories:2000, protein:160, carbs:40, fat:145,
    difficulty:'Advanced', goal:'Ketosis + Energy',
    color:'#FFD700', glow:'rgba(255,215,0,0.3)',
    tags:['Keto','Zero Carb','Fat Adapted'],
    description:'Ultra-low carb ketogenic diet for metabolic flexibility and mental clarity',
    meals:{
      Monday:[
        { time:'9:00 AM',  type:'Breakfast', name:'Bulletproof Coffee + Eggs', cal:480, p:22, c:2,  f:42, emoji:'☕', ingredients:['2 cups coffee','2 tbsp MCT oil','2 tbsp butter','3 eggs'], prep:10 },
        { time:'1:00 PM',  type:'Lunch',     name:'Bacon Avocado Salad',       cal:520, p:28, c:8,  f:44, emoji:'🥑', ingredients:['100g bacon','1 avocado','mixed greens','olive oil dressing'], prep:15 },
        { time:'4:00 PM',  type:'Snack',     name:'Cheese + Pepperoni',        cal:280, p:18, c:2,  f:22, emoji:'🧀', ingredients:['60g cheddar','60g pepperoni'], prep:2 },
        { time:'7:00 PM',  type:'Dinner',    name:'Ribeye Steak + Butter',     cal:680, p:52, c:0,  f:52, emoji:'🥩', ingredients:['250g ribeye','2 tbsp butter','garlic','rosemary'], prep:20 },
        { time:'9:00 PM',  type:'Night',     name:'Macadamia Nuts',            cal:200, p:2,  c:4,  f:20, emoji:'🥜', ingredients:['40g macadamia nuts'], prep:0 },
      ],
    }
  },
  {
    id:5, name:'Indian Fusion', emoji:'🇮🇳', duration:'4 weeks',
    calories:2100, protein:120, carbs:260, fat:68,
    difficulty:'Beginner', goal:'Balanced Health',
    color:'#F97316', glow:'rgba(249,115,22,0.3)',
    tags:['Indian','Balanced','Cultural'],
    description:'Traditional Indian meals optimized for complete nutrition and fitness',
    meals:{
      Monday:[
        { time:'7:30 AM',  type:'Breakfast', name:'Poha + Sprouts',            cal:340, p:14, c:58, f:8,  emoji:'🌾', ingredients:['1.5 cup poha','50g sprouts','onion','lemon','coriander'], prep:15 },
        { time:'10:30 AM', type:'Snack',     name:'Buttermilk + Dry Fruits',   cal:180, p:8,  c:22, f:6,  emoji:'🥛', ingredients:['300ml buttermilk','20g mixed dry fruits'], prep:3 },
        { time:'1:30 PM',  type:'Lunch',     name:'Rajma + Jeera Rice',        cal:560, p:22, c:94, f:8,  emoji:'🍛', ingredients:['200g rajma','1.5 cup rice','tomato gravy','jeera'], prep:40 },
        { time:'4:30 PM',  type:'Snack',     name:'Chana Chaat',               cal:240, p:12, c:38, f:4,  emoji:'🫘', ingredients:['100g boiled chana','onion','tomato','chaat masala'], prep:8 },
        { time:'7:30 PM',  type:'Dinner',    name:'Dal Tadka + 3 Rotis',       cal:480, p:20, c:72, f:12, emoji:'🍲', ingredients:['200g yellow dal','3 rotis','ghee','cumin','garlic'], prep:30 },
        { time:'9:30 PM',  type:'Night',     name:'Turmeric Doodh',            cal:180, p:8,  c:20, f:6,  emoji:'🥛', ingredients:['300ml milk','turmeric','black pepper','honey'], prep:5 },
      ],
    }
  },
  {
    id:6, name:'Intermittent Fasting 16:8', emoji:'⏰', duration:'8 weeks',
    calories:2000, protein:150, carbs:220, fat:65,
    difficulty:'Intermediate', goal:'Fat Loss + Longevity',
    color:'#A78BFA', glow:'rgba(167,139,250,0.3)',
    tags:['IF','Time Restricted','Autophagy'],
    description:'Eating window 12pm-8pm for metabolic health and sustainable fat loss',
    meals:{
      Monday:[
        { time:'12:00 PM', type:'Break Fast', name:'Massive Protein Smoothie',  cal:480, p:48, c:52, f:12, emoji:'🥤', ingredients:['2 scoops protein','banana','oats','peanut butter','milk'], prep:5 },
        { time:'2:30 PM',  type:'Lunch',     name:'Chicken Burrito Bowl',      cal:620, p:52, c:72, f:15, emoji:'🌯', ingredients:['200g chicken','rice','black beans','guac','salsa'], prep:20 },
        { time:'5:00 PM',  type:'Snack',     name:'Protein Bar + Coffee',      cal:220, p:24, c:20, f:6,  emoji:'☕', ingredients:['protein bar','black coffee'], prep:2 },
        { time:'7:30 PM',  type:'Dinner',    name:'Beef + Vegetables + Potato',cal:580, p:48, c:58, f:18, emoji:'🥩', ingredients:['200g beef','400g mixed veg','200g potato'], prep:35 },
        { time:'7:45 PM',  type:'Dessert',   name:'Dark Chocolate + Berries',  cal:180, p:4,  c:22, f:10, emoji:'🍫', ingredients:['40g 85% dark chocolate','100g berries'], prep:1 },
      ],
    }
  },
]

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const MEAL_TYPES = ['All','Breakfast','Lunch','Dinner','Snack','Pre-Workout','Night']
const GOALS = ['All','Muscle Building','Fat Loss','Maintenance','Ketosis','IF']
const DIFFICULTIES = ['All','Beginner','Intermediate','Advanced']
const DIET_TYPES = ['All','High Protein','Vegetarian','Keto','Indian','Vegan','Balanced']

const WEEKLY_NUTRITION = [
  { day:'Mon', cal:2240, pro:168, carb:252, fat:68 },
  { day:'Tue', cal:2180, pro:162, carb:244, fat:64 },
  { day:'Wed', cal:2320, pro:174, carb:268, fat:72 },
  { day:'Thu', cal:2100, pro:158, carb:238, fat:60 },
  { day:'Fri', cal:2280, pro:170, carb:258, fat:70 },
  { day:'Sat', cal:2800, pro:160, carb:340, fat:90 },
  { day:'Sun', cal:1800, pro:140, carb:210, fat:55 },
]

const GROCERY_LIST = {
  Proteins:  [
    { item:'Chicken Breast', qty:'1.5 kg',  cal:165,  price:'₹320', emoji:'🍗' },
    { item:'Salmon Fillets', qty:'600g',    cal:208,  price:'₹680', emoji:'🐟' },
    { item:'Eggs (dozen)',   qty:'24',      cal:155,  price:'₹120', emoji:'🥚' },
    { item:'Greek Yogurt',   qty:'1 kg',    cal:59,   price:'₹180', emoji:'🥛' },
    { item:'Paneer',         qty:'500g',    cal:265,  price:'₹120', emoji:'🧀' },
    { item:'Whey Protein',   qty:'1 scoop/day', cal:120, price:'₹80', emoji:'🥤' },
  ],
  Carbs:[
    { item:'Brown Rice',     qty:'2 kg',    cal:370,  price:'₹80',  emoji:'🍚' },
    { item:'Oats',           qty:'1 kg',    cal:389,  price:'₹90',  emoji:'🥣' },
    { item:'Sweet Potato',   qty:'1 kg',    cal:86,   price:'₹40',  emoji:'🍠' },
    { item:'Whole Wheat Rotis', qty:'daily',cal:71,   price:'₹60',  emoji:'🫓' },
    { item:'Quinoa',         qty:'500g',    cal:368,  price:'₹220', emoji:'🌾' },
    { item:'Banana',         qty:'12',      cal:89,   price:'₹60',  emoji:'🍌' },
  ],
  Vegetables:[
    { item:'Spinach',        qty:'500g',    cal:23,   price:'₹30',  emoji:'🥬' },
    { item:'Broccoli',       qty:'500g',    cal:34,   price:'₹60',  emoji:'🥦' },
    { item:'Tomatoes',       qty:'1 kg',    cal:18,   price:'₹30',  emoji:'🍅' },
    { item:'Bell Peppers',   qty:'500g',    cal:31,   price:'₹50',  emoji:'🫑' },
    { item:'Cucumber',       qty:'4',       cal:15,   price:'₹20',  emoji:'🥒' },
    { item:'Mushrooms',      qty:'250g',    cal:22,   price:'₹80',  emoji:'🍄' },
  ],
  Fats:[
    { item:'Olive Oil',      qty:'500ml',   cal:884,  price:'₹320', emoji:'🫒' },
    { item:'Almonds',        qty:'250g',    cal:579,  price:'₹180', emoji:'🥜' },
    { item:'Avocado',        qty:'4',       cal:160,  price:'₹80',  emoji:'🥑' },
    { item:'Peanut Butter',  qty:'500g',    cal:588,  price:'₹160', emoji:'🥜' },
    { item:'Ghee',           qty:'200g',    cal:900,  price:'₹120', emoji:'🧈' },
    { item:'Walnuts',        qty:'200g',    cal:654,  price:'₹200', emoji:'🌰' },
  ],
}

const MACRO_TARGETS = {
  'Muscle Building': { cal:2800, p:210, c:320, f:85 },
  'Fat Loss Shred':  { cal:1600, p:180, c:140, f:45 },
  'Vegetarian':      { cal:2200, p:140, c:280, f:65 },
  'Keto':            { cal:2000, p:160, c:40,  f:145 },
  'Indian Fusion':   { cal:2100, p:120, c:260, f:68 },
  'IF 16:8':         { cal:2000, p:150, c:220, f:65 },
}

export default function MealPlanPage() {
  const [activeTab, setActiveTab] = useState('plans')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [activeDay, setActiveDay] = useState('Monday')
  const [activeGoal, setActiveGoal] = useState('All')
  const [activeDifficulty, setActiveDifficulty] = useState('All')
  const [activeDiet, setActiveDiet] = useState('All')
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [activePlanView, setActivePlanView] = useState(null)
  const [checkedGrocery, setCheckedGrocery] = useState([])
  const [activeMacroGoal, setActiveMacroGoal] = useState('Muscle Building')
  const [waterGlasses, setWaterGlasses] = useState(6)

  const filtered = MEAL_PLANS.filter(p => {
    const matchGoal = activeGoal === 'All' || p.goal.includes(activeGoal)
    const matchDiff = activeDifficulty === 'All' || p.difficulty === activeDifficulty
    const matchDiet = activeDiet === 'All' || p.tags.includes(activeDiet)
    const matchSrch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchGoal && matchDiff && matchDiet && matchSrch
  })

  const card = {
    background:'rgba(18,18,26,0.85)',
    backdropFilter:'blur(24px)',
    WebkitBackdropFilter:'blur(24px)',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:'28px',
    boxShadow:'0 8px 40px rgba(0,0,0,0.5)',
    overflow:'hidden',
  }

  const currentPlanMeals = activePlanView?.meals?.[activeDay] || []

  const toggleGrocery = (item) => {
    setCheckedGrocery(p =>
      p.includes(item) ? p.filter(i=>i!==item) : [...p, item]
    )
  }

  const macroTarget = MACRO_TARGETS[activeMacroGoal] || MACRO_TARGETS['Muscle Building']

  return (

      <div style={{ width:'100%' }}>

        {/* AMBIENT */}
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          background:`
            radial-gradient(600px circle at 20% 30%, rgba(0,255,135,0.04) 0%, transparent 60%),
            radial-gradient(400px circle at 80% 70%, rgba(249,115,22,0.04) 0%, transparent 60%),
            radial-gradient(300px circle at 50% 50%, rgba(123,97,255,0.02) 0%, transparent 60%)
          `
        }}/>

        <div style={{ position:'relative', zIndex:1 }}>

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
                  background:'linear-gradient(135deg,#ffffff 0%,#F97316 60%,#00FF87 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                }}>Meal Plan Intelligence 🍽️</h1>
                <p style={{ color:'#6B7280', margin:0, fontSize:'0.9rem' }}>
                  {MEAL_PLANS.length} premium plans · 500+ optimized meals
                </p>
              </div>

              {/* Today stats */}
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                {[
                  { icon:'🔥', label:'Calories',  val:'1,840 / 2,800', color:'#FF6B35' },
                  { icon:'💪', label:'Protein',   val:'142 / 210g',    color:'#00FF87' },
                  { icon:'⚡', label:'Streak',    val:'14 days',       color:'#FFD700' },
                  { icon:'💧', label:'Hydration', val:'6 / 8 glasses', color:'#00D4FF' },
                ].map(s => (
                  <div key={s.label} style={{
                    background:'rgba(22,22,31,0.8)',
                    backdropFilter:'blur(20px)',
                    border:'1px solid rgba(255,255,255,0.07)',
                    borderRadius:'14px', padding:'12px 16px',
                    textAlign:'center', minWidth:'100px'
                  }}>
                    <div style={{ fontSize:'1.2rem', marginBottom:'4px' }}>{s.icon}</div>
                    <div style={{ color:s.color, fontWeight:700, fontSize:'0.82rem' }}>{s.val}</div>
                    <div style={{ color:'#4B5563', fontSize:'0.7rem', marginTop:'2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* TABS */}
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {[
                { id:'plans',     label:'🍽️ Meal Plans',       count:MEAL_PLANS.length },
                { id:'daily',     label:'📅 Daily Schedule',    count:null },
                { id:'nutrition', label:'📊 Nutrition Tracker', count:null },
                { id:'grocery',   label:'🛒 Grocery List',      count:Object.values(GROCERY_LIST).flat().length },
                { id:'macros',    label:'💪 Macro Calculator',  count:null },
                { id:'water',     label:'💧 Hydration',         count:null },
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale:1.03 }}
                  whileTap={{ scale:0.97 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding:'9px 20px', borderRadius:'12px',
                    border: activeTab===tab.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    background: activeTab===tab.id
                      ? 'linear-gradient(135deg,#F97316,#FFD700)'
                      : 'rgba(22,22,31,0.8)',
                    color: activeTab===tab.id ? '#000' : '#9CA3AF',
                    fontWeight: activeTab===tab.id ? 700 : 400,
                    cursor:'pointer', fontSize:'0.85rem',
                    fontFamily:"'Satoshi',sans-serif",
                    display:'flex', alignItems:'center', gap:'6px'
                  }}
                >
                  {tab.label}
                  {tab.count && (
                    <span style={{
                      background: activeTab===tab.id ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                      borderRadius:'99px', padding:'1px 8px',
                      fontSize:'0.72rem'
                    }}>{tab.count}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">

            {/* ═══ PLANS TAB ═══ */}
            {activeTab === 'plans' && (
              <motion.div key="plans"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                {/* Search */}
                <div style={{ position:'relative', marginBottom:'16px' }}>
                  <span style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', fontSize:'1rem' }}>🔍</span>
                  <input
                    placeholder={`Search ${MEAL_PLANS.length} meal plans...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width:'100%', boxSizing:'border-box',
                      background:'rgba(22,22,31,0.8)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:'14px', padding:'13px 16px 13px 44px',
                      color:'#F0F0FF', fontSize:'0.95rem', outline:'none',
                      fontFamily:"'Satoshi',sans-serif"
                    }}
                    onFocus={e => e.target.style.borderColor='rgba(249,115,22,0.5)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
                  />
                </div>

                {/* Filters */}
                <div style={{ marginBottom:'24px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ color:'#4B5563', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', minWidth:'70px' }}>Goal</span>
                    {['All','Muscle Building','Fat Loss','Maintenance','Ketosis'].map(g => (
                      <motion.button key={g} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => setActiveGoal(g)}
                        style={{
                          padding:'5px 14px', borderRadius:'99px',
                          border: activeGoal===g ? 'none' : '1px solid rgba(255,255,255,0.07)',
                          background: activeGoal===g ? 'linear-gradient(135deg,#F97316,#FFD700)' : 'rgba(22,22,31,0.8)',
                          color: activeGoal===g ? '#000' : '#9CA3AF',
                          fontWeight: activeGoal===g ? 700 : 400,
                          cursor:'pointer', fontSize:'0.78rem'
                        }}>{g}</motion.button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ color:'#4B5563', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', minWidth:'70px' }}>Level</span>
                    {DIFFICULTIES.map(d => {
                      const dc = d==='Beginner' ? '#00FF87' : d==='Intermediate' ? '#FFD700' : d==='Advanced' ? '#FF6B35' : '#9CA3AF'
                      const active = activeDifficulty===d
                      return (
                        <motion.button key={d} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => setActiveDifficulty(d)}
                          style={{
                            padding:'5px 14px', borderRadius:'99px',
                            border: active ? `1px solid ${dc}50` : '1px solid rgba(255,255,255,0.07)',
                            background: active ? `${dc}15` : 'rgba(22,22,31,0.8)',
                            color: active ? dc : '#9CA3AF',
                            fontWeight: active ? 700 : 400,
                            cursor:'pointer', fontSize:'0.78rem'
                          }}>{d}</motion.button>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ color:'#4B5563', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', minWidth:'70px' }}>Diet</span>
                    {DIET_TYPES.map(dt => (
                      <motion.button key={dt} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => setActiveDiet(dt)}
                        style={{
                          padding:'5px 14px', borderRadius:'99px',
                          border: activeDiet===dt ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                          background: activeDiet===dt ? 'rgba(0,212,255,0.12)' : 'rgba(22,22,31,0.8)',
                          color: activeDiet===dt ? '#00D4FF' : '#9CA3AF',
                          fontWeight: activeDiet===dt ? 700 : 400,
                          cursor:'pointer', fontSize:'0.78rem'
                        }}>{dt}</motion.button>
                    ))}
                  </div>
                </div>

                <div style={{ color:'#6B7280', fontSize:'0.82rem', marginBottom:'16px' }}>
                  Showing <span style={{ color:'#F97316', fontWeight:700 }}>{filtered.length}</span> of {MEAL_PLANS.length} plans
                </div>

                {/* Plans Grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'28px' }}>
                  {filtered.map((plan, i) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity:0, y:30, scale:0.95 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={{ delay:i*0.07, type:'spring', stiffness:200 }}
                      whileHover={{ y:-10, scale:1.02 }}
                      onHoverStart={() => setHoveredId(plan.id)}
                      onHoverEnd={() => setHoveredId(null)}
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        ...card, cursor:'pointer', minHeight:'480px',
                        boxShadow: hoveredId===plan.id
                          ? `0 24px 80px ${plan.glow}, 0 0 0 1px ${plan.color}40` 
                          : '0 8px 32px rgba(0,0,0,0.4)',
                        transition:'box-shadow 0.3s'
                      }}
                    >
                      <div style={{ height:'3px', background:`linear-gradient(90deg,${plan.color},${plan.color}40,transparent)` }}/>
                      <div style={{ padding:'32px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                          <motion.div
                            animate={hoveredId===plan.id ? { scale:1.3, rotate:[-5,5,-5,0] } : { scale:1 }}
                            style={{
                              fontSize:'4.5rem',
                              filter: hoveredId===plan.id ? `drop-shadow(0 0 16px ${plan.color})` : 'none',
                              transition:'filter 0.3s'
                            }}
                          >{plan.emoji}</motion.div>
                          <div style={{
                            background: plan.difficulty==='Beginner' ? 'rgba(0,255,135,0.12)'
                              : plan.difficulty==='Intermediate' ? 'rgba(255,215,0,0.12)'
                              : 'rgba(255,107,53,0.12)',
                            border:`1px solid ${plan.difficulty==='Beginner' ? 'rgba(0,255,135,0.3)' : plan.difficulty==='Intermediate' ? 'rgba(255,215,0,0.3)' : 'rgba(255,107,53,0.3)'}`,
                            borderRadius:'99px', padding:'6px 16px',
                            color: plan.difficulty==='Beginner' ? '#00FF87' : plan.difficulty==='Intermediate' ? '#FFD700' : '#FF6B35',
                            fontSize:'0.8rem', fontWeight:700
                          }}>{plan.difficulty}</div>
                        </div>

                        <h3 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'1.4rem', color:'white', margin:0, marginBottom:'14px', fontWeight:700 }}>
                          {plan.name}
                        </h3>
                        <p style={{ color:'#6B7280', fontSize:'0.9rem', margin:0, marginBottom:'14px', lineHeight:1.5 }}>
                          {plan.description}
                        </p>

                        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'16px' }}>
                          {plan.tags.map(t => (
                            <span key={t} style={{
                              background:`${plan.color}10`, border:`1px solid ${plan.color}25`,
                              borderRadius:'6px', padding:'5px 16px',
                              color:plan.color, fontSize:'0.8rem', fontWeight:600
                            }}>{t}</span>
                          ))}
                        </div>

                        {/* Macro bars */}
                        {[
                          { label:'Protein', val:plan.protein, max:220, color:'#00FF87' },
                          { label:'Carbs',   val:plan.carbs,   max:360, color:'#7B61FF' },
                          { label:'Fat',     val:plan.fat,     max:160, color:'#FF6B35' },
                        ].map(m => (
                          <div key={m.label} style={{ marginBottom:'14px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                              <span style={{ color:'#6B7280', fontSize:'0.72rem' }}>{m.label}</span>
                              <span style={{ color:m.color, fontSize:'0.88rem', fontWeight:700 }}>{m.val}g</span>
                            </div>
                            <div style={{ height:'12px', background:'rgba(255,255,255,0.05)', borderRadius:'99px', overflow:'hidden' }}>
                              <motion.div
                                initial={{ width:0 }}
                                animate={{ width:`${(m.val/m.max)*100}%` }}
                                transition={{ duration:1, delay:i*0.1+0.3 }}
                                style={{ height:'100%', background:m.color, borderRadius:'99px', boxShadow:`0 0 6px ${m.color}60` }}
                              />
                            </div>
                          </div>
                        ))}

                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'14px' }}>
                          {[
                            { label:'Calories', val:`${plan.calories} kcal`, color:plan.color },
                            { label:'Duration', val:plan.duration,           color:'#00D4FF' },
                          ].map(s => (
                            <div key={s.label} style={{
                              background:'rgba(255,255,255,0.03)',
                              borderRadius:'10px', padding:'16px',
                              textAlign:'center', border:'1px solid rgba(255,255,255,0.05)'
                            }}>
                              <div style={{ color:s.color, fontWeight:800, fontSize:'1.1rem' }}>{s.val}</div>
                              <div style={{ color:'#374151', fontSize:'0.65rem', marginTop:'1px' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>

                        <motion.div
                          animate={hoveredId===plan.id ? { opacity:1, y:0 } : { opacity:0, y:8 }}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', color:plan.color, fontSize:'0.82rem', fontWeight:700, marginTop:'12px' }}
                        >View Plan ↗</motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ DAILY SCHEDULE TAB ═══ */}
            {activeTab === 'daily' && (
              <motion.div key="daily"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                {/* Plan selector */}
                <div style={{ marginBottom:'20px', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ color:'#6B7280', fontSize:'0.85rem' }}>Active Plan:</span>
                  {MEAL_PLANS.map(p => (
                    <motion.button key={p.id} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      onClick={() => setActivePlanView(p)}
                      style={{
                        padding:'7px 16px', borderRadius:'99px',
                        border: activePlanView?.id===p.id ? `1px solid ${p.color}50` : '1px solid rgba(255,255,255,0.08)',
                        background: activePlanView?.id===p.id ? `${p.color}15` : 'rgba(22,22,31,0.8)',
                        color: activePlanView?.id===p.id ? p.color : '#9CA3AF',
                        fontWeight: activePlanView?.id===p.id ? 700 : 400,
                        cursor:'pointer', fontSize:'0.82rem',
                        display:'flex', alignItems:'center', gap:'6px'
                      }}
                    >{p.emoji} {p.name}</motion.button>
                  ))}
                </div>

                {/* Day tabs */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
                  {DAYS.map((day, i) => {
                    const nutrition = WEEKLY_NUTRITION[i]
                    const active = activeDay === day
                    return (
                      <motion.button key={day} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => setActiveDay(day)}
                        style={{
                          padding:'10px 16px', borderRadius:'14px',
                          border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          background: active ? 'linear-gradient(135deg,#F97316,#FFD700)' : 'rgba(22,22,31,0.8)',
                          color: active ? '#000' : '#9CA3AF',
                          fontWeight: active ? 700 : 400, cursor:'pointer',
                          fontSize:'0.82rem', textAlign:'center', minWidth:'80px'
                        }}
                      >
                        <div style={{ fontWeight:700 }}>{day.slice(0,3)}</div>
                        {nutrition && <div style={{ fontSize:'0.68rem', opacity:0.8 }}>{nutrition.cal} kcal</div>}
                      </motion.button>
                    )
                  })}
                </div>

                {!activePlanView ? (
                  <div style={{ ...card, padding:'48px', textAlign:'center' }}>
                    <div style={{ fontSize:'3rem', marginBottom:'12px' }}>👆</div>
                    <div style={{ color:'#6B7280', fontSize:'0.9rem' }}>Select a meal plan above to view your daily schedule</div>
                  </div>
                ) : currentPlanMeals.length === 0 ? (
                  <div style={{ ...card, padding:'48px', textAlign:'center' }}>
                    <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📅</div>
                    <div style={{ color:'#6B7280', fontSize:'0.9rem' }}>No meals defined for {activeDay} — rest or freestyle day!</div>
                  </div>
                ) : (
                  <div>
                    {/* Daily macro summary */}
                    <div style={{ ...card, padding:'24px', marginBottom:'20px',
                      background:'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(249,115,22,0.04))',
                      border:`1px solid ${activePlanView.color}20` 
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
                        <div>
                          <div style={{ color:'#6B7280', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>
                            {activeDay} Total
                          </div>
                          <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'2.2rem', fontWeight:800, color:activePlanView.color }}>
                            {currentPlanMeals.reduce((a,m)=>a+m.cal,0)}
                            <span style={{ fontSize:'1rem', color:'#6B7280', fontWeight:400 }}> kcal</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'20px' }}>
                          {[
                            { label:'Protein', val:currentPlanMeals.reduce((a,m)=>a+m.p,0), color:'#00FF87', unit:'g' },
                            { label:'Carbs',   val:currentPlanMeals.reduce((a,m)=>a+m.c,0), color:'#7B61FF', unit:'g' },
                            { label:'Fat',     val:currentPlanMeals.reduce((a,m)=>a+m.f,0), color:'#FF6B35', unit:'g' },
                            { label:'Meals',   val:currentPlanMeals.length,                  color:'#00D4FF', unit:'' },
                          ].map(m => (
                            <div key={m.label} style={{ textAlign:'center' }}>
                              <div style={{ color:m.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.4rem', fontWeight:700 }}>{m.val}{m.unit}</div>
                              <div style={{ color:'#6B7280', fontSize:'0.72rem' }}>{m.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ position:'relative' }}>
                      {/* Timeline line */}
                      <div style={{
                        position:'absolute', left:'52px', top:'24px', bottom:'24px',
                        width:'2px', background:'rgba(255,255,255,0.06)',
                        borderRadius:'99px'
                      }}/>

                      {currentPlanMeals.map((meal, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity:0, x:-20 }}
                          animate={{ opacity:1, x:0 }}
                          transition={{ delay:i*0.08 }}
                          style={{ display:'flex', gap:'20px', marginBottom:'16px', alignItems:'flex-start' }}
                        >
                          {/* Time */}
                          <div style={{ minWidth:'80px', textAlign:'right', paddingTop:'16px' }}>
                            <div style={{ color:activePlanView.color, fontSize:'0.78rem', fontWeight:700 }}>{meal.time}</div>
                          </div>

                          {/* Dot */}
                          <div style={{
                            width:'12px', height:'12px', borderRadius:'50%',
                            background:activePlanView.color, marginTop:'20px',
                            flexShrink:0, position:'relative', zIndex:1,
                            boxShadow:`0 0 10px ${activePlanView.glow}` 
                          }}/>

                          {/* Meal card */}
                          <motion.div
                            whileHover={{ x:4, boxShadow:`0 8px 32px ${activePlanView.glow}` }}
                            style={{
                              flex:1, ...card, padding:'20px',
                              border:`1px solid ${activePlanView.color}15`,
                              cursor:'pointer', overflow:'visible'
                            }}
                          >
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                <span style={{ fontSize:'2rem' }}>{meal.emoji}</span>
                                <div>
                                  <div style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1rem', fontWeight:700 }}>{meal.name}</div>
                                  <div style={{
                                    display:'inline-block',
                                    background:`${activePlanView.color}12`,
                                    border:`1px solid ${activePlanView.color}25`,
                                    borderRadius:'99px', padding:'2px 10px',
                                    color:activePlanView.color, fontSize:'0.7rem', fontWeight:600, marginTop:'3px'
                                  }}>{meal.type}</div>
                                </div>
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <div style={{ color:activePlanView.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.3rem', fontWeight:800 }}>{meal.cal}</div>
                                <div style={{ color:'#6B7280', fontSize:'0.7rem' }}>calories</div>
                              </div>
                            </div>

                            {/* Macros */}
                            <div style={{ display:'flex', gap:'12px', marginBottom:'12px', flexWrap:'wrap' }}>
                              {[
                                { label:'P', val:`${meal.p}g`, color:'#00FF87' },
                                { label:'C', val:`${meal.c}g`, color:'#7B61FF' },
                                { label:'F', val:`${meal.f}g`, color:'#FF6B35' },
                                { label:'Prep', val:`${meal.prep}m`, color:'#00D4FF' },
                              ].map(m => (
                                <span key={m.label} style={{
                                  background:'rgba(255,255,255,0.04)',
                                  border:'1px solid rgba(255,255,255,0.08)',
                                  borderRadius:'8px', padding:'4px 10px',
                                  color:m.color, fontSize:'0.75rem', fontWeight:600
                                }}>{m.label}: {m.val}</span>
                              ))}
                            </div>

                            {/* Ingredients */}
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                              {meal.ingredients.map(ing => (
                                <span key={ing} style={{
                                  background:'rgba(255,255,255,0.03)',
                                  borderRadius:'6px', padding:'3px 10px',
                                  color:'#9CA3AF', fontSize:'0.72rem'
                                }}>• {ing}</span>
                              ))}
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ NUTRITION TRACKER TAB ═══ */}
            {activeTab === 'nutrition' && (
              <motion.div key="nutrition"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'20px' }}>
                  {/* Weekly chart */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'20px' }}>
                      📈 Weekly Calorie Overview
                    </h3>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:'12px', height:'140px', marginBottom:'8px' }}>
                      {WEEKLY_NUTRITION.map((d,i) => {
                        const max = 2800
                        const goalH = (2800/max)*100
                        const actH  = (d.cal/max)*100
                        return (
                          <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', position:'relative' }}>
                            {/* Goal line */}
                            <div style={{
                              position:'absolute', bottom:`${goalH}%`, left:0, right:0,
                              height:'1px', background:'rgba(255,107,53,0.3)',
                              borderTop:'1px dashed rgba(255,107,53,0.5)'
                            }}/>
                            <div style={{ color:'#6B7280', fontSize:'0.68rem', marginBottom:'4px' }}>{d.cal}</div>
                            <motion.div
                              initial={{ height:0 }}
                              animate={{ height:`${actH}%` }}
                              transition={{ delay:i*0.08, duration:0.6, type:'spring' }}
                              style={{
                                width:'100%', borderRadius:'6px 6px 0 0',
                                background: d.cal > 2800
                                  ? 'linear-gradient(180deg,#FF6B35,#FF6B3580)'
                                  : 'linear-gradient(180deg,#00FF87,#00FF8740)',
                                boxShadow: d.cal >= 2700 ? '0 0 16px rgba(0,255,135,0.4)' : 'none'
                              }}
                            />
                            <div style={{ color:'#4B5563', fontSize:'0.7rem', marginTop:'6px', fontWeight:600 }}>{d.day}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display:'flex', gap:'16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <div style={{ width:'12px', height:'12px', borderRadius:'2px', background:'#00FF87' }}/>
                        <span style={{ color:'#6B7280', fontSize:'0.75rem' }}>Under goal</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <div style={{ width:'12px', height:'12px', borderRadius:'2px', background:'#FF6B35' }}/>
                        <span style={{ color:'#6B7280', fontSize:'0.75rem' }}>Over goal</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily breakdown */}
                  <div style={{ ...card, padding:'24px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1rem', marginBottom:'16px' }}>
                      Today's Nutrients
                    </h3>
                    {[
                      { label:'Calories',  current:1840, goal:2800, color:'#F97316',  unit:'kcal' },
                      { label:'Protein',   current:142,  goal:210,  color:'#00FF87',  unit:'g' },
                      { label:'Carbs',     current:210,  goal:320,  color:'#7B61FF',  unit:'g' },
                      { label:'Fat',       current:58,   goal:85,   color:'#FF6B35',  unit:'g' },
                      { label:'Fiber',     current:18,   goal:35,   color:'#4ADE80',  unit:'g' },
                      { label:'Sugar',     current:42,   goal:60,   color:'#FBBF24',  unit:'g' },
                      { label:'Sodium',    current:1800, goal:2300, color:'#00D4FF',  unit:'mg' },
                      { label:'Water',     current:1.8,  goal:3,    color:'#60A5FA',  unit:'L' },
                    ].map((n,i) => (
                      <div key={n.label} style={{ marginBottom:'12px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                          <span style={{ color:'#D1D5DB', fontSize:'0.8rem' }}>{n.label}</span>
                          <span style={{ color:n.color, fontSize:'0.8rem', fontWeight:600 }}>{n.current} / {n.goal}{n.unit}</span>
                        </div>
                        <div style={{ height:'6px', background:'rgba(255,255,255,0.05)', borderRadius:'99px', overflow:'hidden' }}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${Math.min((n.current/n.goal)*100,100)}%` }}
                            transition={{ duration:1, delay:i*0.08 }}
                            style={{ height:'100%', background:n.color, borderRadius:'99px', boxShadow:`0 0 6px ${n.color}50` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Macro heatmap by day */}
                <div style={{ ...card, padding:'28px' }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'20px' }}>
                    🔥 Macro Distribution Heatmap
                  </h3>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'6px' }}>
                      <thead>
                        <tr>
                          <th style={{ color:'#4B5563', fontSize:'0.72rem', textAlign:'left', padding:'4px 8px' }}>Macro</th>
                          {DAYS.map(d => (
                            <th key={d} style={{ color:'#4B5563', fontSize:'0.72rem', textAlign:'center', padding:'4px 8px' }}>{d.slice(0,3)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label:'Protein', key:'pro', max:210, color:'#00FF87' },
                          { label:'Carbs',   key:'carb',max:320, color:'#7B61FF' },
                          { label:'Fat',     key:'fat', max:85,  color:'#FF6B35' },
                          { label:'Calories',key:'cal', max:2800,color:'#F97316' },
                        ].map(row => (
                          <tr key={row.label}>
                            <td style={{ color:'#D1D5DB', fontSize:'0.8rem', padding:'4px 8px', whiteSpace:'nowrap' }}>{row.label}</td>
                            {WEEKLY_NUTRITION.map((day,di) => {
                              const val = day[row.key]
                              const pct = val/row.max
                              return (
                                <td key={di} style={{ padding:'4px 2px', textAlign:'center' }}>
                                  <motion.div
                                    initial={{ opacity:0, scale:0.5 }}
                                    animate={{ opacity:1, scale:1 }}
                                    transition={{ delay:di*0.05 }}
                                    title={`${day.day}: ${val}`}
                                    style={{
                                      height:'36px', borderRadius:'8px',
                                      background: `${row.color}${Math.round(pct*80+20).toString(16).padStart(2,'0')}`,
                                      display:'flex', alignItems:'center', justifyContent:'center',
                                      fontSize:'0.65rem', color:'rgba(255,255,255,0.8)',
                                      fontWeight:600, cursor:'pointer',
                                      boxShadow: pct > 0.9 ? `0 0 8px ${row.color}50` : 'none'
                                    }}
                                  >{row.key==='cal' ? `${(val/1000).toFixed(1)}k` : `${val}g`}</motion.div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ GROCERY TAB ═══ */}
            {activeTab === 'grocery' && (
              <motion.div key="grocery"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                {/* Summary */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'28px', marginBottom:'20px', width:'100%' }}>
                  {[
                    { label:'Total Items',    val:Object.values(GROCERY_LIST).flat().length, icon:'🛒', color:'#00FF87' },
                    { label:'Est. Cost',      val:'₹2,840',  icon:'💰', color:'#FFD700' },
                    { label:'Checked',        val:`${checkedGrocery.length}/${Object.values(GROCERY_LIST).flat().length}`, icon:'✅', color:'#00D4FF' },
                    { label:'Categories',     val:Object.keys(GROCERY_LIST).length, icon:'📦', color:'#F97316' },
                  ].map(s => (
                    <motion.div key={s.label} whileHover={{ y:-4 }} style={{
                      ...card, padding:'20px',
                      background:`${s.color}08`, border:`1px solid ${s.color}20` 
                    }}>
                      <div style={{ fontSize:'1.8rem', marginBottom:'8px' }}>{s.icon}</div>
                      <div style={{ color:s.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.6rem', fontWeight:800 }}>{s.val}</div>
                      <div style={{ color:'#6B7280', fontSize:'0.78rem', marginTop:'4px' }}>{s.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Grocery sections */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'20px' }}>
                  {Object.entries(GROCERY_LIST).map(([category, items], ci) => {
                    const catColors = { Proteins:'#00FF87', Carbs:'#7B61FF', Vegetables:'#4ADE80', Fats:'#FFD700' }
                    const catColor = catColors[category] || '#00FF87'
                    const catIcons = { Proteins:'🍗', Carbs:'🍚', Vegetables:'🥦', Fats:'🥑' }
                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity:0, y:20 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay:ci*0.1 }}
                        style={{ ...card, padding:'24px', border:`1px solid ${catColor}15` }}
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                          <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:catColor, fontSize:'1.1rem', fontWeight:700, margin:0, display:'flex', gap:'8px', alignItems:'center' }}>
                            {catIcons[category]} {category}
                          </h3>
                          <span style={{
                            background:`${catColor}15`, border:`1px solid ${catColor}30`,
                            borderRadius:'99px', padding:'3px 10px',
                            color:catColor, fontSize:'0.72rem', fontWeight:600
                          }}>{items.filter(i=>checkedGrocery.includes(i.item)).length}/{items.length}</span>
                        </div>
                        {items.map((item, ii) => {
                          const checked = checkedGrocery.includes(item.item)
                          return (
                            <motion.div
                              key={item.item}
                              initial={{ opacity:0, x:-10 }}
                              animate={{ opacity:1, x:0 }}
                              transition={{ delay:ci*0.1+ii*0.04 }}
                              onClick={() => toggleGrocery(item.item)}
                              style={{
                                display:'flex', alignItems:'center',
                                justifyContent:'space-between',
                                padding:'10px 12px', marginBottom:'6px',
                                borderRadius:'12px', cursor:'pointer',
                                background: checked ? `${catColor}08` : 'rgba(255,255,255,0.03)',
                                border:`1px solid ${checked ? catColor+'30' : 'rgba(255,255,255,0.05)'}`,
                                opacity: checked ? 0.6 : 1,
                                transition:'all 0.2s'
                              }}
                            >
                              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                <div style={{
                                  width:'20px', height:'20px', borderRadius:'6px',
                                  background: checked ? catColor : 'rgba(255,255,255,0.06)',
                                  border:`2px solid ${checked ? catColor : 'rgba(255,255,255,0.15)'}`,
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  color:'#000', fontSize:'0.7rem', flexShrink:0,
                                  transition:'all 0.2s'
                                }}>{checked ? '✓' : ''}</div>
                                <span style={{ fontSize:'1.1rem' }}>{item.emoji}</span>
                                <div>
                                  <div style={{
                                    color: checked ? '#4B5563' : '#D1D5DB',
                                    fontSize:'0.85rem', fontWeight:500,
                                    textDecoration: checked ? 'line-through' : 'none'
                                  }}>{item.item}</div>
                                  <div style={{ color:'#4B5563', fontSize:'0.7rem' }}>{item.qty} · {item.cal} kcal/100g</div>
                                </div>
                              </div>
                              <span style={{ color:catColor, fontWeight:700, fontSize:'0.85rem' }}>{item.price}</span>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ MACRO CALCULATOR TAB ═══ */}
            {activeTab === 'macros' && (
              <motion.div key="macros"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                {/* Goal selector */}
                <div style={{ display:'flex', gap:'10px', marginBottom:'24px', flexWrap:'wrap' }}>
                  {Object.keys(MACRO_TARGETS).map(goal => (
                    <motion.button key={goal} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      onClick={() => setActiveMacroGoal(goal)}
                      style={{
                        padding:'9px 18px', borderRadius:'12px',
                        border: activeMacroGoal===goal ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        background: activeMacroGoal===goal ? 'linear-gradient(135deg,#F97316,#FFD700)' : 'rgba(22,22,31,0.8)',
                        color: activeMacroGoal===goal ? '#000' : '#9CA3AF',
                        fontWeight: activeMacroGoal===goal ? 700 : 400,
                        cursor:'pointer', fontSize:'0.85rem'
                      }}>{goal}</motion.button>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>

                  {/* Big macro display */}
                  <div style={{ ...card, padding:'32px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'24px' }}>
                      🎯 Daily Targets — {activeMacroGoal}
                    </h3>
                    {[
                      { label:'Calories', val:macroTarget.cal, unit:'kcal', color:'#F97316', icon:'🔥', pct:100, desc:'Total energy target' },
                      { label:'Protein',  val:macroTarget.p,   unit:'g',    color:'#00FF87', icon:'💪', pct:Math.round((macroTarget.p*4/macroTarget.cal)*100), desc:'Muscle building & repair' },
                      { label:'Carbs',    val:macroTarget.c,   unit:'g',    color:'#7B61FF', icon:'⚡', pct:Math.round((macroTarget.c*4/macroTarget.cal)*100), desc:'Energy & performance' },
                      { label:'Fat',      val:macroTarget.f,   unit:'g',    color:'#FFD700', icon:'🥑', pct:Math.round((macroTarget.f*9/macroTarget.cal)*100), desc:'Hormones & cell health' },
                    ].map((m,i) => (
                      <div key={m.label} style={{ marginBottom:'20px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span>{m.icon}</span>
                            <span style={{ color:'#F0F0FF', fontWeight:600 }}>{m.label}</span>
                            <span style={{ color:'#4B5563', fontSize:'0.75rem' }}>{m.desc}</span>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <span style={{ color:m.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.4rem', fontWeight:800 }}>{m.val}</span>
                            <span style={{ color:'#6B7280', fontSize:'0.8rem' }}> {m.unit}</span>
                            <div style={{ color:'#4B5563', fontSize:'0.7rem' }}>{m.pct}% of calories</div>
                          </div>
                        </div>
                        <div style={{ height:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'99px', overflow:'hidden' }}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${m.pct}%` }}
                            transition={{ duration:1.2, delay:i*0.15, type:'spring' }}
                            style={{
                              height:'100%', background:`linear-gradient(90deg,${m.color},${m.color}80)`,
                              borderRadius:'99px', boxShadow:`0 0 10px ${m.color}50` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pie donut visual */}
                  <div style={{ ...card, padding:'32px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'24px', textAlign:'center' }}>
                      📊 Macro Split
                    </h3>
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      <defs>
                        {['#00FF87','#7B61FF','#FFD700'].map((c,i) => (
                          <radialGradient key={i} id={`grad${i}`}>
                            <stop offset="0%" stopColor={c} stopOpacity="0.9"/>
                            <stop offset="100%" stopColor={c} stopOpacity="0.5"/>
                          </radialGradient>
                        ))}
                      </defs>
                      {(() => {
                        const pCal = macroTarget.p * 4
                        const cCal = macroTarget.c * 4
                        const fCal = macroTarget.f * 9
                        const total = pCal + cCal + fCal
                        const segments = [
                          { val:pCal/total, color:'#00FF87', label:'Protein' },
                          { val:cCal/total, color:'#7B61FF', label:'Carbs' },
                          { val:fCal/total, color:'#FFD700', label:'Fat' },
                        ]
                        let cumulative = 0
                        const cx=100, cy=100, r=70, ir=45
                        return segments.map((seg,i) => {
                          const startAngle = cumulative * 2 * Math.PI - Math.PI/2
                          cumulative += seg.val
                          const endAngle = cumulative * 2 * Math.PI - Math.PI/2
                          const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle)
                          const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle)
                          const ix1=cx+ir*Math.cos(startAngle),iy1=cy+ir*Math.sin(startAngle)
                          const ix2=cx+ir*Math.cos(endAngle),  iy2=cy+ir*Math.sin(endAngle)
                          const large = seg.val > 0.5 ? 1 : 0
                          const d = `M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${large},0 ${ix1},${iy1}` 
                          return (
                            <motion.path
                              key={seg.label}
                              d={d} fill={seg.color}
                              initial={{ opacity:0, scale:0.5 }}
                              animate={{ opacity:0.85, scale:1 }}
                              transition={{ delay:i*0.2, duration:0.6 }}
                              style={{ filter:`drop-shadow(0 0 6px ${seg.color}60)` }}
                            />
                          )
                        })
                      })()}
                      <text x="100" y="95" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="'Clash Display',sans-serif">{macroTarget.cal}</text>
                      <text x="100" y="112" textAnchor="middle" fill="#6B7280" fontSize="11">kcal/day</text>
                    </svg>
                    <div style={{ display:'flex', gap:'20px', marginTop:'16px' }}>
                      {[
                        { label:'Protein', color:'#00FF87', pct:Math.round((macroTarget.p*4/(macroTarget.p*4+macroTarget.c*4+macroTarget.f*9))*100) },
                        { label:'Carbs',   color:'#7B61FF', pct:Math.round((macroTarget.c*4/(macroTarget.p*4+macroTarget.c*4+macroTarget.f*9))*100) },
                        { label:'Fat',     color:'#FFD700', pct:Math.round((macroTarget.f*9/(macroTarget.p*4+macroTarget.c*4+macroTarget.f*9))*100) },
                      ].map(l => (
                        <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:l.color }}/>
                          <span style={{ color:'#9CA3AF', fontSize:'0.78rem' }}>{l.label} {l.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Meal timing guide */}
                <div style={{ ...card, padding:'28px' }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'20px' }}>
                    ⏰ Optimal Meal Timing Guide
                  </h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
                    {[
                      { time:'6-8 AM',     label:'Wake Up Window',    cal:'20-25%',  focus:'Complex carbs + protein',    icon:'🌅', color:'#FFD700', tip:'Fuel morning metabolism' },
                      { time:'10-11 AM',   label:'Mid Morning',       cal:'10-15%',  focus:'Protein + light carbs',       icon:'☀️', color:'#00FF87', tip:'Prevent muscle catabolism' },
                      { time:'12-2 PM',    label:'Lunch Window',      cal:'25-30%',  focus:'Complete balanced meal',      icon:'🍽️', color:'#F97316', tip:'Biggest meal of the day' },
                      { time:'3-4 PM',     label:'Pre-Workout',       cal:'10-15%',  focus:'Fast carbs + small protein',  icon:'💪', color:'#7B61FF', tip:'30-60 min before training' },
                      { time:'6-8 PM',     label:'Post-Workout',      cal:'20-25%',  focus:'Protein + simple carbs',      icon:'🔥', color:'#00FF87', tip:'Within 30 min post workout' },
                      { time:'9-10 PM',    label:'Night Snack',       cal:'5-10%',   focus:'Slow protein + healthy fat',  icon:'🌙', color:'#A78BFA', tip:'Casein or cottage cheese' },
                    ].map((t,i) => (
                      <motion.div
                        key={t.time}
                        initial={{ opacity:0, y:20 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.08 }}
                        whileHover={{ y:-4, boxShadow:`0 8px 24px ${t.color}25` }}
                        style={{
                          background:`${t.color}06`,
                          border:`1px solid ${t.color}20`,
                          borderRadius:'16px', padding:'18px'
                        }}
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                          <span style={{ fontSize:'1.6rem' }}>{t.icon}</span>
                          <span style={{
                            background:`${t.color}15`,
                            border:`1px solid ${t.color}30`,
                            borderRadius:'99px', padding:'3px 10px',
                            color:t.color, fontSize:'0.7rem', fontWeight:700
                          }}>{t.cal}</span>
                        </div>
                        <div style={{ color:t.color, fontWeight:700, fontSize:'0.82rem', marginBottom:'2px' }}>{t.time}</div>
                        <div style={{ color:'white', fontWeight:600, fontSize:'0.88rem', marginBottom:'6px' }}>{t.label}</div>
                        <div style={{ color:'#9CA3AF', fontSize:'0.75rem', marginBottom:'6px' }}>{t.focus}</div>
                        <div style={{ color:'#6B7280', fontSize:'0.72rem', fontStyle:'italic' }}>💡 {t.tip}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ WATER TRACKER TAB ═══ */}
            {activeTab === 'water' && (
              <motion.div key="water"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              >
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px', marginBottom:'20px' }}>

                  {/* Big water tracker */}
                  <div style={{ ...card, padding:'32px', textAlign:'center',
                    background:'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(0,212,255,0.04))',
                    border:'1px solid rgba(0,212,255,0.15)'
                  }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'20px' }}>
                      💧 Today's Hydration
                    </h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'24px' }}>
                      {[...Array(8)].map((_,i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale:1.15 }}
                          whileTap={{ scale:0.9 }}
                          onClick={() => setWaterGlasses(i+1)}
                          style={{ cursor:'pointer', textAlign:'center' }}
                        >
                          <motion.div
                            animate={i < waterGlasses ? {
                              scale:[1,1.2,1],
                              filter:[
                                'hue-rotate(0deg)',
                                'hue-rotate(20deg)',
                                'hue-rotate(0deg)'
                              ]
                            } : {}}
                            transition={{ duration:0.4 }}
                            style={{
                              fontSize:'2.2rem',
                              filter: i < waterGlasses ? 'none' : 'grayscale(1) opacity(0.25)',
                              transition:'filter 0.3s',
                              textShadow: i < waterGlasses ? '0 0 16px rgba(0,212,255,0.8)' : 'none'
                            }}
                          >💧</motion.div>
                          <div style={{ color: i < waterGlasses ? '#00D4FF' : '#374151', fontSize:'0.65rem', marginTop:'4px', fontWeight:600 }}>
                            {i+1}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'3rem', fontWeight:900, color:'#00D4FF', marginBottom:'4px',
                      textShadow:'0 0 30px rgba(0,212,255,0.5)'
                    }}>{waterGlasses}<span style={{ fontSize:'1.5rem', color:'#6B7280' }}>/8</span></div>
                    <div style={{ color:'#6B7280', marginBottom:'20px' }}>{waterGlasses * 250}ml / 2000ml</div>
                    <div style={{ height:'12px', background:'rgba(255,255,255,0.05)', borderRadius:'99px', overflow:'hidden', marginBottom:'16px' }}>
                      <motion.div
                        animate={{ width:`${(waterGlasses/8)*100}%` }}
                        transition={{ duration:0.5, type:'spring' }}
                        style={{
                          height:'100%',
                          background:'linear-gradient(90deg,#00D4FF,#60A5FA)',
                          borderRadius:'99px',
                          boxShadow:'0 0 12px rgba(0,212,255,0.5)'
                        }}
                      />
                    </div>
                    <div style={{ display:'flex', gap:'10px' }}>
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => setWaterGlasses(w => Math.min(w+1,8))}
                        style={{
                          flex:1, padding:'12px',
                          background:'linear-gradient(135deg,#00D4FF,#60A5FA)',
                          border:'none', borderRadius:'12px',
                          color:'#000', fontWeight:700, cursor:'pointer', fontSize:'0.9rem'
                        }}>+ Add Glass 💧</motion.button>
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => setWaterGlasses(0)}
                        style={{
                          padding:'12px 16px',
                          background:'rgba(255,255,255,0.05)',
                          border:'1px solid rgba(255,255,255,0.1)',
                          borderRadius:'12px', color:'#9CA3AF',
                          cursor:'pointer', fontSize:'0.9rem'
                        }}>Reset</motion.button>
                    </div>
                  </div>

                  {/* Hydration info */}
                  <div style={{ ...card, padding:'28px' }}>
                    <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'20px' }}>
                      🧬 Hydration Science
                    </h3>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                      {[
                        { title:'Performance',  text:'Even 2% dehydration reduces strength by 10-15% and aerobic performance by 20%', icon:'💪', color:'#00FF87' },
                        { title:'Fat Loss',      text:'Drinking 500ml before meals reduces calorie intake by 13% and boosts metabolism', icon:'🔥', color:'#FF6B35' },
                        { title:'Muscle Growth', text:'Muscles are 75% water. Protein synthesis requires optimal hydration for efficiency', icon:'🏋️', color:'#7B61FF' },
                        { title:'Recovery',      text:'Water transports nutrients to cells and removes waste products post-workout', icon:'⚡', color:'#FFD700' },
                        { title:'Brain Power',   text:'3% dehydration impairs cognitive function and reaction time significantly', icon:'🧠', color:'#00D4FF' },
                        { title:'Digestion',     text:'Adequate hydration improves nutrient absorption and gut health by 40%', icon:'🫁', color:'#F97316' },
                      ].map((info,i) => (
                        <motion.div
                          key={info.title}
                          initial={{ opacity:0, scale:0.95 }}
                          animate={{ opacity:1, scale:1 }}
                          transition={{ delay:i*0.07 }}
                          whileHover={{ y:-3 }}
                          style={{
                            background:`${info.color}06`,
                            border:`1px solid ${info.color}20`,
                            borderRadius:'14px', padding:'16px'
                          }}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                            <span style={{ fontSize:'1.2rem' }}>{info.icon}</span>
                            <span style={{ color:info.color, fontWeight:700, fontSize:'0.88rem' }}>{info.title}</span>
                          </div>
                          <p style={{ color:'#9CA3AF', fontSize:'0.78rem', margin:0, lineHeight:1.5 }}>{info.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hydration schedule */}
                <div style={{ ...card, padding:'28px' }}>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'20px' }}>
                    📅 Daily Hydration Schedule
                  </h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px' }}>
                    {[
                      { time:'6:30 AM', amount:'500ml', reason:'Kickstart metabolism after overnight fast', icon:'🌅', done:true },
                      { time:'9:00 AM', amount:'250ml', reason:'Mid-morning energy and focus', icon:'☀️', done:true },
                      { time:'12:00 PM',amount:'500ml', reason:'Before lunch for portion control', icon:'🥗', done:true },
                      { time:'2:30 PM', amount:'250ml', reason:'Post-lunch digestion support', icon:'💧', done:false },
                      { time:'4:30 PM', amount:'400ml', reason:'Pre-workout hydration boost', icon:'💪', done:false },
                      { time:'6:00 PM', amount:'500ml', reason:'During and post workout recovery', icon:'🏋️', done:false },
                      { time:'8:00 PM', amount:'250ml', reason:'Evening wind down hydration', icon:'🌙', done:false },
                      { time:'9:30 PM', amount:'150ml', reason:'Pre-sleep hydration (not too much!)', icon:'😴', done:false },
                    ].map((s,i) => (
                      <motion.div
                        key={s.time}
                        initial={{ opacity:0, y:10 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.06 }}
                        whileHover={{ y:-4 }}
                        style={{
                          background: s.done ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
                          border:`1px solid ${s.done ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius:'14px', padding:'16px',
                          cursor:'pointer'
                        }}
                      >
                        <div style={{ fontSize:'1.5rem', marginBottom:'8px' }}>{s.icon}</div>
                        <div style={{ color: s.done ? '#00D4FF' : '#F97316', fontWeight:700, fontSize:'0.85rem', marginBottom:'2px' }}>{s.time}</div>
                        <div style={{ color:'white', fontWeight:700, fontSize:'0.9rem', marginBottom:'6px' }}>{s.amount}</div>
                        <div style={{ color:'#6B7280', fontSize:'0.72rem', lineHeight:1.4 }}>{s.reason}</div>
                        <div style={{
                          marginTop:'10px', display:'inline-block',
                          background: s.done ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                          border:`1px solid ${s.done ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius:'99px', padding:'3px 10px',
                          color: s.done ? '#00D4FF' : '#6B7280',
                          fontSize:'0.68rem', fontWeight:700
                        }}>{s.done ? '✓ Done' : 'Upcoming'}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ═══ PLAN DETAIL MODAL ═══ */}
        <AnimatePresence>
          {selectedPlan && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{
                position:'fixed', inset:0, zIndex:200,
                background:'rgba(0,0,0,0.85)',
                backdropFilter:'blur(16px)',
                display:'flex', alignItems:'center',
                justifyContent:'center', padding:'20px'
              }}
              onClick={e => e.target===e.currentTarget && setSelectedPlan(null)}
            >
              <motion.div
                initial={{ scale:0.8, opacity:0, y:60 }}
                animate={{ scale:1, opacity:1, y:0 }}
                exit={{ scale:0.8, opacity:0 }}
                transition={{ type:'spring', stiffness:280, damping:24 }}
                style={{
                  width:'100%', maxWidth:'780px',
                  maxHeight:'90vh', overflowY:'auto',
                  background:'rgba(10,10,18,0.99)',
                  border:`1px solid ${selectedPlan.color}35`,
                  borderRadius:'32px',
                  boxShadow:`0 60px 120px rgba(0,0,0,0.9), 0 0 100px ${selectedPlan.glow}`,
                }}
              >
                <div style={{ height:'4px', background:`linear-gradient(90deg,${selectedPlan.color},${selectedPlan.color}60,transparent)`, borderRadius:'32px 32px 0 0' }}/>
                <div style={{ padding:'36px' }}>

                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'28px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
                      <motion.div
                        animate={{ rotate:[0,12,-12,0] }}
                        transition={{ duration:3, repeat:Infinity }}
                        style={{ fontSize:'4.5rem', filter:`drop-shadow(0 0 24px ${selectedPlan.color})` }}
                      >{selectedPlan.emoji}</motion.div>
                      <div>
                        <h2 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'1.8rem', color:'white', margin:0, marginBottom:'8px', fontWeight:800 }}>
                          {selectedPlan.name}
                        </h2>
                        <p style={{ color:'#6B7280', margin:0, fontSize:'0.88rem', maxWidth:'400px' }}>
                          {selectedPlan.description}
                        </p>
                        <div style={{ display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>
                          {selectedPlan.tags.map(t => (
                            <span key={t} style={{
                              background:`${selectedPlan.color}15`, border:`1px solid ${selectedPlan.color}30`,
                              borderRadius:'99px', padding:'3px 12px',
                              color:selectedPlan.color, fontSize:'0.75rem', fontWeight:700
                            }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPlan(null)} style={{
                      background:'rgba(255,255,255,0.06)',
                      border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:'50%', width:'40px', height:'40px',
                      color:'#9CA3AF', cursor:'pointer', fontSize:'1.1rem',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                    }}>✕</button>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'12px', marginBottom:'28px' }}>
                    {[
                      { label:'Calories', val:selectedPlan.calories, unit:'kcal',   color:selectedPlan.color, icon:'🔥' },
                      { label:'Protein',  val:selectedPlan.protein,  unit:'g/day',  color:'#00FF87',           icon:'💪' },
                      { label:'Carbs',    val:selectedPlan.carbs,    unit:'g/day',  color:'#7B61FF',           icon:'⚡' },
                      { label:'Fat',      val:selectedPlan.fat,      unit:'g/day',  color:'#FFD700',           icon:'🥑' },
                      { label:'Duration', val:selectedPlan.duration, unit:'',       color:'#00D4FF',           icon:'📅' },
                    ].map(s => (
                      <div key={s.label} style={{
                        background:`${s.color}08`, border:`1px solid ${s.color}20`,
                        borderRadius:'16px', padding:'16px 12px', textAlign:'center'
                      }}>
                        <div style={{ fontSize:'1.3rem', marginBottom:'6px' }}>{s.icon}</div>
                        <div style={{ color:s.color, fontFamily:"'Clash Display',sans-serif", fontSize:'1.3rem', fontWeight:800 }}>
                          {s.val}<span style={{ fontSize:'0.65rem', fontWeight:400 }}> {s.unit}</span>
                        </div>
                        <div style={{ color:'#6B7280', fontSize:'0.68rem', marginTop:'2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sample day */}
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", color:'white', fontSize:'1.1rem', marginBottom:'16px' }}>
                    📅 Sample Monday Plan
                  </h3>
                  {(selectedPlan.meals?.Monday || []).map((meal, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity:0, x:-15 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay:i*0.06 }}
                      style={{
                        display:'flex', alignItems:'center', gap:'14px',
                        padding:'14px 18px', marginBottom:'8px',
                        background:'rgba(255,255,255,0.03)',
                        borderRadius:'14px', border:'1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <span style={{ color:selectedPlan.color, fontSize:'0.78rem', fontWeight:700, minWidth:'60px' }}>{meal.time}</span>
                      <span style={{ fontSize:'1.4rem' }}>{meal.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'#F0F0FF', fontSize:'0.9rem', fontWeight:600 }}>{meal.name}</div>
                        <div style={{ color:'#6B7280', fontSize:'0.75rem' }}>{meal.type} · Prep {meal.prep} min</div>
                      </div>
                      <div style={{ display:'flex', gap:'16px', textAlign:'center' }}>
                        {[
                          { l:'kcal', v:meal.cal, c:selectedPlan.color },
                          { l:'P',    v:`${meal.p}g`, c:'#00FF87' },
                          { l:'C',    v:`${meal.c}g`, c:'#7B61FF' },
                          { l:'F',    v:`${meal.f}g`, c:'#FF6B35' },
                        ].map(m => (
                          <div key={m.l}>
                            <div style={{ color:m.c, fontWeight:700, fontSize:'0.82rem' }}>{m.v}</div>
                            <div style={{ color:'#4B5563', fontSize:'0.62rem' }}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  {/* CTAs */}
                  <div style={{ display:'flex', gap:'12px', marginTop:'28px' }}>
                    <motion.button
                      whileHover={{ scale:1.03, boxShadow:`0 12px 40px ${selectedPlan.glow}` }}
                      whileTap={{ scale:0.97 }}
                      onClick={() => { setActivePlanView(selectedPlan); setActiveTab('daily'); setSelectedPlan(null) }}
                      style={{
                        flex:1, padding:'16px',
                        background:`linear-gradient(135deg,${selectedPlan.color},${selectedPlan.color}80)`,
                        border:'none', borderRadius:'16px',
                        color:'#000', fontWeight:900, cursor:'pointer',
                        fontSize:'1rem', fontFamily:"'Clash Display',sans-serif",
                        boxShadow:`0 4px 24px ${selectedPlan.glow}` 
                      }}>🚀 Start This Plan</motion.button>
                    <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{
                      padding:'16px 24px',
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:'16px', color:'#9CA3AF',
                      cursor:'pointer', fontSize:'0.9rem'
                    }}>📊 View Macros</motion.button>
                    <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{
                      padding:'16px 24px',
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:'16px', color:'#9CA3AF',
                      cursor:'pointer', fontSize:'0.9rem'
                    }}>🔖 Save Plan</motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
