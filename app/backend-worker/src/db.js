// ─── Prisma client factory (Neon HTTP driver — Workers-safe) ────────────────
// Workers have no TCP sockets, so the Neon serverless driver talks to Postgres
// over stateless HTTPS. `poolQueryViaFetch = true` keeps every query on plain
// fetch (no retained WebSocket pool, which violates Workers' per-request I/O
// rules). A fresh client is created per request — cheap, since the WASM query
// compiler is loaded once at module scope.

import { PrismaClient } from './generated/prisma/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'

neonConfig.poolQueryViaFetch = true

export function createPrisma(databaseUrl) {
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured')
  const adapter = new PrismaNeon({ connectionString: databaseUrl })
  return new PrismaClient({ adapter })
}
