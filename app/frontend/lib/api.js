import axios from 'axios'

// Create Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('nutriai_token')
      if (token && token !== 'undefined' && token !== 'null' && token.length > 0) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      console.error('LocalStorage read error:', e)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nutriai_token')
      localStorage.removeItem('nutriai_user')
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  logout: () => {
    localStorage.removeItem('nutriai_token')
    localStorage.removeItem('nutriai_user')
  },
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('nutriai_user')
      if (!user || user === 'undefined' || user === 'null' || user.length === 0) return null
      return JSON.parse(user)
    } catch (e) {
      localStorage.removeItem('nutriai_user')
      return null
    }
  },
  getToken: () => {
    try {
      const token = localStorage.getItem('nutriai_token')
      if (!token || token === 'undefined' || token === 'null' || token.length === 0) return null
      return token
    } catch (e) {
      return null
    }
  },
}

// ─── Meals endpoints ──────────────────────────────────────────────────────────
// These match the actual backend routes:
//   GET  /api/meals         - all meals
//   GET  /api/meals/today   - today's meals + totals
//   GET  /api/meals/weekly  - last 7 days
//   POST /api/meals         - log meal
//   DELETE /api/meals/:id   - remove meal
export const meals = {
  getAll:   ()           => api.get('/api/meals'),
  getToday: ()           => api.get('/api/meals/today'),
  getWeekly: ()          => api.get('/api/meals/weekly'),
  log:      (data)       => api.post('/api/meals', data),
  remove:   (id)         => api.delete(`/api/meals/${id}`),
  // Legacy aliases kept for backward compatibility
  getByDate:   (date)    => api.get(`/api/meals?date=${date}`),
  getHistory:  (days)    => api.get(`/api/meals/weekly`),
  update:      (id, data) => api.put(`/api/meals/${id}`, data),
}

// ─── Workouts endpoints ───────────────────────────────────────────────────────
export const workouts = {
  getAll:       ()           => api.get('/api/workouts'),
  getStats:     ()           => api.get('/api/workouts/stats'),
  log:          (data)       => api.post('/api/workouts', data),
  // Legacy aliases
  getByDate:    (date)       => api.get('/api/workouts'),
  getHistory:   (days)       => api.get('/api/workouts'),
  update:       (id, data)   => api.put(`/api/workouts/${id}`, data),
  markComplete: (id)         => api.post(`/api/workouts/${id}/complete`),
}

// ─── Badges endpoints ─────────────────────────────────────────────────────────
export const badges = {
  getAll:       () => api.get('/api/badges'),
  getXP:        () => api.get('/api/badges/xp'),
  // Legacy aliases
  getUserBadges: () => api.get('/api/badges'),
  check:        () => api.get('/api/badges/xp'),
}

// ─── Stats endpoints ──────────────────────────────────────────────────────────
export const stats = {
  get: () => api.get('/api/stats'),
}

// ─── ML Service endpoints (proxied through backend) ───────────────────────────
export const ml = {
  detect:   (formData) => api.post('/api/ml/detect-food', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  forecast: (data) => api.post('/api/ml/nutrition-forecast', data),
  recipe:   (data) => api.post('/api/ml/recipe-suggestions', data),
  chat:     (data) => api.post('/api/ml/chat', data),
}

// ─── Convenience helpers used across pages ────────────────────────────────────

export const getCurrentUser = auth.getCurrentUser

export const logMeal = meals.log

export const deleteMeal = meals.remove

/** Fetch today's nutrition from real API */
export const getTodayNutrition = async () => {
  try {
    // Add _t to bust browser cache (prevents 304 returning stale data)
    const res = await api.get(`/api/meals/today?_t=${Date.now()}`)
    const data = res.data
    // Handle both mock server (data.totals.calories) and real server (data.totalCalories)
    const calories = data.totalCalories ?? data.totals?.calories ?? 0
    const protein  = data.protein  ?? data.totals?.protein  ?? 0
    const carbs    = data.carbs    ?? data.totals?.carbs    ?? 0
    const fat      = data.fat      ?? data.totals?.fat      ?? 0
    return {
      calories:     Math.round(calories),
      protein:      Math.round(protein),
      carbs:        Math.round(carbs),
      fat:          Math.round(fat),
      goalCalories: data.goalCalories || 1800,
      meals:        data.meals || [],
      grouped:      data.grouped || {},
    }
  } catch (e) {
    console.error('getTodayNutrition error:', e.message)
    return { calories: 0, protein: 0, carbs: 0, fat: 0, goalCalories: 1800, meals: [], grouped: {} }
  }
}

/** Fetch weekly nutrition from real API */
export const getWeeklyNutrition = async () => {
  try {
    const res = await api.get('/api/meals/weekly')
    return res.data
  } catch (e) {
    console.error('getWeeklyNutrition error:', e.message)
    return []
  }
}

/** Fetch user XP and level from real API */
export const getUserXP = async () => {
  try {
    const res = await api.get('/api/badges/xp')
    return res.data
  } catch (e) {
    console.error('getUserXP error:', e.message)
    return { xp: 0, level: 1, levelName: 'Rookie', totalXP: 0 }
  }
}

/** Fetch today's meals from real API */
export const getMeals = async () => {
  try {
    const res = await api.get(`/api/meals/today?_t=${Date.now()}`)
    return res.data.meals || []
  } catch (e) {
    console.error('getMeals error:', e.message)
    return []
  }
}

export default api
