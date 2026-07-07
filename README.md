# Chess Tournament Management System

A full-stack tournament management platform: player CRUD, tournament creation, registration with waiting-list handling, Swiss/Round-Robin/Knockout pairing generation, live match scoring, and an animated admin dashboard.

## Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT auth, Socket.io, Zod validation
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form + Zod, Recharts
- **Infra:** Docker, Docker Compose, Nginx (frontend serving)

## What's built so far

This is being delivered incrementally. Completed so far:

| Module | Status |
|---|---|
| Auth (register/login/refresh/forgot-reset/change password/profile) | ✅ Done |
| Players (CRUD, search/filter/sort/pagination, soft delete/recycle bin, match history, stats) | ✅ Done |
| Tournaments (CRUD, registration with auto waiting-list, capacity handling) | ✅ Done |
| Matches & Rounds (Swiss / Round-Robin / Knockout pairing engine, live match lifecycle, Socket.io broadcasts) | ✅ Done |
| Dashboard (stat cards, charts, recent activity) | ✅ Done |
| Players / Tournaments / Leaderboard / Settings UI | ✅ Done |
| Reports, notifications, exports (CSV/PDF), admin activity log, recycle-bin UI | 🔜 Not yet built |
| Automated tests: pairing engine (12 tests), player validators (11 tests), ApiError (6 tests) — 29/29 passing | ✅ Started |
| Swagger docs are wired up and live at `/api-docs` | ✅ Done |

## Getting started

### Option A — Docker (recommended)

```bash
cp backend/.env.example backend/.env    # edit secrets before real use
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/v1
- API docs (Swagger): http://localhost:5000/api-docs

### Option B — Local dev

**Backend**
```bash
cd backend
cp .env.example .env       # set DATABASE_URL, JWT secrets
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed        # creates admin@chesstournament.com / Admin@12345
npm run dev
```

**Frontend**
```bash
cd frontend
cp .env.example .env       # set VITE_API_URL if not default
npm install
npm run dev
```

Default seeded admin login: `admin@chesstournament.com` / `Admin@12345` — change this immediately after first login.

## Project structure

```
chess-tournament-system/
├── backend/
│   ├── prisma/schema.prisma       # 11 models: User, Player, Tournament, TournamentPlayer,
│   │                               # Round, Match, Result, Ranking, Notification, ActivityLog, Setting
│   └── src/
│       ├── config/                # env, prisma client, logger, swagger
│       ├── controllers/           # auth, player, tournament, match
│       ├── services/              # business logic + pairing.engine.ts (Swiss/RR/Knockout)
│       ├── middleware/            # auth, security (helmet/cors/rate-limit/xss/hpp), validation, errors
│       ├── routes/                # REST endpoints, mounted under /api/v1
│       └── validators/            # Zod request schemas
└── frontend/
    └── src/
        ├── pages/                 # Login, Dashboard, Players, Tournaments, Leaderboard, Settings, 404
        ├── layouts/                # DashboardLayout (sidebar + topbar)
        ├── components/            # StatCard, DashboardSkeleton
        ├── store/                 # AuthContext, ThemeContext + hooks
        ├── services/               # axios client with auto token refresh
        └── hooks/                 # data-fetching hooks (TanStack Query)
```

## API overview

All endpoints are namespaced under `/api/v1` and documented interactively at `/api-docs`. Highlights:

- `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`
- `GET/POST/PATCH/DELETE /players`, `/players/:id`, plus `/players/recycle-bin`, `/players/:id/restore`, `/players/:id/statistics`, `/players/:id/match-history`
- `GET/POST/PATCH/DELETE /tournaments`, `/tournaments/:id`, plus `/tournaments/:id/registrations` (bulk register with automatic waiting-list overflow)
- `GET/POST /tournaments/:id/rounds` (generates next round's pairings based on tournament type)
- `GET /tournaments/:id/matches`, `POST /matches/:matchId/start|pause|resume|finish`

All list endpoints support `page`, `limit`, `search`, `sortBy`, `sortOrder`, and relevant filters, and return a consistent envelope: `{ success, message, data, pagination? }`.

## A note on the pairing engine

`backend/src/services/pairing.engine.ts` is pure, dependency-free logic (round-robin circle method, seeded knockout brackets with bye padding, Swiss pairing with rematch avoidance). It's covered by a manual verification run during development confirming zero duplicate pairings and correct bye handling — a proper Jest suite for it is on the near-term roadmap.

## Known environment note

If you see Prisma engine download errors in a network-restricted sandbox, that's an outbound-network restriction of that environment, not a code issue — `prisma generate` needs to fetch its engine binary from `binaries.prisma.sh`. It resolves normally on any machine, CI runner, or the Docker build here with standard internet access.
