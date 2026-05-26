const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Helper: safe-load a route — logs a warning instead of crashing if file is missing
function safeRoute(path) {
  try {
    return require(path)
  } catch (e) {
    console.warn(`⚠️  Route not found (skipped): ${path} — ${e.message}`)
    const router = express.Router()
    router.all('*', (req, res) =>
      res.status(503).json({ error: `Route module missing: ${path}` })
    )
    return router
  }
}

app.use('/api/auth',     safeRoute('./routes/auth'))
app.use('/api/meals',    safeRoute('./routes/meals'))
app.use('/api/workouts', safeRoute('./routes/workouts'))
app.use('/api/badges',   safeRoute('./routes/badges'))
app.use('/api/stats',    safeRoute('./routes/stats'))
app.use('/api/ml',       safeRoute('./routes/mlProxy'))

// Feature Routes
app.use('/api/posts',    safeRoute('./routes/posts'))
app.use('/api/water',    safeRoute('./routes/water'))
app.use('/api/weight',   safeRoute('./routes/weight'))
app.use('/api/recipes',  safeRoute('./routes/recipes'))
app.use('/api/ai',       safeRoute('./routes/ai'))       // Secure Anthropic proxy

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => console.log(`✅ NutriAI backend running on port ${PORT}`))

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    try {
      const { prisma } = require('./prisma.config')
      prisma.$disconnect()
    } catch (_) {}
    console.log('Server shut down')
  })
})

module.exports = app
