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

  // ── Regional Indian additions (batch 2) ──────────────────────────────────────
  // ── Indian Staples (regional) ───────────────────────────────────────────────
  F('Thepla - Methi (2)', '🫓', 220, 6, 40, 6, '2 theplas', 'Indian Staples', ['gujarati', 'methi', 'fenugreek']),
  F('Makki di Roti (2) + Sarson da Saag', '🌽', 460, 13, 66, 15, '1 plate', 'Indian Staples', ['punjabi', 'corn', 'mustard greens']),
  F('Amritsari Kulcha (2)', '🫓', 380, 10, 68, 10, '2 kulchas', 'Indian Staples', ['punjabi', 'kulcha']),
  F('Dal Dhokli (1 bowl)', '🍲', 320, 12, 58, 6, '1 bowl', 'Indian Staples', ['gujarati', 'wheat']),
  F('Rava Dosa (1)', '🥞', 290, 6, 52, 8, '1 dosa', 'Indian Staples', ['semolina']),
  F('Neer Dosa (2)', '🥞', 180, 4, 38, 2, '2 dosas', 'Indian Staples', ['mangalore', 'karnataka']),
  F('Appam (2)', '🥞', 200, 4, 42, 3, '2 appams', 'Indian Staples', ['kerala', 'hopper']),
  F('Puttu (1 cup)', '🍚', 220, 5, 46, 3, '1 cup', 'Indian Staples', ['kerala', 'steamed rice']),
  F('Ragi Mudde (2)', '🟤', 240, 7, 52, 2, '2 mudde', 'Indian Staples', ['karnataka', 'finger millet']),
  F('Bisi Bele Bath (1 bowl)', '🍲', 340, 11, 60, 7, '1 bowl', 'Indian Staples', ['karnataka', 'sambar rice']),
  F('Pesarattu (1)', '🥞', 230, 12, 36, 5, '1 pesarattu', 'Indian Staples', ['andhra', 'moong dosa']),
  F('Adai (1)', '🥞', 250, 10, 42, 6, '1 adai', 'Indian Staples', ['tamil', 'lentil dosa']),
  F('Sabudana Khichdi (1 bowl)', '🍚', 380, 4, 78, 8, '1 bowl', 'Indian Staples', ['maharashtrian', 'sago', 'vrat']),
  F('Thalipeeth (2)', '🫓', 280, 9, 50, 6, '2 thalipeeth', 'Indian Staples', ['maharashtrian', 'multigrain']),
  F('Luchi (4)', '🫓', 340, 8, 60, 9, '4 luchis', 'Indian Staples', ['bengali', 'puri']),
  F('Handvo (1 slice)', '🍰', 210, 7, 32, 7, '1 slice', 'Indian Staples', ['gujarati', 'baked lentil']),
  F('Khakra (4)', '🫓', 240, 7, 42, 6, '4 khakras', 'Indian Staples', ['gujarati', 'crispy']),
  F('Fafda (100g)', '🥨', 440, 10, 42, 26, '100g', 'Indian Staples', ['gujarati', 'besan']),
  F('Dal Baati Churma (1 plate)', '🍛', 550, 14, 82, 18, '1 plate', 'Indian Staples', ['rajasthani']),
  F('Kothu Parotta (1 plate)', '🫓', 480, 14, 66, 16, '1 plate', 'Indian Staples', ['tamil', 'parotta']),
  F('Malabar Parotta (2)', '🫓', 400, 9, 64, 13, '2 parottas', 'Indian Staples', ['kerala', 'flaky']),
  F('Rumali Roti (2)', '🫓', 200, 6, 42, 2, '2 rotis', 'Indian Staples', ['soft', 'thin']),
  F('Tandoori Roti (2)', '🫓', 190, 6, 40, 2, '2 rotis', 'Indian Staples', []),
  F('Jolada Roti (2)', '🫓', 220, 7, 46, 3, '2 rotis', 'Indian Staples', ['karnataka', 'jowar', 'sorghum']),
  F('Kori Rotti (1 plate)', '🍗', 480, 22, 58, 16, '1 plate', 'Indian Staples', ['mangalore', 'chicken curry']),
  F('Set Dosa (2)', '🥞', 240, 6, 48, 4, '2 dosas', 'Indian Staples', ['karnataka', 'spongy']),
  F('Thatte Idli (1)', '🍘', 160, 5, 34, 2, '1 idli', 'Indian Staples', ['karnataka', 'plate idli']),
  F('Ragi Sangati (2)', '🟤', 220, 6, 48, 2, '2 balls', 'Indian Staples', ['andhra', 'ragi']),
  F('Jhunka Bhakar (1 plate)', '🫓', 420, 14, 62, 12, '1 plate', 'Indian Staples', ['maharashtrian', 'besan']),
  F('Vangi Bath (1 bowl)', '🍆', 300, 7, 56, 7, '1 bowl', 'Indian Staples', ['karnataka', 'brinjal rice']),

  // ── Indian Curries & Dals (regional) ────────────────────────────────────────
  F('Sarson da Saag (1 bowl)', '🥬', 220, 8, 18, 14, '1 bowl', 'Indian Curries & Dals', ['punjabi', 'mustard greens']),
  F('Gatte ki Sabzi (1 bowl)', '🍲', 280, 10, 26, 14, '1 bowl', 'Indian Curries & Dals', ['rajasthani', 'besan']),
  F('Laal Maas (1 bowl)', '🍖', 400, 28, 8, 28, '1 bowl', 'Indian Curries & Dals', ['rajasthani', 'mutton']),
  F('Macher Jhol (1 bowl)', '🐟', 240, 24, 8, 12, '1 bowl', 'Indian Curries & Dals', ['bengali', 'fish curry']),
  F('Aloo Posto (1 bowl)', '🥔', 220, 6, 28, 10, '1 bowl', 'Indian Curries & Dals', ['bengali', 'poppy seeds']),
  F('Ilish Bhapa (1 pc)', '🐟', 280, 24, 2, 18, '1 piece', 'Indian Curries & Dals', ['bengali', 'hilsa', 'mustard']),
  F('Begun Bhaja (4 pcs)', '🍆', 180, 3, 16, 12, '4 pieces', 'Indian Curries & Dals', ['bengali', 'fried eggplant']),
  F('Cholar Dal (1 bowl)', '🍲', 260, 11, 40, 7, '1 bowl', 'Indian Curries & Dals', ['bengali', 'chana dal', 'coconut']),
  F('Avial (1 bowl)', '🥗', 180, 5, 20, 10, '1 bowl', 'Indian Curries & Dals', ['kerala', 'mixed veg', 'coconut']),
  F('Cabbage Thoran (1 bowl)', '🥬', 140, 4, 14, 8, '1 bowl', 'Indian Curries & Dals', ['kerala', 'coconut']),
  F('Olan (1 bowl)', '🍲', 160, 4, 16, 10, '1 bowl', 'Indian Curries & Dals', ['kerala', 'ash gourd']),
  F('Kootu (1 bowl)', '🍲', 180, 8, 28, 5, '1 bowl', 'Indian Curries & Dals', ['tamil', 'lentil veg']),
  F('Goan Fish Curry (1 bowl)', '🐟', 280, 26, 8, 15, '1 bowl', 'Indian Curries & Dals', ['goan', 'coconut']),
  F('Pork Vindaloo (1 bowl)', '🍖', 420, 26, 10, 30, '1 bowl', 'Indian Curries & Dals', ['goan', 'pork']),
  F('Chicken Xacuti (1 bowl)', '🍗', 380, 28, 10, 26, '1 bowl', 'Indian Curries & Dals', ['goan']),
  F('Haleem (1 bowl)', '🍲', 380, 24, 38, 12, '1 bowl', 'Indian Curries & Dals', ['hyderabadi', 'ramadan']),
  F('Mirchi ka Salan (1 bowl)', '🌶️', 200, 5, 14, 14, '1 bowl', 'Indian Curries & Dals', ['hyderabadi', 'peanut']),
  F('Dum Aloo (1 bowl)', '🥔', 260, 6, 32, 12, '1 bowl', 'Indian Curries & Dals', ['kashmiri', 'potato']),
  F('Mutton Yakhni (1 bowl)', '🍖', 320, 26, 6, 20, '1 bowl', 'Indian Curries & Dals', ['kashmiri', 'yogurt']),
  F('Thukpa (1 bowl)', '🍜', 320, 14, 52, 6, '1 bowl', 'Indian Curries & Dals', ['tibetan', 'noodle soup']),
  F('Undhiyu (1 bowl)', '🥗', 300, 9, 38, 12, '1 bowl', 'Indian Curries & Dals', ['gujarati', 'winter veg']),
  F('Gujarati Kadhi (1 bowl)', '🍲', 140, 6, 18, 5, '1 bowl', 'Indian Curries & Dals', ['gujarati', 'sweet kadhi']),
  F('Shahi Paneer (1 bowl)', '🧀', 360, 15, 14, 26, '1 bowl', 'Indian Curries & Dals', ['paneer', 'mughlai']),
  F('Mushroom Masala (1 bowl)', '🍄', 200, 7, 14, 13, '1 bowl', 'Indian Curries & Dals', []),
  F('Keema Matar (1 bowl)', '🍖', 340, 24, 12, 22, '1 bowl', 'Indian Curries & Dals', ['mince', 'peas']),
  F('Sai Bhaji (1 bowl)', '🥬', 160, 7, 22, 5, '1 bowl', 'Indian Curries & Dals', ['sindhi', 'dal palak']),
  F('Poriyal - Beans (1 bowl)', '🫛', 130, 4, 14, 7, '1 bowl', 'Indian Curries & Dals', ['tamil', 'stir fry']),
  F('Pithla (1 bowl)', '🍲', 220, 10, 28, 8, '1 bowl', 'Indian Curries & Dals', ['maharashtrian', 'besan']),
  F('Bharli Vangi (1 bowl)', '🍆', 240, 7, 30, 11, '1 bowl', 'Indian Curries & Dals', ['maharashtrian', 'stuffed brinjal']),
  F('Dalma (1 bowl)', '🍲', 200, 9, 34, 4, '1 bowl', 'Indian Curries & Dals', ['odisha', 'dal veg']),
  F('Posto Bora (4)', '🟤', 220, 6, 22, 12, '4 boras', 'Indian Curries & Dals', ['bengali', 'poppy seed fritters']),
  F('Meen Moilee (1 bowl)', '🐟', 300, 26, 8, 17, '1 bowl', 'Indian Curries & Dals', ['kerala', 'fish molee']),

  // ── Indian Snacks (regional) ────────────────────────────────────────────────
  F('Khandvi (4 pcs)', '🟡', 140, 6, 18, 5, '4 pieces', 'Indian Snacks', ['gujarati']),
  F('Dabeli (1)', '🍔', 280, 7, 46, 9, '1 dabeli', 'Indian Snacks', ['kutchi', 'pav']),
  F('Ragda Pattice (1 plate)', '🍛', 380, 12, 62, 10, '1 plate', 'Indian Snacks', ['mumbai', 'chaat']),
  F('Aloo Tikki (2)', '🥔', 260, 5, 44, 9, '2 tikkis', 'Indian Snacks', ['chaat']),
  F('Chole Tikki (1 plate)', '🍛', 400, 13, 60, 12, '1 plate', 'Indian Snacks', ['chaat']),
  F('Jhalmuri (1 plate)', '🍿', 200, 5, 38, 5, '1 plate', 'Indian Snacks', ['bengali', 'puffed rice']),
  F('Chicken Frankie (1)', '🌯', 420, 18, 48, 16, '1 frankie', 'Indian Snacks', ['mumbai', 'roll']),
  F('Egg Roll (1)', '🌯', 380, 14, 44, 15, '1 roll', 'Indian Snacks', ['kolkata', 'kathi']),
  F('Veg Manchurian (1 plate)', '🥘', 320, 8, 48, 10, '1 plate', 'Indian Snacks', ['indo-chinese']),
  F('Chilli Paneer (1 plate)', '🧀', 340, 18, 22, 20, '1 plate', 'Indian Snacks', ['indo-chinese']),
  F('Chakli (50g)', '🥨', 240, 5, 32, 11, '50g', 'Indian Snacks', ['murukku']),
  F('Murukku (50g)', '🥨', 230, 5, 30, 11, '50g', 'Indian Snacks', ['tamil', 'chakli']),
  F('Mathri (4)', '🍪', 250, 6, 32, 12, '4 mathris', 'Indian Snacks', ['namkeen']),
  F('Namak Pare (50g)', '🍪', 230, 6, 34, 8, '50g', 'Indian Snacks', []),
  F('Banana Chips (50g)', '🍌', 260, 2, 30, 15, '50g', 'Indian Snacks', ['kerala']),
  F('Mixture (50g)', '🥜', 250, 7, 30, 12, '50g', 'Indian Snacks', ['namkeen']),
  F('Mysore Bonda (4)', '🍩', 280, 6, 34, 14, '4 bondas', 'Indian Snacks', ['karnataka']),
  F('Medu Vada (2)', '🍩', 320, 9, 34, 14, '2 vadas', 'Indian Snacks', ['donut vada']),
  F('Sabudana Vada (2)', '🍩', 300, 5, 52, 10, '2 vadas', 'Indian Snacks', ['vrat', 'sago']),
  F('Bread Pakora (2)', '🍞', 320, 8, 40, 15, '2 pieces', 'Indian Snacks', []),
  F('Dahi Bhalla (2)', '🫧', 260, 9, 38, 8, '2 pieces', 'Indian Snacks', ['dahi vada']),
  F('Aloo Chaat (1 plate)', '🥔', 240, 5, 44, 7, '1 plate', 'Indian Snacks', ['chaat']),
  F('Aloo Bonda (4)', '🟠', 360, 7, 52, 14, '4 bondas', 'Indian Snacks', ['batata vada']),
  F('Punugulu (6)', '🟠', 280, 6, 40, 12, '6 pieces', 'Indian Snacks', ['andhra', 'fried idli batter']),
  F('Goli Baje (4)', '🟠', 260, 6, 38, 11, '4 pieces', 'Indian Snacks', ['mangalore', 'bonda']),
  F('Sukhdi (2)', '🟤', 240, 5, 34, 10, '2 pieces', 'Indian Snacks', ['gujarati', 'jaggery']),
  F('Kara Boondi (50g)', '🟡', 240, 6, 30, 12, '50g', 'Indian Snacks', ['namkeen']),

  // ── Breakfast (regional) ────────────────────────────────────────────────────
  F('Moong Dal Chilla (2)', '🥞', 240, 14, 36, 5, '2 chillas', 'Breakfast', ['cheela', 'lentil']),
  F('Besan Chilla (2)', '🥞', 260, 12, 34, 8, '2 chillas', 'Breakfast', ['cheela', 'gram flour']),
  F('Rava Idli (2)', '🍘', 200, 6, 40, 3, '2 idlis', 'Breakfast', ['semolina']),
  F('Gobi Paratha (2)', '🫓', 320, 8, 56, 8, '2 parathas', 'Breakfast', ['cauliflower']),
  F('Mooli Paratha (2)', '🫓', 300, 7, 54, 7, '2 parathas', 'Breakfast', ['radish']),
  F('Methi Paratha (2)', '🫓', 300, 8, 52, 8, '2 parathas', 'Breakfast', ['fenugreek']),
  F('Idiyappam (3)', '🍜', 200, 4, 44, 1, '3 idiyappams', 'Breakfast', ['string hoppers', 'kerala']),
  F('Kesari Bath (1 bowl)', '🍮', 320, 4, 62, 8, '1 bowl', 'Breakfast', ['karnataka', 'sooji halwa']),
  F('Akki Roti (2)', '🫓', 280, 6, 54, 6, '2 rotis', 'Breakfast', ['karnataka', 'rice flour']),
  F('Ragi Dosa (1)', '🥞', 220, 7, 44, 4, '1 dosa', 'Breakfast', ['finger millet']),
  F('Vegetable Vermicelli (1 bowl)', '🍜', 240, 6, 48, 4, '1 bowl', 'Breakfast', ['sevai', 'upma']),
  F('Dalia (1 bowl)', '🥣', 200, 7, 40, 3, '1 bowl', 'Breakfast', ['broken wheat', 'porridge']),
  F('Uggani (1 bowl)', '🍚', 260, 6, 50, 5, '1 bowl', 'Breakfast', ['rayalaseema', 'puffed rice']),
  F('Dibba Rotti (1)', '🫓', 280, 6, 52, 6, '1 rotti', 'Breakfast', ['andhra', 'thick dosa']),
  F('Benne Dose (1)', '🧈', 340, 7, 52, 12, '1 dose', 'Breakfast', ['davangere', 'butter dosa']),

  // ── Desserts (regional) ─────────────────────────────────────────────────────
  F('Shrikhand (1 bowl)', '🍮', 280, 8, 44, 8, '1 bowl', 'Desserts', ['gujarati', 'maharashtrian']),
  F('Basundi (1 bowl)', '🍮', 300, 9, 40, 12, '1 bowl', 'Desserts', ['reduced milk']),
  F('Modak (2)', '🥟', 300, 6, 58, 6, '2 modaks', 'Desserts', ['maharashtrian', 'ganpati']),
  F('Puran Poli (1)', '🫓', 340, 9, 62, 8, '1 poli', 'Desserts', ['maharashtrian', 'dal']),
  F('Payasam (1 bowl)', '🍮', 300, 8, 54, 7, '1 bowl', 'Desserts', ['kerala', 'kheer']),
  F('Gajar ka Halwa (1 bowl)', '🥕', 320, 6, 52, 12, '1 bowl', 'Desserts', ['carrot halwa']),
  F('Moong Dal Halwa (1 bowl)', '🍮', 380, 9, 52, 16, '1 bowl', 'Desserts', []),
  F('Sandesh (2)', '🍬', 200, 10, 36, 4, '2 pieces', 'Desserts', ['bengali']),
  F('Mishti Doi (1 bowl)', '🍮', 220, 7, 38, 5, '1 bowl', 'Desserts', ['bengali', 'sweet curd']),
  F('Double ka Meetha (1 bowl)', '🍞', 340, 7, 58, 10, '1 bowl', 'Desserts', ['hyderabadi', 'bread pudding']),
  F('Bebinca (1 slice)', '🍰', 280, 5, 44, 10, '1 slice', 'Desserts', ['goan']),
  F('Mysore Pak (2)', '🍬', 240, 4, 28, 15, '2 pieces', 'Desserts', ['karnataka', 'ghee']),
  F('Balushahi (2)', '🍩', 380, 4, 52, 16, '2 pieces', 'Desserts', []),
  F('Ghevar (1)', '🍯', 350, 5, 54, 14, '1 piece', 'Desserts', ['rajasthani']),
  F('Malpua (2)', '🥞', 420, 6, 68, 15, '2 pieces', 'Desserts', ['pancake', 'rabri']),
  F('Ada Pradhaman (1 bowl)', '🍮', 320, 7, 56, 8, '1 bowl', 'Desserts', ['kerala', 'payasam']),
  F('Qubani ka Meetha (1 bowl)', '🍑', 260, 3, 60, 3, '1 bowl', 'Desserts', ['hyderabadi', 'apricot']),

  // ── Beverages (regional) ────────────────────────────────────────────────────
  F('Masala Chaas (1 glass)', '🥛', 60, 4, 6, 2, '1 glass', 'Beverages', ['buttermilk', 'spiced']),
  F('Aam Panna (1 glass)', '🥭', 110, 1, 28, 0, '1 glass', 'Beverages', ['raw mango']),
  F('Nimbu Pani (1 glass)', '🍋', 80, 0, 20, 0, '1 glass', 'Beverages', ['lemonade']),
  F('Badam Milk (1 glass)', '🥛', 220, 8, 28, 9, '1 glass', 'Beverages', ['almond', 'kesar']),
  F('Tender Coconut (1)', '🥥', 60, 1, 12, 1, '1 coconut', 'Beverages', ['nariyal pani']),
  F('Sugarcane Juice (1 glass)', '🎋', 180, 1, 44, 0, '1 glass', 'Beverages', ['ganne ka ras']),
  F('Sattu Sharbat (1 glass)', '🥤', 160, 8, 30, 1, '1 glass', 'Beverages', ['bihar', 'roasted gram']),
  F('Solkadhi (1 glass)', '🥤', 90, 2, 12, 4, '1 glass', 'Beverages', ['konkan', 'kokum']),
  F('Jaljeera (1 glass)', '🥤', 70, 1, 16, 0, '1 glass', 'Beverages', ['cumin drink']),
  F('Rose Sherbet (1 glass)', '🌹', 120, 0, 30, 0, '1 glass', 'Beverages', ['rooh afza']),
  F('Kesar Badam Shake', '🥛', 300, 10, 42, 10, '1 glass', 'Beverages', ['saffron', 'almond']),
  F('Panakam (1 glass)', '🥤', 100, 0, 25, 0, '1 glass', 'Beverages', ['jaggery', 'pepper']),
  F('Neer More (1 glass)', '🥛', 50, 3, 6, 1, '1 glass', 'Beverages', ['tamil', 'buttermilk']),

  // ── Protein (regional) ──────────────────────────────────────────────────────
  F('Sprouts Chaat (1 bowl)', '🌱', 180, 12, 28, 3, '1 bowl', 'Protein', ['moong sprouts']),
  F('Kala Chana (1 bowl)', '🫘', 260, 13, 44, 4, '1 bowl', 'Protein', ['black chickpea']),
  F('Horse Gram - Kulthi (1 bowl)', '🫘', 200, 14, 36, 2, '1 bowl', 'Protein', ['kulith']),
  F('Chicken 65 (100g)', '🍗', 320, 26, 12, 18, '100g', 'Protein', ['fried chicken']),
  F('Fish Fry (100g)', '🐟', 280, 24, 8, 16, '100g', 'Protein', []),
  F('Paneer Bhurji (1 bowl)', '🧀', 280, 20, 10, 18, '1 bowl', 'Protein', []),
  F('Chicken Keema (1 bowl)', '🍖', 300, 28, 8, 18, '1 bowl', 'Protein', ['mince']),
  F('Boiled Chana (1 bowl)', '🫘', 240, 13, 40, 4, '1 bowl', 'Protein', ['chickpea']),
  F('Prawns Fry (100g)', '🍤', 260, 26, 6, 14, '100g', 'Protein', []),

  // ── Vegetables (regional) ───────────────────────────────────────────────────
  F('Bhindi Fry (1 bowl)', '🫛', 160, 4, 16, 10, '1 bowl', 'Vegetables', ['okra']),
  F('Karela Sabzi (1 bowl)', '🥒', 140, 4, 14, 9, '1 bowl', 'Vegetables', ['bitter gourd']),
  F('Tinda Sabzi (1 bowl)', '🎃', 120, 3, 16, 5, '1 bowl', 'Vegetables', ['apple gourd']),
  F('Lauki Sabzi (1 bowl)', '🥒', 110, 3, 18, 3, '1 bowl', 'Vegetables', ['bottle gourd']),
  F('Drumstick Curry (1 bowl)', '🥁', 150, 5, 20, 6, '1 bowl', 'Vegetables', ['moringa']),

  // ── Grains & Carbs (regional) ───────────────────────────────────────────────
  F('Bajra Roti (2)', '🫓', 220, 7, 44, 4, '2 rotis', 'Grains & Carbs', ['pearl millet']),
  F('Jowar Roti (2)', '🫓', 210, 7, 44, 2, '2 rotis', 'Grains & Carbs', ['sorghum']),
  F('Ragi Roti (2)', '🫓', 200, 6, 42, 3, '2 rotis', 'Grains & Carbs', ['finger millet']),
  F('Tomato Rice (1 bowl)', '🍅', 280, 6, 56, 5, '1 bowl', 'Grains & Carbs', []),
  F('Coconut Rice (1 bowl)', '🥥', 320, 6, 54, 10, '1 bowl', 'Grains & Carbs', []),
  F('Tamarind Rice (1 bowl)', '🍋', 300, 6, 58, 6, '1 bowl', 'Grains & Carbs', ['pulihora']),

  // ── Fruits (regional) ───────────────────────────────────────────────────────
  F('Jackfruit (1 cup)', '🍈', 95, 2, 23, 1, '1 cup', 'Fruits', ['kathal']),
  F('Custard Apple (1)', '🍏', 150, 2, 36, 1, '1 whole', 'Fruits', ['sitaphal']),
  F('Jamun (1 cup)', '🫐', 75, 1, 18, 0, '1 cup', 'Fruits', ['java plum']),
  F('Sapota (1)', '🤎', 80, 0, 20, 1, '1 whole', 'Fruits', ['chikoo']),

  // ── Nuts & Seeds ────────────────────────────────────────────────────────────
  F('Roasted Chana (30g)', '🫘', 120, 6, 18, 2, '30g handful', 'Nuts & Seeds', ['roasted chickpea']),
  F('Sesame Seeds (1 tbsp)', '🌱', 90, 3, 4, 8, '1 tbsp', 'Nuts & Seeds', ['til']),
  F('Pumpkin Seeds (30g)', '🎃', 160, 9, 4, 14, '30g handful', 'Nuts & Seeds', []),

  // ── Fast Food ───────────────────────────────────────────────────────────────
  F('Chicken Shawarma (1)', '🌯', 520, 28, 44, 20, '1 shawarma', 'Fast Food', []),
  F('Paneer Tikka Sandwich', '🥪', 380, 16, 44, 14, '1 sandwich', 'Fast Food', []),
  F('Dahi Kebab (4)', '🧆', 260, 12, 20, 14, '4 kebabs', 'Fast Food', []),
  F('Hara Bhara Kebab (4)', '🧆', 220, 8, 28, 10, '4 kebabs', 'Fast Food', ['veg kebab']),

  // ── Dairy & Eggs ────────────────────────────────────────────────────────────
  F('Fried Eggs (2)', '🍳', 220, 13, 2, 17, '2 eggs', 'Dairy & Eggs', []),
  F('Cheese Dosa (1)', '🧀', 380, 12, 44, 16, '1 dosa', 'Dairy & Eggs', []),
  F('Ghee (1 tbsp)', '🫗', 120, 0, 0, 14, '1 tbsp', 'Dairy & Eggs', ['clarified butter']),
  F('Malai (2 tbsp)', '🥛', 110, 1, 2, 11, '2 tbsp', 'Dairy & Eggs', ['cream']),
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
