const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()

// ✅ Allowed Origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

// ✅ CORS — must be before everything else
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`🚫 CORS blocked request from: ${origin}`)
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ✅ Handle preflight requests for all routes
app.options('*', cors())

// Middleware
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Helper: safe-load a route — logs warning instead of crashing
function safeRoute(path) {
  try {
    return require(path)
  } catch (e) {
    console.warn(`⚠️ Route not found (skipped): ${path} — ${e.message}`)
    const router = express.Router()
    router.all('*', (req, res) => {
      res.status(503).json({
        error: `Route module missing: ${path}`,
      })
    })
    return router
  }
}

// API Routes
app.use('/api/auth', safeRoute('./routes/auth'))
app.use('/api/meals', safeRoute('./routes/meals'))
app.use('/api/workouts', safeRoute('./routes/workouts'))
app.use('/api/badges', safeRoute('./routes/badges'))
app.use('/api/stats', safeRoute('./routes/stats'))
app.use('/api/ml', safeRoute('./routes/mlProxy'))

// Feature Routes
app.use('/api/posts', safeRoute('./routes/posts'))
app.use('/api/water', safeRoute('./routes/water'))
app.use('/api/weight', safeRoute('./routes/weight'))
app.use('/api/recipes', safeRoute('./routes/recipes'))
app.use('/api/ai', safeRoute('./routes/ai'))

// Root Route
app.get('/', (req, res) => {
  res.send('NutriAI Backend Running Successfully 🚀')
})

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', allowedOrigins })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
  })
})

// Start Server
const PORT = process.env.PORT || 10000
const server = app.listen(PORT, () => {
  console.log(`✅ NutriAI backend running on port ${PORT}`)
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`)
})

// Graceful Shutdown
process.on('SIGTERM', async () => {
  server.close(async () => {
    try {
      const { prisma } = require('./prisma.config')
      await prisma.$disconnect()
    } catch (_) {}
    console.log('Server shut down')
  })
})

module.exports = app
