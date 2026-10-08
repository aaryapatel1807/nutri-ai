// Hono route tests — the app is assembled with an injected mock Prisma
// (createApp({ getPrisma })) so no database or network is needed.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { sign } from 'hono/jwt'
import { createApp } from '../src/app.js'
import { hashPassword } from '../src/utils/crypto.js'
import { bcrypt } from 'hash-wasm'

const ENV = {
  JWT_SECRET: 'test-jwt-secret-for-routes',
  GROQ_API_KEY: 'test-groq-key',
  GEMINI_API_KEY: 'test-gemini-key',
  FRONTEND_URL: 'https://example.test',
}

// Deep mock: every model method resolves to a sane default unless overridden.
function mockPrisma(overrides = {}) {
  const defaults = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (args) => ({ id: 'mock-id-1', createdAt: new Date(), ...(args?.data || {}) }),
    update: async (args) => ({ id: args?.where?.id || 'mock-id-1', ...(args?.data || {}) }),
    updateMany: async () => ({ count: 0 }),
    upsert: async (args) => ({ id: 'mock-id-1', ...(args?.create || {}) }),
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    count: async () => 0,
    aggregate: async () => ({ _sum: { calories: 0 } }),
  }
  const calls = {}
  return new Proxy(
    { __calls: calls },
    {
      get(t, model) {
        if (model === '__calls') return calls
        return new Proxy(
          {},
          {
            get(_, method) {
              return async (...args) => {
                const key = `${String(model)}.${String(method)}`
                calls[key] = (calls[key] || 0) + 1
                const ov = overrides[model]?.[method]
                if (ov) return ov(...args)
                const d = defaults[method]
                if (!d) throw new Error(`unmocked prisma method: ${key}`)
                return d(...args)
              }
            },
          }
        )
      },
    }
  )
}

function buildApp(prisma) {
  return createApp({ getPrisma: () => prisma })
}

async function authedToken() {
  return sign({ userId: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 }, ENV.JWT_SECRET, 'HS256')
}

async function req(app, path, { method = 'GET', token, body, query } = {}) {
  const headers = {}
  if (token !== null) headers.Authorization = `Bearer ${token ?? (await authedToken())}`
  let init = { method, headers }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const url = query ? `${path}?${query}` : path
  return app.request(url, init, ENV)
}

let app
beforeEach(() => {
  app = buildApp(mockPrisma())
})

test('GET / and /health are public', async () => {
  let r = await app.request('/', {}, ENV)
  assert.equal(r.status, 200)
  r = await app.request('/health', {}, ENV)
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.equal(j.status, 'ok')
})

test('auth middleware rejects missing and bad tokens', async () => {
  let r = await req(app, '/api/meals', { token: null })
  assert.equal(r.status, 401)
  r = await req(app, '/api/meals', { token: 'garbage' })
  assert.equal(r.status, 401)
})

test('register validates input and creates a user', async () => {
  let r = await req(app, '/api/auth/register', {
    token: null,
    method: 'POST',
    body: { email: 'a@b.c', password: 'longenoughpw' },
  })
  assert.equal(r.status, 400) // missing name

  const prisma = mockPrisma({
    user: {
      findFirst: async () => null,
      create: async (args) => ({ id: 'user-1', ...args.data }),
    },
    refreshToken: { create: async () => ({}) },
  })
  app = buildApp(prisma)
  r = await req(app, '/api/auth/register', {
    token: null,
    method: 'POST',
    body: { name: 'Test', email: 'A@B.C', password: 'longenoughpw' },
  })
  assert.equal(r.status, 201)
  const j = await r.json()
  assert.ok(j.token && j.refreshToken)
  assert.equal(j.user.email, 'a@b.c') // normalised to lowercase
})

