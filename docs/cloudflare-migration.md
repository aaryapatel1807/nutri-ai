# NutriAI → Cloudflare migration

**Status (8 Oct 2026):** code complete, tested locally, **not deployed**.
Deployment is blocked on Aarya: he needs to create a Cloudflare account and
an API token, then give the explicit go-ahead. Nothing here deploys anything.

## Architecture

```
                    ┌─────────────────────────────┐
                    │  Cloudflare Pages           │
                    │  (Next.js 14 static export  │
User ──────────────▶│   via @cloudflare/          │──────────────┐
                    │   next-on-pages)            │              │
                    └─────────────────────────────┘              │  axios, JSON
                                                               ▼
                    ┌─────────────────────────────┐   ┌─────────────────────┐
                    │  Cloudflare Workers         │──▶│  Neon Postgres      │
                    │  (Hono + Prisma 7 workerd   │   │  (HTTP driver —      │
                    │   client via @prisma/        │   │   no TCP sockets)   │
                    │   adapter-neon)             │   └─────────────────────┘
                    │  app/backend-worker/        │
                    └─────────────────────────────┘
```

Today (pre-cutover):

```
User ──▶ Vercel (next frontend) ──▶ Vercel serverless (express backend) ──▶ Neon Postgres
```

The old stack keeps running untouched until the cutover is verified.

## What changed

### Backend: `app/backend` (Express) → `app/backend-worker` (Hono)

- **14 route modules ported 1:1** (`src/routes/`): auth, meals, workouts,
  badges, stats, ml, posts, water-weight, recipes, barcode, sleep, coaching,
  integrations. Same paths, same request/response shapes — the frontend needs
  no changes.
- **Prisma 7 on Workers**: generator `provider = "prisma-client"`,
  `runtime = "workerd"` (WASM query compiler); `@prisma/adapter-neon` +
  `@neondatabase/serverless` with `neonConfig.poolQueryViaFetch = true`
  (stateless HTTPS, no TCP sockets). A fresh client is created per request —
  cheap, since the WASM compiler loads once at module scope. `nodejs_compat`
  is enabled in `wrangler.toml` — genuinely required by Prisma internals.
- **Auth**: JWT via `hono/jwt` (HS256, WebCrypto). `JWT_SECRET` must be the
  same value as the old backend so existing sessions stay valid.
