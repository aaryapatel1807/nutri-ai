// ─── NutriAI curated food database ──────────────────────────────────────────
// Offline-first, hand-verified macro values (kcal / protein / carbs / fat) per
// common serving. Indian + global coverage. Inspired by the data models of
// OpenFoodFacts (open product data), USDA FoodData Central (per-100g reference
// values) and the UX of top open-source trackers surveyed overnight — but every
// value here is curated in-repo so the meal logger works with zero network.
//
// Each entry: { name, emoji, kcal, p, c, f, serving, cat, tags }
//   kcal/p/c/f  → macros for ONE `serving`
//   cat         → category used for grouping
//   tags        → extra search keywords (singular/plural, hindi names, etc.)

export const CATEGORIES = [
  'Indian Staples', 'Indian Curries & Dals', 'Indian Snacks', 'Breakfast',
  'Fruits', 'Vegetables', 'Protein', 'Dairy & Eggs', 'Grains & Carbs',
  'Fast Food', 'Desserts', 'Beverages', 'Nuts & Seeds',
]

const F = (name, emoji, kcal, p, c, f, serving, cat, tags = []) => ({
  name, emoji, kcal, p, c, f, serving, cat, tags,
})

export const FOODS = [
  // ── Indian Staples ─────────────────────────────────────────────────────────
  F('Roti (2 pieces)', '🫓', 180, 5, 36, 2, '2 rotis', 'Indian Staples', ['chapati', 'phulka', 'wheat']),
  F('Jeera Rice (1 bowl)', '🍚', 205, 4, 44, 1, '1 bowl', 'Indian Staples', ['cumin rice', 'chawal']),
  F('Dal Rice (1 plate)', '🍛', 380, 14, 72, 4, '1 plate', 'Indian Staples', ['dal chawal', 'lentil rice']),
  F('Rajma Chawal (1 plate)', '🍲', 420, 16, 78, 5, '1 plate', 'Indian Staples', ['kidney beans', 'rajma']),
  F('Chole Bhature', '🫓', 550, 16, 78, 18, '1 plate', 'Indian Staples', ['chickpea', 'chana']),
  F('Biryani - Chicken (1 plate)', '🍗', 620, 32, 68, 22, '1 plate', 'Indian Staples', ['biryani']),
  F('Biryani - Veg (1 plate)', '🥘', 480, 12, 82, 12, '1 plate', 'Indian Staples', ['biryani']),
  F('Khichdi (1 bowl)', '🍲', 280, 10, 52, 4, '1 bowl', 'Indian Staples', ['dal khichdi', 'lentil']),
  F('Idli (2 pieces)', '🍘', 120, 4, 26, 1, '2 idlis', 'Indian Staples', ['idly']),
  F('Dosa - Plain (1)', '🥞', 170, 4, 34, 3, '1 dosa', 'Indian Staples', ['dosai']),
  F('Dosa - Masala (1)', '🥞', 320, 8, 52, 9, '1 dosa', 'Indian Staples', ['masala dosa']),
  F('Upma (1 bowl)', '🥣', 250, 7, 48, 5, '1 bowl', 'Indian Staples', ['rava', 'sooji']),
  F('Poha (1 bowl)', '🍚', 220, 5, 44, 3, '1 bowl', 'Indian Staples', ['flattened rice']),
  F('Paratha - Aloo (2)', '🫓', 340, 8, 58, 9, '2 parathas', 'Indian Staples', ['potato paratha']),
  F('Paratha - Paneer (2)', '🫓', 380, 14, 52, 12, '2 parathas', 'Indian Staples', []),
  F('Naan - Butter (2)', '🫓', 320, 8, 56, 8, '2 naans', 'Indian Staples', []),
  F('Pulao - Veg (1 bowl)', '🍚', 310, 7, 58, 6, '1 bowl', 'Indian Staples', ['pilaf']),
  F('Curd Rice (1 bowl)', '🍚', 240, 8, 44, 4, '1 bowl', 'Indian Staples', ['yogurt rice', 'dahi']),
  F('Lemon Rice (1 bowl)', '🍋', 260, 5, 52, 4, '1 bowl', 'Indian Staples', []),
  F('Ven Pongal (1 bowl)', '🍲', 290, 9, 54, 5, '1 bowl', 'Indian Staples', ['pongal']),

  // ── Indian Curries & Dals ──────────────────────────────────────────────────
  F('Dal Tadka (1 bowl)', '🍲', 180, 9, 24, 6, '1 bowl', 'Indian Curries & Dals', ['lentil', 'dal fry']),
  F('Dal Makhani (1 bowl)', '🍲', 320, 12, 22, 18, '1 bowl', 'Indian Curries & Dals', ['black dal']),
  F('Paneer Butter Masala (1 bowl)', '🧀', 380, 16, 14, 28, '1 bowl', 'Indian Curries & Dals', ['paneer']),
  F('Paneer Tikka (100g)', '🧀', 265, 18, 8, 18, '100g', 'Indian Curries & Dals', ['paneer']),
  F('Palak Paneer (1 bowl)', '🥬', 280, 14, 12, 20, '1 bowl', 'Indian Curries & Dals', ['spinach paneer']),
  F('Chicken Curry (1 bowl)', '🍗', 320, 28, 8, 18, '1 bowl', 'Indian Curries & Dals', ['murgh']),
  F('Butter Chicken (1 bowl)', '🍗', 420, 26, 10, 30, '1 bowl', 'Indian Curries & Dals', ['murgh makhani']),
  F('Egg Curry (1 bowl)', '🍳', 280, 16, 10, 20, '1 bowl', 'Indian Curries & Dals', ['anda curry']),
  F('Fish Curry (1 bowl)', '🐟', 260, 26, 8, 14, '1 bowl', 'Indian Curries & Dals', ['meen curry']),
  F('Mutton Rogan Josh (1 bowl)', '🍖', 380, 28, 8, 26, '1 bowl', 'Indian Curries & Dals', ['lamb curry']),
  F('Sambar (1 bowl)', '🍲', 140, 6, 22, 4, '1 bowl', 'Indian Curries & Dals', ['sambhar']),
  F('Rasam (1 bowl)', '🍲', 80, 3, 14, 2, '1 bowl', 'Indian Curries & Dals', []),
  F('Aloo Gobi (1 bowl)', '🥔', 180, 5, 28, 7, '1 bowl', 'Indian Curries & Dals', ['potato cauliflower']),
  F('Baingan Bharta (1 bowl)', '🍆', 160, 4, 18, 9, '1 bowl', 'Indian Curries & Dals', ['eggplant']),
  F('Chana Masala (1 bowl)', '🫘', 260, 12, 36, 8, '1 bowl', 'Indian Curries & Dals', ['chickpea curry']),
  F('Malai Kofta (1 bowl)', '🧆', 340, 10, 20, 26, '1 bowl', 'Indian Curries & Dals', []),
  F('Kadai Veg (1 bowl)', '🫑', 220, 7, 20, 13, '1 bowl', 'Indian Curries & Dals', []),

  // ── Indian Snacks ──────────────────────────────────────────────────────────
  F('Samosa (1)', '🥟', 260, 5, 28, 14, '1 samosa', 'Indian Snacks', []),
  F('Vada Pav (1)', '🍔', 320, 8, 44, 12, '1 vada pav', 'Indian Snacks', []),
  F('Pani Puri (6 pcs)', '🫧', 180, 4, 34, 4, '6 puris', 'Indian Snacks', ['golgappa', 'puchka']),
  F('Bhel Puri (1 plate)', '🥗', 220, 5, 42, 5, '1 plate', 'Indian Snacks', []),
  F('Dahi Puri (6 pcs)', '🫧', 240, 6, 36, 8, '6 puris', 'Indian Snacks', []),
  F('Pakora - Veg (6 pcs)', '🍤', 280, 6, 24, 18, '6 pakoras', 'Indian Snacks', ['fritters', 'bhaji']),
  F('Dhokla (2 pcs)', '🍰', 160, 6, 30, 3, '2 pieces', 'Indian Snacks', []),
  F('Kachori (1)', '🥟', 220, 5, 26, 11, '1 kachori', 'Indian Snacks', []),
  F('Pav Bhaji (1 plate)', '🍛', 420, 10, 58, 16, '1 plate', 'Indian Snacks', []),
  F('Misal Pav', '🍛', 380, 14, 52, 12, '1 plate', 'Indian Snacks', []),
  F('Cutting Chai + Biscuits', '🍵', 120, 2, 18, 4, '1 cutting', 'Indian Snacks', ['tea']),

  // ── Breakfast ──────────────────────────────────────────────────────────────
  F('Oatmeal with Banana', '🥣', 320, 12, 58, 6, '1 bowl', 'Breakfast', ['oats', 'porridge']),
  F('Protein Oatmeal Bowl', '🥣', 480, 35, 58, 10, '1 bowl', 'Breakfast', ['oats', 'whey']),
  F('Egg Bhurji (2 eggs)', '🍳', 210, 14, 4, 15, '2 eggs', 'Breakfast', ['scrambled eggs', 'anda']),
  F('Boiled Eggs (3)', '🥚', 210, 18, 2, 14, '3 eggs', 'Breakfast', []),
  F('Omelette - Veg (2 eggs)', '🍳', 240, 15, 6, 17, '1 omelette', 'Breakfast', []),
  F('Greek Yogurt Parfait', '🥛', 240, 24, 22, 6, '1 bowl', 'Breakfast', ['yogurt']),
  F('Pancakes (3)', '🥞', 350, 8, 62, 8, '3 pancakes', 'Breakfast', []),
  F('Avocado Toast (2)', '🥑', 320, 10, 34, 18, '2 slices', 'Breakfast', []),
  F('Smoothie Bowl', '🍓', 280, 10, 52, 6, '1 bowl', 'Breakfast', ['acai']),
  F('Cornflakes with Milk', '🥣', 220, 7, 42, 3, '1 bowl', 'Breakfast', []),
  F('Peanut Butter Toast (2)', '🥜', 340, 12, 32, 18, '2 slices', 'Breakfast', []),
  F('Muesli with Milk', '🥣', 300, 10, 52, 7, '1 bowl', 'Breakfast', []),

  // ── Fruits ─────────────────────────────────────────────────────────────────
  F('Banana', '🍌', 89, 1, 23, 0, '1 medium', 'Fruits', []),
  F('Apple', '🍎', 95, 1, 25, 0, '1 medium', 'Fruits', []),
  F('Orange', '🍊', 62, 1, 15, 0, '1 medium', 'Fruits', []),
  F('Mango (1 cup)', '🥭', 100, 1, 25, 1, '1 cup', 'Fruits', ['aam']),
  F('Mixed Fruit Bowl', '🍱', 120, 2, 28, 1, '1 bowl', 'Fruits', []),
  F('Papaya (1 cup)', '🧡', 62, 1, 16, 0, '1 cup', 'Fruits', []),
  F('Watermelon (1 cup)', '🍉', 46, 1, 11, 0, '1 cup', 'Fruits', ['tarbooz']),
  F('Grapes (1 cup)', '🍇', 104, 1, 27, 0, '1 cup', 'Fruits', ['angoor']),
  F('Pomegranate (1 cup)', '🔴', 144, 3, 33, 2, '1 cup', 'Fruits', ['anar']),
  F('Guava', '🍈', 68, 3, 14, 1, '1 medium', 'Fruits', ['amrood']),
  F('Pineapple (1 cup)', '🍍', 82, 1, 22, 0, '1 cup', 'Fruits', ['ananas']),
  F('Dates (4)', '🌴', 270, 2, 72, 0, '4 dates', 'Fruits', ['khajoor']),

  // ── Vegetables ─────────────────────────────────────────────────────────────
  F('Mixed Veg Salad', '🥗', 120, 4, 18, 5, '1 bowl', 'Vegetables', ['salad']),
  F('Grilled Veggies', '🥦', 150, 5, 20, 7, '1 plate', 'Vegetables', []),
  F('Sweet Potato (1)', '🍠', 130, 2, 30, 0, '1 medium', 'Vegetables', ['shakarkandi']),
  F('Boiled Corn (1)', '🌽', 130, 4, 28, 2, '1 cob', 'Vegetables', ['bhutta', 'makka']),

  // ── Protein ────────────────────────────────────────────────────────────────
  F('Grilled Chicken Breast', '🍗', 165, 31, 0, 4, '100g', 'Protein', ['chicken']),
  F('Chicken Tikka (100g)', '🍗', 180, 28, 3, 6, '100g', 'Protein', []),
  F('Tandoori Chicken (leg)', '🍗', 280, 32, 2, 14, '1 leg piece', 'Protein', []),
  F('Grilled Fish (100g)', '🐟', 150, 28, 0, 4, '100g', 'Protein', ['fish', 'pomfret']),
  F('Prawns Curry (1 bowl)', '🍤', 240, 30, 8, 10, '1 bowl', 'Protein', ['shrimp', 'jhinga']),
  F('Tofu Stir Fry (1 bowl)', '🍲', 220, 16, 12, 12, '1 bowl', 'Protein', []),
  F('Soya Chaap (100g)', '🍢', 200, 22, 8, 9, '100g', 'Protein', ['soy']),
  F('Protein Shake', '🥤', 150, 25, 8, 3, '1 scoop', 'Protein', ['whey']),
  F('Whey + Milk Shake', '🥤', 280, 32, 18, 8, '1 glass', 'Protein', []),

  // ── Dairy & Eggs ───────────────────────────────────────────────────────────
  F('Greek Yogurt', '🥛', 100, 17, 6, 1, '170g cup', 'Dairy & Eggs', ['dahi']),
  F('Curd (1 bowl)', '🥛', 120, 7, 9, 5, '1 bowl', 'Dairy & Eggs', ['dahi', 'yogurt']),
  F('Paneer (100g)', '🧀', 265, 18, 4, 21, '100g', 'Dairy & Eggs', ['cottage cheese']),
  F('Milk - Whole (1 glass)', '🥛', 150, 8, 12, 8, '250ml', 'Dairy & Eggs', ['doodh']),
  F('Milk - Toned (1 glass)', '🥛', 110, 8, 12, 3, '250ml', 'Dairy & Eggs', ['doodh']),
  F('Buttermilk (1 glass)', '🥛', 60, 3, 8, 2, '250ml', 'Dairy & Eggs', ['chaas', 'moru']),
  F('Cheese Slice (1)', '🧀', 110, 7, 1, 9, '1 slice', 'Dairy & Eggs', []),
  F('Lassi - Sweet (1 glass)', '🥛', 220, 8, 32, 7, '250ml', 'Dairy & Eggs', []),
  F('Cottage Cheese Bowl', '🧀', 220, 26, 8, 11, '200g', 'Dairy & Eggs', []),

  // ── Grains & Carbs ─────────────────────────────────────────────────────────
  F('White Rice (1 bowl)', '🍚', 205, 4, 45, 0, '1 bowl', 'Grains & Carbs', ['chawal']),
  F('Brown Rice (1 bowl)', '🍚', 215, 5, 45, 2, '1 bowl', 'Grains & Carbs', []),
  F('Whole Wheat Pasta (1 bowl)', '🍝', 220, 8, 44, 1, '1 bowl', 'Grains & Carbs', []),
  F('Noodles - Hakka (1 bowl)', '🍜', 320, 8, 58, 8, '1 bowl', 'Grains & Carbs', ['chowmein']),
  F('Bread - Whole Wheat (2)', '🍞', 160, 6, 28, 2, '2 slices', 'Grains & Carbs', []),
  F('Quinoa Bowl', '🥗', 220, 8, 40, 4, '1 bowl', 'Grains & Carbs', []),
  F('Oats - Plain (40g)', '🥣', 150, 5, 27, 3, '40g', 'Grains & Carbs', []),

  // ── Fast Food ──────────────────────────────────────────────────────────────
  F('Veg Burger', '🍔', 380, 12, 48, 15, '1 burger', 'Fast Food', []),
  F('Chicken Burger', '🍔', 480, 26, 42, 20, '1 burger', 'Fast Food', []),
  F('Margherita Pizza (2 slices)', '🍕', 480, 18, 58, 18, '2 slices', 'Fast Food', []),
  F('French Fries (medium)', '🍟', 380, 5, 48, 19, '1 medium', 'Fast Food', []),
  F('Chicken Momos (6)', '🥟', 300, 16, 36, 10, '6 momos', 'Fast Food', ['dumplings']),
  F('Veg Momos (6)', '🥟', 240, 8, 40, 6, '6 momos', 'Fast Food', ['dumplings']),
  F('Fried Chicken (2 pcs)', '🍗', 420, 32, 16, 24, '2 pieces', 'Fast Food', []),
  F('Tacos - Chicken (2)', '🌮', 380, 24, 32, 16, '2 tacos', 'Fast Food', []),
  F('Sandwich - Club', '🥪', 420, 22, 42, 16, '1 sandwich', 'Fast Food', []),
  F('Roll - Chicken Kathi', '🌯', 450, 26, 48, 16, '1 roll', 'Fast Food', ['frankie', 'wrap']),
  F('Roll - Paneer Tikka', '🌯', 420, 18, 50, 16, '1 roll', 'Fast Food', ['frankie', 'wrap']),

  // ── Desserts ───────────────────────────────────────────────────────────────
  F('Gulab Jamun (2)', '🍮', 280, 4, 48, 8, '2 pieces', 'Desserts', []),
  F('Rasmalai (2)', '🍮', 260, 8, 36, 10, '2 pieces', 'Desserts', []),
  F('Jalebi (100g)', '🥨', 380, 3, 78, 12, '100g', 'Desserts', []),
  F('Kulfi (1)', '🍨', 220, 6, 30, 9, '1 kulfi', 'Desserts', []),
  F('Ice Cream - Vanilla (1 scoop)', '🍨', 140, 2, 18, 7, '1 scoop', 'Desserts', []),
  F('Chocolate Cake (1 slice)', '🍰', 320, 4, 44, 15, '1 slice', 'Desserts', []),
  F('Brownie (1)', '🍫', 280, 4, 38, 18, '1 piece', 'Desserts', []),
  F('Kheer (1 bowl)', '🍮', 240, 7, 38, 8, '1 bowl', 'Desserts', ['rice pudding', 'payasam']),
  F('Rasgulla (2)', '🍮', 200, 5, 40, 4, '2 pieces', 'Desserts', []),
  F('Donut (1)', '🍩', 260, 3, 32, 14, '1 donut', 'Desserts', []),

  // ── Beverages ──────────────────────────────────────────────────────────────
  F('Masala Chai (1 cup)', '🍵', 80, 3, 12, 3, '1 cup', 'Beverages', ['tea']),
  F('Filter Coffee (1 cup)', '☕', 60, 3, 8, 2, '1 cup', 'Beverages', ['kaapi']),
  F('Cold Coffee', '🥤', 220, 7, 32, 8, '1 glass', 'Beverages', []),
  F('Fresh Lime Soda', '🍋', 90, 0, 24, 0, '1 glass', 'Beverages', ['nimbu']),
  F('Mango Lassi', '🥭', 260, 8, 44, 7, '1 glass', 'Beverages', []),
  F('Coconut Water', '🥥', 45, 1, 9, 0, '1 glass', 'Beverages', ['nariyal']),
  F('Orange Juice - Fresh', '🍊', 110, 2, 26, 0, '1 glass', 'Beverages', []),
  F('Protein Smoothie', '🥤', 280, 28, 32, 5, '1 glass', 'Beverages', []),
  F('Soft Drink (330ml)', '🥤', 140, 0, 35, 0, '1 can', 'Beverages', ['cola', 'soda']),
  F('Milkshake - Chocolate', '🥤', 380, 10, 58, 12, '1 glass', 'Beverages', []),

  // ── Nuts & Seeds ───────────────────────────────────────────────────────────
  F('Almonds (30g)', '🥜', 174, 6, 6, 15, '30g handful', 'Nuts & Seeds', ['badam']),
  F('Peanuts (30g)', '🥜', 170, 8, 5, 14, '30g handful', 'Nuts & Seeds', ['moongphali']),
  F('Walnuts (30g)', '🥜', 195, 5, 4, 18, '30g handful', 'Nuts & Seeds', ['akhrot']),
  F('Cashews (30g)', '🥜', 165, 5, 9, 13, '30g handful', 'Nuts & Seeds', ['kaju']),
  F('Mixed Trail Mix (40g)', '🥜', 180, 5, 12, 14, '40g handful', 'Nuts & Seeds', []),
  F('Chia Seeds (1 tbsp)', '🌱', 60, 2, 5, 4, '1 tbsp', 'Nuts & Seeds', []),
  F('Flaxseeds (1 tbsp)', '🌱', 55, 2, 3, 4, '1 tbsp', 'Nuts & Seeds', ['alsi']),
  F('Roasted Makhana (30g)', '🍿', 110, 4, 22, 1, '30g bowl', 'Nuts & Seeds', ['fox nuts', 'lotus seeds']),
]