test('register does not reveal taken emails', async () => {
  const prisma = mockPrisma({
    user: { findFirst: async () => ({ id: 'user-9', email: 'taken@x.y' }) },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/auth/register', {
    token: null,
    method: 'POST',
    body: { name: 'T', email: 'taken@x.y', password: 'longenoughpw' },
  })
  assert.equal(r.status, 201)
  const j = await r.json()
  assert.ok(!j.user && !j.token, 'must not leak the account or a token')
})

test('login with PBKDF2 hash succeeds', async () => {
  const hash = await hashPassword('my-secret-pw')
  const prisma = mockPrisma({
    user: { findFirst: async () => ({ id: 'user-1', email: 'u@x.y', name: 'U', password: hash }) },
    refreshToken: { create: async () => ({}) },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/auth/login', {
    token: null,
    method: 'POST',
    body: { email: 'u@x.y', password: 'my-secret-pw' },
  })
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.ok(j.token)
  assert.equal(j.user.password, undefined, 'password must not leak')
})

test('login rejects wrong password', async () => {
  const hash = await hashPassword('my-secret-pw')
  const prisma = mockPrisma({
    user: { findFirst: async () => ({ id: 'user-1', email: 'u@x.y', password: hash }) },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/auth/login', {
    token: null,
    method: 'POST',
    body: { email: 'u@x.y', password: 'wrong-pw' },
  })
  assert.equal(r.status, 401)
})

test('login upgrades legacy bcrypt hashes to PBKDF2', async () => {
  const legacy = await bcrypt({
    password: 'legacy-pw',
    salt: new Uint8Array(16).fill(3),
    costFactor: 4,
    outputType: 'encoded',
  })
  let storedUpdate = null
  const prisma = mockPrisma({
    user: {
      findFirst: async () => ({ id: 'user-1', email: 'u@x.y', name: 'U', password: legacy }),
      update: async (args) => {
        storedUpdate = args.data
        return { id: 'user-1' }
      },
    },
    refreshToken: { create: async () => ({}) },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/auth/login', {
    token: null,
    method: 'POST',
    body: { email: 'u@x.y', password: 'legacy-pw' },
  })
  assert.equal(r.status, 200)
  assert.ok(storedUpdate?.password?.startsWith('pbkdf2$'), 'hash must be upgraded on login')
})

test('login is rate-limited after 20 attempts', async () => {
  const prisma = mockPrisma({
    user: { findFirst: async () => null },
  })
  const limited = buildApp(prisma)
  let last = 0
  for (let i = 0; i < 21; i++) {
    const r = await req(limited, '/api/auth/login', {
      token: null,
      method: 'POST',
      body: { email: 'u@x.y', password: 'x' },
    })
    last = r.status
  }
  assert.equal(last, 429)
})