- **Passwords — read this**: bcrypt (cost 10) cannot run on the Workers free
  tier (10 ms CPU/invocation). New hashes use PBKDF2-SHA256 (WebCrypto,
  native). Legacy `$2a$/$2b$` hashes from the Express backend verify with
  `hash-wasm` (WASM bcrypt) and are **transparently upgraded to PBKDF2 on the
  next successful login**. Passwords capped at 72 chars (bcrypt's own limit).
  - ⚠️ **Documented risk**: the bcrypt-verify path is the heaviest CPU in
    the worker. If login requests start returning 500s/timeouts in
    production, the fallback is to keep `/api/auth` on the old Vercel backend
    and proxy it from the Worker — no data migration needed, one routing
    change.
- **Token encryption**: AES-256-GCM via WebCrypto, byte-compatible with the
  existing `"iv:ciphertext:tag"` format — existing Google Fit rows in
  `ConnectedAccount` keep decrypting. `TOKEN_ENCRYPTION_KEY` must carry over.
- **Uploads**: multer is gone — `/api/ml/detect-food` reads the image from
  `c.req.parseBody()` (5 MB cap, magic-byte validated, no R2 needed since the
  image goes straight to Gemini).
- **SSRF guard** (`/api/recipes/import`): reimplemented with DNS-over-HTTPS
  (`cloudflare-dns.com`) since Workers have no `node:dns`/`node:net`. Private
  IP ranges still blocked, redirects still checked hop-by-hop (max 3).
- **Rate limits**: custom sliding-window limiters (per isolate) replacing
  `express-rate-limit`. Same shape as before (best-effort on serverless, as
  it always was). The **DB-backed daily AI quota** (`aiUsage`, default 100
  calls/day/user) is the hard guarantee for the Groq free tier — unchanged.
- **No WebSockets anywhere** in the old backend — nothing to replace.

### Frontend: `app/frontend` → Cloudflare Pages

- Pure client-side Next.js 14 (no API routes, middleware, server actions,
  `next/image`) — nothing to rewrite. Added `@cloudflare/next-on-pages`
  (pinned **1.13.12**: the last version whose peer range allows our pinned
  Next 14.2.35; newer versions require Next ≥ 14.3 and the Next 15 migration
  is not authorized) plus `pages:build` / `pages:dev` scripts.
- `NEXT_PUBLIC_API_URL` is **baked in at build time**. The Pages project must
  set it to the deployed Workers backend URL (unknown until the backend
  deploys — the local verification build used the placeholder
  `https://__DEPLOYED_WORKERS_BACKEND_URL__`). The Vercel frontend keeps
  working with the old value until cutover.

## Environment checklist

### Workers backend (`npx wrangler secret put <NAME>` — never commit values)

| Name | Notes |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (`-pooler` host). Same DB — no migration needed. |
| `DIRECT_URL` | Neon direct host. Only used for local `prisma migrate` runs — not needed by the Worker. |
| `JWT_SECRET` | **Same value as the Vercel backend** — keeps existing user sessions valid. |
| `TOKEN_ENCRYPTION_KEY` | **Same value as the Vercel backend** — existing Google Fit tokens depend on it. |
| `GROQ_API_KEY` | Groq free tier (chat / recipes / forecast). Same key as today. |
| `GEMINI_API_KEY` | Gemini vision — food detection only. Same key as today. |
| `GOOGLE_FIT_CLIENT_ID` / `GOOGLE_FIT_CLIENT_SECRET` | Same OAuth client. ⚠️ After the backend deploys, add the new redirect URI `<WORKERS_URL>/api/integrations/google-fit/callback` in the Google Cloud Console (Authorized redirect URIs), or Google Fit connect breaks. |
| `MAILER_WEBHOOK_URL` | Optional. Unset = console stub (same as today's backend). |
| `ALLOWED_ORIGINS` | Optional extra CORS origins (comma-separated). |

Non-secret config lives in `wrangler.toml` `[vars]`: `FRONTEND_URL`,
`BACKEND_URL` (update after first deploy), `GROQ_MODEL`, `AI_DAILY_CAP`.

### Pages frontend (Cloudflare dashboard → Pages → Settings → Environment variables)

| Name | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | **Build-time** — set to the deployed Workers URL, then trigger a rebuild. |

## Deploy order (only on Aarya's explicit go-ahead)

```bash
# 0. Cloudflare account + API token created by Aarya; `npx wrangler login`
#    (or CLOUDFLARE_API_TOKEN env). From ~/workspace/nutri-ai/app/backend-worker:

# 1. Secrets (values typed by Aarya, never committed):
npx wrangler secret put DATABASE_URL
npx wrangler secret put DIRECT_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put TOKEN_ENCRYPTION_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GOOGLE_FIT_CLIENT_ID
npx wrangler secret put GOOGLE_FIT_CLIENT_SECRET

# 2. Deploy the backend (verifies the bundle; no traffic yet):
npx wrangler deploy
# → note the URL, e.g. https://nutriai-backend.<account>.workers.dev

# 3. Update wrangler.toml BACKEND_URL to that URL (and Google Cloud Console
#    redirect URIs), then:
npx wrangler deploy

# 4. Smoke-test the worker directly (see "Verify" below).

# 5. Create the Cloudflare Pages project (dashboard or `npx wrangler pages project create`):
#    - Build command:  npx @cloudflare/next-on-pages
#    - Build output:   .vercel/output/static  (handled by next-on-pages)
#    - Env: NEXT_PUBLIC_API_URL = <workers URL from step 2>
#    - Or via CLI: npx wrangler pages deploy .vercel/output/static --project-name nutriai-frontend

# 6. Update BACKEND_URL/FRONTEND_URL vars, redeploy backend once.

# 7. Full end-to-end verification (below). Only then switch users over.
```

## Verify end-to-end

```bash
W=https://nutriai-backend.<account>.workers.dev
curl $W/health                       # {"status":"ok",...}
# Register a throwaway user, log a meal, hit an AI endpoint once:
curl -X POST $W/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"T","email":"t@example.com","password":"longenoughpw123"}'
# → expect 201 + token pair. Save the token:
T=<token>
curl $W/api/meals -H "Authorization: Bearer $T"                       # []
curl -X POST $W/api/meals -H "Authorization: Bearer $T" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Oats","calories":300,"mealType":"Breakfast"}'           # 201
curl $W/api/coaching/targets -H "Authorization: Bearer $T"             # macros
curl $W/api/integrations/google-fit/status -H "Authorization: Bearer $T"
```

Then on the Pages URL: sign in with the throwaway user, log a meal, send one
chat message (checks Groq), and — if credentials are configured — connect
Google Fit and run one sync.

## Retiring the Vercel deployments (Aarya's call — do NOT delete anything yet)

1. Keep both Vercel projects for at least a week after cutover as instant
   rollback (redeploy = set `NEXT_PUBLIC_API_URL` back to the Vercel backend).
2. When confident: Vercel dashboard → each project → Settings → delete
   (frontend first, backend last). Also remove the Vercel env vars at that
   point. Until then, the old stack costs nothing extra on the hobby plan.

## Free-tier notes

- Workers free: 100k requests/day, 10 ms CPU/invocation — the bcrypt-upgrade
  caveat above is the one known pressure point; all other routes are plain
  fetch + one Neon round-trip, well inside limits.
- Pages free: unlimited static requests, 500 builds/month.
- Neon free tier: unchanged — same database, no new cost.
- Nothing in this migration requires a card.
