# NutriAI — Setup Guide

AI-powered nutrition & fitness tracking: meal logging, workouts, water/weight
tracking, badges, recipes, and an AI coach — with an optional Python ML
microservice for food detection, forecasting and meal plans.

## Architecture

| Service      | Stack                    | Port |
|--------------|--------------------------|------|
| Frontend     | Next.js 14 (App Router)  | 3000 |
| Backend      | Express + Prisma (SQLite)| 5000 |
| ML service   | FastAPI (Python)         | 8000 |

## Prerequisites

- Node.js 18+
- Python 3.10+ (only if you want the ML service)

No PostgreSQL needed — the backend uses a local SQLite file (`dev.db`)
managed by Prisma. No cloud DB required for local development.

## Step 1 — Install everything

From the repo root:

```
npm run install:all
```

This installs the frontend deps, the backend deps, creates
`app/ml-service/venv`, and installs the ML service requirements.
(Works on Windows, macOS and Linux.)

## Step 2 — Configure the backend

```
cd app/backend
cp .env.example .env
```

Fill in `.env`:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET=<generate-a-long-random-string>
PORT=5000
FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=<your-key>   # optional — only needed for the AI coach/chat features
```

## Step 3 — Set up the database

```
cd app/backend
npx prisma migrate dev --name init   # creates dev.db from the schema
npx prisma db seed                   # optional — loads default badges
```

## Step 4 — Run it

From the repo root, everything at once:

```
npm start
```

Or each service on its own:

```
npm run frontend   # Next.js  → http://localhost:3000
npm run backend    # Express  → http://localhost:5000
npm run ml         # FastAPI  → http://localhost:8000
```

Health checks:

- Backend:  http://localhost:5000/health → `{"status":"ok"}`
- ML:       http://localhost:8000/docs (FastAPI Swagger UI)

The frontend reads the API URL from `app/frontend/.env.local`
(`NEXT_PUBLIC_API_URL`, already set to `http://localhost:5000`).

## Notes

- The ML service is optional. Meal/workout tracking, badges, recipes and
  stats work with just frontend + backend. ML-backed endpoints
  (food detection, forecasting, ML meal plans) return an error while it
  is down, and the AI coach falls back to Gemini via the backend.
- `dev.db` is a local-only SQLite file and is gitignored — each
  developer gets their own via `prisma migrate dev`.
- AI calls never expose keys to the browser: the frontend talks to
  `/api/ai/*` on the backend, which proxies to Gemini server-side.

## Testing

- Backend: `cd app/backend && npm test` — unit tests via the built-in
  `node:test` runner (zero extra dependencies). Covers meal-input
  validation/normalization (`utils/nutrition.js`) and the AES-256-GCM
  token crypto (`utils/tokenCrypto.js`).
- Frontend: `cd app/frontend && npm test` — Vitest suite for the food
  database (`lib/foods-db.js`): dataset integrity, search relevance,
  portion scaling, recents/favorites.

## Features

- **Meal logger** (`/meal-logger`): offline-first curated food database
  (140 Indian + global foods, hand-verified macros) with token-scored
  search, recently-logged foods, star favorites (+ favorites-only
  filter), and a 4-step portion sheet (½×–2×) with live macro preview.
  Voice input fills the search box; custom foods supported.
- **Nutrition math** (`app/backend/utils/nutrition.js`): pure,
  test-covered helpers — meal input normalization (clamps negatives,
  caps absurd values, validates meal type/date), macro summation and
  calorie-based macro split percentages.
- **Workout library**: exercise entries carry step-by-step instructions
  sourced from the public-domain `yuhonas/free-exercise-db` dataset
  (Unlicense), matched to the in-app workout programs.

## What was fixed vs the original zip

1. Missing routes (posts, water, weight, recipes) — all created
2. Server crash on startup from missing routes — safeRoute() wrapper added
3. API key exposed in browser — all AI calls proxied through backend
4. Dashboard infinite loading — 8-second timeout with error message added