test('GET /api/meals returns the user meals', async () => {
  const prisma = mockPrisma({
    meal: { findMany: async () => [{ id: 'm1', name: 'Oats', calories: 300 }] },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/meals')
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.equal(j.length, 1)
  assert.equal(j[0].name, 'Oats')
})

test('POST /api/meals rejects invalid date', async () => {
  const r = await req(app, '/api/meals', { method: 'POST', body: { date: 'nope' } })
  assert.equal(r.status, 400)
})

test('POST /api/meals logs a meal and checks badges', async () => {
  const prisma = mockPrisma({
    meal: {
      create: async (args) => ({ id: 'm2', ...args.data }),
      count: async () => 1,
    },
    badge: { findFirst: async () => ({ id: 'b1', name: 'First Bite' }) },
    userBadge: { upsert: async () => ({}) },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/meals', {
    method: 'POST',
    body: { name: 'Dal', calories: 200, mealType: 'Lunch' },
  })
  assert.equal(r.status, 201)
  const j = await r.json()
  assert.equal(j.name, 'Dal')
  assert.equal(prisma.__calls['userBadge.upsert'], 1)
})

test('GET /api/workouts/stats aggregates counts', async () => {
  const prisma = mockPrisma({
    workout: {
      count: async (args) => (args?.where?.completedAt ? 3 : 10),
      aggregate: async () => ({ _sum: { calories: 1200 } }),
    },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/workouts/stats')
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.deepEqual(j, { totalWorkouts: 10, thisWeek: 3, totalCaloriesBurned: 1200 })
})

test('POST /api/workouts validates numbers', async () => {
  const r = await req(app, '/api/workouts', {
    method: 'POST',
    body: { name: 'Run', duration: 'soon' },
  })
  assert.equal(r.status, 400)
})

test('GET /api/badges marks unlocked badges', async () => {
  const prisma = mockPrisma({
    badge: { findMany: async () => [{ id: 'b1', name: 'First Bite', xp: 10 }] },
    userBadge: { findMany: async () => [{ badgeId: 'b1', unlockedAt: '2026-01-01' }] },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/badges')
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.equal(j[0].unlocked, true)
})

test('GET /api/stats returns dashboard numbers', async () => {
  const prisma = mockPrisma({
    user: { findUnique: async () => ({ createdAt: '2026-01-01', calorieGoal: 2000 }) },
    meal: {
      count: async () => 5,
      findMany: async () => [{ date: new Date() }],
    },
    workout: { count: async () => 2 },
    userBadge: { count: async () => 1 },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/stats')
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.equal(j.totalMeals, 5)
  assert.equal(j.streak, 1)
})

test('POST /api/posts requires content; DELETE enforces ownership', async () => {
  let r = await req(app, '/api/posts', { method: 'POST', body: {} })
  assert.equal(r.status, 400)

  const prisma = mockPrisma({
    post: { findUnique: async () => ({ id: 'p1', userId: 'other-user' }) },
  })
  app = buildApp(prisma)
  r = await req(app, '/api/posts/p1', { method: 'DELETE' })
  assert.equal(r.status, 403)
})

test('water: GET totals ml, POST validates, DELETE checks ownership', async () => {
  const prisma = mockPrisma({
    waterLog: {
      findMany: async () => [{ amountMl: 250 }, { amountMl: 500 }],
      findUnique: async () => ({ id: 'w1', userId: 'user-1' }),
      create: async (args) => ({ id: 'w2', ...args.data }),
      delete: async () => ({}),
    },
  })
  app = buildApp(prisma)
  let r = await req(app, '/api/water')
  assert.equal(r.status, 200)
  let j = await r.json()
  assert.equal(j.totalMl, 750)

  r = await req(app, '/api/water', { method: 'POST', body: { amountMl: -5 } })
  assert.equal(r.status, 400)

  r = await req(app, '/api/water', { method: 'POST', body: { amountMl: 300 } })
  assert.equal(r.status, 201)
})

test('weight: latest returns null when empty; POST syncs profile weight', async () => {
  const prisma = mockPrisma({
    weightLog: {
      findFirst: async () => null,
      create: async (args) => ({ id: 'wl1', ...args.data }),
    },
    user: { update: async () => ({}) },
  })
  app = buildApp(prisma)
  let r = await req(app, '/api/weight/latest')
  assert.equal(r.status, 200)
  assert.equal(await r.json(), null)

  r = await req(app, '/api/weight', { method: 'POST', body: { weight: 70.5 } })
  assert.equal(r.status, 201)
  assert.equal(prisma.__calls['user.update'], 1)
})

test('sleep: POST validates bounds; GET clamps days', async () => {
  let r = await req(app, '/api/sleep', {
    method: 'POST',
    body: { hours: 8, quality: 9 },
  })
  assert.equal(r.status, 400) // quality out of range

  r = await req(app, '/api/sleep', { method: 'POST', body: { hours: 25, quality: 3 } })
  assert.equal(r.status, 400) // hours out of range

  const future = new Date(Date.now() + 86400000).toISOString()
  r = await req(app, '/api/sleep', { method: 'POST', body: { hours: 8, quality: 3, date: future } })
  assert.equal(r.status, 400) // future date

  const prisma = mockPrisma({
    sleepLog: { upsert: async (args) => ({ id: 's1', ...args.create }) },
  })
  app = buildApp(prisma)
  r = await req(app, '/api/sleep', { method: 'POST', body: { hours: 7.5, quality: 4 } })
  assert.equal(r.status, 201)
})

test('coaching targets returns goal-based macros', async () => {
  const prisma = mockPrisma({
    user: { findUnique: async () => ({ fitnessGoal: 'lose fat', height: 175, weight: 80 }) },
    weightLog: { findMany: async () => [], findFirst: async () => null },
    meal: { findMany: async () => [] },
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/coaching/targets')
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.equal(j.goal, 'fat_loss')
  assert.equal(j.adjustment, -500)
  assert.ok(j.calorieTarget > 0 && j.proteinG > 0)
})

test('ml chat proxies to Groq with persona + profile context', async () => {
  let seenBody = null
  const origFetch = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    seenBody = JSON.parse(init.body)
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'Eat more protein.' } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
  try {
    const prisma = mockPrisma({
      aiUsage: { findUnique: async () => null, upsert: async () => ({}) },
      user: { findUnique: async () => ({ name: 'Aarya', fitnessGoal: 'muscle gain' }) },
    })
    app = buildApp(prisma)
    const r = await req(app, '/api/ml/chat', {
      method: 'POST',
      body: { message: 'what should I eat?', user_data: { persona: 'nutrition' } },
    })
    assert.equal(r.status, 200)
    const j = await r.json()
    assert.equal(j.response, 'Eat more protein.')
    assert.ok(seenBody.messages[0].content.includes('NutriBot'))
    assert.ok(seenBody.messages[0].content.includes('muscle gain'), 'profile context injected')
  } finally {
    globalThis.fetch = origFetch
  }
})

test('ml chat returns 503 without a Groq key', async () => {
  const noKeyEnv = { ...ENV, GROQ_API_KEY: undefined }
  const r = await app.request(
    '/api/ml/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await authedToken()}` },
      body: JSON.stringify({ message: 'hi' }),
    },
    noKeyEnv
  )
  assert.equal(r.status, 503)
})

test('ml daily quota caps AI calls', async () => {
  const prisma = mockPrisma({
    aiUsage: { findUnique: async () => ({ count: 100 }) }, // cap reached
  })
  app = buildApp(prisma)
  const r = await req(app, '/api/ml/chat', { method: 'POST', body: { message: 'hi' } })
  assert.equal(r.status, 429)
})

test('integrations: connect returns the Google OAuth URL; status reflects connection', async () => {
  const prisma = mockPrisma({
    oAuthState: { create: async () => ({}) },
    connectedAccount: { findUnique: async () => ({ lastSyncAt: '2026-01-01' }) },
  })
  const withCreds = buildApp(prisma)
  const credsEnv = {
    ...ENV,
    GOOGLE_FIT_CLIENT_ID: 'cid',
    GOOGLE_FIT_CLIENT_SECRET: 'csec',
    BACKEND_URL: 'https://backend.test',
  }
  const token = await authedToken()
  let r = await withCreds.request(
    '/api/integrations/google-fit/connect',
    { headers: { Authorization: `Bearer ${token}` } },
    credsEnv
  )
  assert.equal(r.status, 200)
  const j = await r.json()
  assert.ok(j.url.includes('accounts.google.com'))

  r = await withCreds.request(
    '/api/integrations/google-fit/status',
    { headers: { Authorization: `Bearer ${token}` } },
    credsEnv
  )
  assert.equal((await r.json()).connected, true)
})

test('integrations: connect fails cleanly without credentials', async () => {
  const r = await req(app, '/api/integrations/google-fit/connect')
  assert.equal(r.status, 500)
})

test('unknown routes 404', async () => {
  const r = await req(app, '/api/nope')
  assert.equal(r.status, 404)
})
