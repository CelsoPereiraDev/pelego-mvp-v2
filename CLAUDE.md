# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pelego MVP** is a monorepo containing a full-stack football/soccer league management system. It tracks players, weekly matches, statistics, automatically generates balanced teams using optimization algorithms, and manages awards/prizes. It supports multi-tenancy via "Futs" (football groups), role-based access control, and Google authentication.

**Monorepo Structure:**
- `front-pelego-mvp/` - Next.js 14 frontend application
- `back-pelego-mvp/` - Fastify REST API backend with Firebase Admin SDK

Each subdirectory has its own detailed CLAUDE.md file with specific architectural guidance.

## Quick Start

### Frontend Development
```bash
cd front-pelego-mvp
npm install
npm run dev
# Opens at http://localhost:3000
```

### Backend Development
```bash
cd back-pelego-mvp
npm install
npm run dev
# API runs at http://localhost:3334/api
```

### Working with Both Services

The frontend reads most data directly from Firestore (real-time listeners). The backend API handles write operations and complex server-side calculations. When developing:

1. Start backend first: `cd back-pelego-mvp && npm run dev`
2. Start frontend in separate terminal: `cd front-pelego-mvp && npm run dev`
3. Write operations go through the backend API; read operations use Firestore SDK directly

## Architecture Overview

### Hybrid Architecture

**Reads:** Frontend reads directly from Firestore using `onSnapshot` listeners for real-time updates (players, weeks, teams, matches).

**Writes:** Frontend sends mutations to Fastify backend API, which writes to Firestore and handles complex business logic (creating weeks with matches, calculating stats, managing awards).

**Auth:** Firebase Authentication with Google sign-in. Backend validates Firebase ID tokens via middleware.

### Request Flow — Reads (Real-Time)
```
User Browser
    ↓
Next.js App (localhost:3000)
    ↓
Firestore onSnapshot listeners (useFirestoreCollection / useFirestoreDocument)
    ↓
Firebase Firestore (cloud)
```

### Request Flow — Writes
```
User Browser
    ↓
Next.js App (localhost:3000)
    ↓
QueryRequest wrapper (with Firebase Auth token)
    ↓
Fastify API (localhost:3334/api)
    ↓
Auth middleware (verifies Firebase token)
    ↓
Firestore DAL (src/lib/firestore.ts)
    ↓
Firebase Firestore (cloud)
```

### Multi-Tenancy (Futs)

All data is scoped under `/futs/{futId}/`. Users can belong to multiple Futs with different roles:
- `admin` — full read/write access
- `user` — read + limited write
- `viewer` — read only

Frontend uses `FutContext` for the active Fut, and `RoleGate` component for role-based UI.

## Monorepo Conventions

### Communication Between Services

**Writes:** Frontend uses `QueryRequest` wrapper to call backend API:
```typescript
import { QueryRequest } from '@/utils/QueryRequest'
const createPlayer = (futId, data) =>
  new QueryRequest<PlayerResponse>().post(`futs/${futId}/create_players`, data)
```

**Reads:** Frontend uses Firestore hooks directly:
```typescript
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
const { data, loading } = useFirestoreCollection('futs/${futId}/players', converter)
```

### Shared Types

Types are defined in frontend (`front-pelego-mvp/src/types/`) and backend (`back-pelego-mvp/src/lib/firestore.ts` interfaces). When changing data models:

1. Update Firestore interfaces in `back-pelego-mvp/src/lib/firestore.ts`
2. Update frontend types in `front-pelego-mvp/src/types/`
3. Update converters in `front-pelego-mvp/src/services/firestore/converters.ts`

## Key Concepts

### Player Overall System

Players have six attributes (pace, shooting, passing, dribble, defense, physics) plus overall rating.

- **Frontend:** Calculates overall using `calculateOverall()` utility
- **Firestore:** Stored as JSON object in player document
- **Positions:** MEI (midfielder), ATK (attacker), DEF (defender), GOL (goalkeeper)

### Week & Team Structure

The system organizes matches into weekly events:

1. **Week** created with a date (`futs/{futId}/weeks/{weekId}`)
2. **Teams** generated, balanced via hill climbing algorithm (`futs/{futId}/weeks/{weekId}/teams/`)
3. **Matches** created between teams (`futs/{futId}/weeks/{weekId}/matches/`)
4. **Goals/Assists** embedded in match documents
5. **Statistics** calculated server-side via `calculateMonthResume()`

### Firestore Data Structure

```
/futs/{futId}
  /players/{playerId}
  /weeks/{weekId}
    /teams/{teamId}      — playerIds[], champion, points
    /matches/{matchId}   — goals[], assists[], result embedded
  /members/{userId}      — role, linkedPlayerId
```

### Team Balancing Algorithm

The hill climbing algorithm (`src/utils/createTeam.tsx` in frontend) generates balanced teams:

1. Randomly distributes players into teams
2. Runs 10,000 iterations of random swaps
3. Keeps swaps that minimize overall difference between strongest and weakest team
4. Returns optimally balanced teams

This runs on the frontend and sends finalized teams to the backend.

## Environment Configuration

### Backend Environments

Environment files (all gitignored):
- `.env` - Development (includes Firebase service account path)
- `.env.test` - Test environment

Required env vars: `GOOGLE_APPLICATION_CREDENTIALS` (path to Firebase service account JSON)

### Frontend Environment

Frontend expects:
- `NEXT_PUBLIC_API_URL` - Backend API URL (defaults to `http://localhost:3334/api`)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase project config (apiKey, authDomain, projectId, etc.)

## Development Workflow Patterns

### Adding a New Feature End-to-End

1. **Backend — Firestore DAL** (if new data):
   - Add interface + CRUD functions in `src/lib/firestore.ts`

2. **Backend — API Endpoint**:
   - Add route handler in `src/routes/futs/scoped-routes.ts`
   - Include membership verification and role check

3. **Frontend — Types**:
   - Add/update type in `src/types/<domain>.ts`

4. **Frontend — Service Layer**:
   - For reads: use `useFirestoreCollection` or `useFirestoreDocument` hooks
   - For writes: add API call to `src/services/<domain>/resources.ts`
   - Add converter in `src/services/firestore/converters.ts` if needed

5. **Frontend — UI**:
   - Create page in `src/app/<feature>/page.tsx`
   - Use service hooks for data fetching
   - Wrap admin-only features with `<RoleGate allow={['admin']}>`

## Common Pitfalls

1. **Form Mappers:** Always use mappers when sending form data to API (data structures differ)
2. **API Prefix:** All backend routes need `/api` prefix when called from frontend
3. **Overall JSON:** Player overall is stored as JSON object in Firestore
4. **Firestore Listeners:** Data updates automatically via `onSnapshot` — no manual refresh needed after writes
5. **Fut Scoping:** All data operations must include `futId` — never access data without a Fut context

## Tech Stack Summary

**Frontend:**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn UI
- React Hook Form + Zod
- Firebase SDK (Firestore real-time listeners + Auth)
- Recharts for visualizations

**Backend:**
- Fastify (Node.js framework)
- TypeScript
- Firebase Admin SDK (Firestore)
- Zod validation via fastify-type-provider-zod

## Further Reading

For detailed architectural guidance:
- Frontend: See `front-pelego-mvp/CLAUDE.md`
- Backend: See `back-pelego-mvp/CLAUDE.md`
