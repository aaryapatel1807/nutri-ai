import axios from 'axios'

// ---------------------------------------------------------------------------
// Auth token storage — localStorage tradeoff (2026-10-01 audit note):
// a JWT in localStorage is stealable by any XSS. We accept this because the
// backend is serverless (no HttpOnly-cookie session infra) AND the chatbot
// XSS vector is now closed (formatMessage escapes before markdown). The
// access token lives only 1h and refresh tokens rotate server-side, so a
// stolen token's blast radius is bounded. Revisit with HttpOnly cookies if
// a stricter posture is ever needed.
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'nutriai_token'
const REFRESH_KEY = 'nutriai_refresh'
const USER_KEY = 'nutriai_user'

// Create Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  // Clear all user-scoped chat history
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('nutriai_chat_')) localStorage.removeItem(key)
    })
  } catch { /* private mode */ }
}

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
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

// Single-flight refresh: concurrent 401s share one refresh call.
let refreshPromise = null
async function silentRefresh() {
  if (refreshPromise) return refreshPromise
  const stored = (() => { try { return localStorage.getItem(REFRESH_KEY) } catch { return null } })()
  if (!stored) return null
  refreshPromise = axios
    .post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh`, { refreshToken: stored })
    .then(({ data }) => {
      try {
        localStorage.setItem(TOKEN_KEY, data.token)
        localStorage.setItem(REFRESH_KEY, data.refreshToken)
      } catch { /* private mode */ }
      return data.token
    })
    .catch(() => null)
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

// Response interceptor - try silent refresh on 401 before logging out
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isRefreshCall = original?.url?.includes('/api/auth/refresh')

    if (error.response?.status === 401 && !isRefreshCall && !original?._retry) {
      original._retry = true
      const newToken = await silentRefresh()
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original) // retry once with the fresh access token
      }
    }

    if (error.response?.status === 401) {
      clearAuthStorage()
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
  refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/api/auth/reset-password', { token, newPassword }),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  logout: () => {
    // Revoke the refresh token server-side (fire-and-forget — local cleanup
    // must happen even if the network call fails).
    try {
      const rt = localStorage.getItem(REFRESH_KEY)
      if (rt) {
        api.post('/api/auth/logout', { refreshToken: rt }).catch(() => {})
      }
    } catch { /* private mode */ }
    clearAuthStorage()
  },
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem(USER_KEY)
      if (!user || user === 'undefined' || user === 'null' || user.length === 0) return null
      return JSON.parse(user)
    } catch (e) {
      localStorage.removeItem(USER_KEY)
      return null
    }
  },

  getToken: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
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
