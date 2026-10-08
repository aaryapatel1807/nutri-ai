// ─── Hono app assembly ──────────────────────────────────────────────────────
// Mount order mirrors app/backend/index.js (auth/meals/.../integrations).

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { prismaErrorHandler, ipRateLimit } from './middleware/auth.js'

import authRoutes from './routes/auth.js'
import mealsRoutes from './routes/meals.js'
import workoutsRoutes from './routes/workouts.js'
import badgesRoutes from './routes/badges.js'
import statsRoutes from './routes/stats.js'
import mlRoutes from './routes/ml.js'
import postsRoutes from './routes/posts.js'
import { water, weight } from './routes/water-weight.js'
import recipesRoutes from './routes/recipes.js'
import barcodeRoutes from './routes/barcode.js'
import sleepRoutes from './routes/sleep.js'
import coachingRoutes from './routes/coaching.js'
import integrationsRoutes from './routes/integrations.js'

// getPrisma: (env) => PrismaClient. The production entry (index.js) passes the
// Neon-backed factory; tests inject a mock.
export function createApp({ getPrisma }) {
  const app = new Hono()

  // Request-scoped Prisma client (Neon HTTP driver — no TCP sockets).
  app.use('*', async (c, next) => {
    if (!c.get('prisma')) c.set('prisma', getPrisma(c.env))
    await next()
  })

  // Trust Vercel-style proxy headers (cf-connecting-ip handled by the limiter).
  app.use('*', secureHeaders())

  const allowedOrigins = (c) => {
    const env = c.env
    const fromEnv = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return [
      env.FRONTEND_URL || 'https://nutriai-frontend-three.vercel.app',
      'http://localhost:3000',
      ...fromEnv,
    ]
  }
  app.use(
    '*',
    cors({
      origin: (origin, c) => {
        if (!origin) return '*'
        return allowedOrigins(c).includes(origin) ? origin : undefined
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length'],
      credentials: true,
      maxAge: 600,
    })
  )

  // Global API rate limit (auth + AI endpoints add stricter per-user limits).
  app.use('/api/*', ipRateLimit(500, 15 * 60 * 1000))
  app.use('*', prismaErrorHandler())

  app.get('/', (c) => c.json({ message: 'NutriAI backend running (Cloudflare Workers)', status: 'ok' }))
  app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }))

  app.route('/api/auth', authRoutes)
  app.route('/api/meals', mealsRoutes)
  app.route('/api/workouts', workoutsRoutes)
  app.route('/api/badges', badgesRoutes)
  app.route('/api/stats', statsRoutes)
  app.route('/api/ml', mlRoutes)
  app.route('/api/posts', postsRoutes)
  app.route('/api/water', water)
  app.route('/api/weight', weight)
  app.route('/api/recipes', recipesRoutes)
  app.route('/api/barcode', barcodeRoutes)
  app.route('/api/sleep', sleepRoutes)
  app.route('/api/coaching', coachingRoutes)
  app.route('/api/integrations', integrationsRoutes)

  app.notFound((c) => c.json({ error: 'Not found' }, 404))
  app.onError((err, c) => {
    console.error('Unhandled error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}
