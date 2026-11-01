const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

// Fail fast without a JWT secret: jwt.verify with an undefined secret throws
// on every request, which would look like a total auth outage. Better to crash
// at boot with a clear message than to serve a broken API.
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start without it.')
  process.exit(1)
}

const app = express()

// Trust the first proxy (Vercel) so rate limiting sees real client IPs
app.set('trust proxy', 1)

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
      const err = new Error(`CORS blocked: ${origin}`)
      err.status = 403
      callback(err)
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
// 'dev' format is verbose — use the quieter 'combined' format in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
// Explicit body cap (Express's default is also 100kb, but implicit defaults
// get "tuned" away by accident). JSON bodies here are small by design —
// large payloads use the multer 5MB upload path on /api/ml/detect-food.
app.use(express.json({ limit: '100kb' }))

// API Routes — direct requires (NOT dynamic): Vercel's file tracer only
// bundles statically-analyzable requires. A dynamic require() wrapper
// (the old safeRoute helper) silently 503'd every route in production.
app.use('/api/auth', require('./routes/auth'))
app.use('/api/meals', require('./routes/meals'))
app.use('/api/workouts', require('./routes/workouts'))
app.use('/api/badges', require('./routes/badges'))
app.use('/api/stats', require('./routes/stats'))
app.use('/api/ml', require('./routes/mlProxy'))

// Feature Routes
app.use('/api/posts', require('./routes/posts'))
app.use('/api/water', require('./routes/water'))
app.use('/api/weight', require('./routes/weight'))
app.use('/api/recipes', require('./routes/recipes'))
app.use('/api/barcode', require('./routes/barcode'))
app.use('/api/sleep', require('./routes/sleep'))
app.use('/api/coaching', require('./routes/coaching'))
app.use('/api/integrations', require('./routes/integrations'))

// Root Route
app.get('/', (req, res) => {
  res.send('NutriAI Backend Running Successfully 🚀')
})

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message)
  // CORS rejections carry their own status
  const status = err.status || 500
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  })
})

// Start Server (only when run directly — Vercel serverless imports the app instead)
let server
if (require.main === module) {
  const PORT = process.env.PORT || 10000
  server = app.listen(PORT, () => {
    console.log(`✅ NutriAI backend running on port ${PORT}`)
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`)
  })
}

// Graceful Shutdown
process.on('SIGTERM', async () => {
  if (!server) return
  server.close(async () => {
    try {
      const { prisma } = require('./prisma.config')
      await prisma.$disconnect()
    } catch (_) {}
    console.log('Server shut down')
  })
})

module.exports = app
