// ─── Cloudflare Workers entry point ─────────────────────────────────────────
// One Prisma client per request (Neon HTTP driver — no TCP sockets).
// Env bindings come from wrangler.toml [vars] + `wrangler secret put …`.
// See docs/cloudflare-migration.md for the full deploy checklist.

import { createApp } from './app.js'
import { createPrisma } from './db.js'

const app = createApp({ getPrisma: (env) => createPrisma(env.DATABASE_URL) })

export default {
  fetch: app.fetch,
}