// ─── Search ───────────────────────────────────────────────────────────────────
// Token-based scoring: exact > prefix > substring > tag match. Returns matches
// sorted by relevance. Empty query → all foods grouped by category order.

function scoreFood(food, tokens) {
  const name = food.name.toLowerCase()
  const tagStr = food.tags.join(' ').toLowerCase()
  const cat = food.cat.toLowerCase()
  let score = 0
  for (const t of tokens) {
    if (!t) continue
    if (name === t) score += 100
    else if (name.startsWith(t)) score += 40
    else if (name.split(/[\s\-()]+/).some((w) => w.startsWith(t))) score += 30
    else if (name.includes(t)) score += 20
    else if (tagStr.split(' ').some((w) => w === t || w.startsWith(t))) score += 25
    else if (tagStr.includes(t)) score += 10
    else if (cat.includes(t)) score += 5
    else return -1 // every token must match somewhere
  }
  return score
}

export function searchFoods(query, limit = 60) {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) {
    // Default view: everything in category order
    return FOODS.slice(0, limit)
  }
  return FOODS.map((f) => ({ food: f, s: scoreFood(f, tokens) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.food)
}

/** Scale a food's macros by a portion factor (e.g. 0.5, 1.5, 2). */
export function scaleFood(food, factor) {
  const f = Number(factor) || 1
  const round = (n) => Math.round(n * f * 10) / 10
  return { ...food, kcal: Math.round(food.kcal * f), p: round(food.p), c: round(food.c), f: round(food.f) }
}

// ─── Recents & favorites (localStorage) ───────────────────────────────────────

const RECENTS_KEY = 'nutriai_recent_foods'
const FAVS_KEY = 'nutriai_fav_foods'
const MAX_RECENTS = 12

function readList(key) {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}
function writeList(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)) } catch { /* private mode */ }
}

/** Names of recently logged foods, most-recent first. */
export function getRecentFoods() {
  const names = readList(RECENTS_KEY)
  const byName = new Map(FOODS.map((f) => [f.name, f]))
  return names.map((n) => byName.get(n)).filter(Boolean)
}

export function addRecentFood(name) {
  const names = readList(RECENTS_KEY).filter((n) => n !== name)
  names.unshift(name)
  writeList(RECENTS_KEY, names.slice(0, MAX_RECENTS))
}

export function getFavoriteFoods() {
  const names = new Set(readList(FAVS_KEY))
  return FOODS.filter((f) => names.has(f.name))
}

export function isFavorite(name) {
  return readList(FAVS_KEY).includes(name)
}

export function toggleFavorite(name) {
  const names = readList(FAVS_KEY)
  const next = names.includes(name) ? names.filter((n) => n !== name) : [...names, name]
  writeList(FAVS_KEY, next)
  return next.includes(name)
}
