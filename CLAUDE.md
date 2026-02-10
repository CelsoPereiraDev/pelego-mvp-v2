# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pelego MVP** is a monorepo containing a full-stack football/soccer league management system. It tracks players, weekly matches, statistics, automatically generates balanced teams using optimization algorithms, and manages awards/prizes.

**Monorepo Structure:**
- `front-pelego-mvp/` - Next.js 14 frontend application
- `back-pelego-mvp/` - Fastify REST API backend with Prisma ORM

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

# Run migrations first
npm run migrate:dev

# Start development server
npm run dev
# API runs at http://localhost:3334/api
```

### Working with Both Services

The frontend expects the backend API to be running at `http://localhost:3334/api`. When developing features that span both frontend and backend:

1. Start backend first: `cd back-pelego-mvp && npm run dev`
2. Start frontend in separate terminal: `cd front-pelego-mvp && npm run dev`
3. Make backend changes first, then update frontend to consume new endpoints

## Monorepo Conventions

### Communication Between Services

**API Contract:** Frontend communicates with backend via REST API at `/api` prefix.

Frontend uses the `QueryRequest` wrapper class to make all API calls:
```typescript
// Frontend pattern
import { QueryRequest } from '@/utils/QueryRequest'

const getPlayers = () =>
  new QueryRequest<PlayerResponse[]>().get('/players')
```

Backend uses Fastify with Zod schema validation:
```typescript
// Backend pattern
app.withTypeProvider<ZodTypeProvider>().get('/players', {
  schema: { response: { 200: z.array(playerSchema) } }
}, async (request, reply) => { /* ... */ })
```

### Shared Types

While types are duplicated between frontend (`front-pelego-mvp/src/types/`) and backend (inferred from Prisma schema), they must remain synchronized. When changing data models:

1. Update Prisma schema in `back-pelego-mvp/prisma/schema.prisma`
2. Run migrations: `npm run migrate:dev`
3. Update frontend types in `front-pelego-mvp/src/types/`
4. Update Zod schemas in both `back-pelego-mvp` route handlers and `front-pelego-mvp/src/schema/`
5. Update mappers in `front-pelego-mvp/src/mapper/` if form structures change

### Testing Strategy

**Backend:** Run tests with `npm test` (uses test environment with `.env.test`)

**Frontend:** No test suite currently configured. Manual testing via development server.

## Architecture Overview

### Request Flow

```
User Browser
    ↓
Next.js App (localhost:3000)
    ↓
QueryRequest wrapper
    ↓
Fastify API (localhost:3334/api)
    ↓
Route handler with Zod validation
    ↓
Prisma ORM
    ↓
SQLite Database
```

### Data Flow for Match Creation

```
Frontend:
  MatchForm (src/app/match/[weekId]/page.tsx)
    ↓
  mapFormDataToBackend() (src/mapper/createMatches.ts)
    ↓
  useCreateMatch() hook (src/services/matchs/useCreateMatch.ts)
    ↓
  QueryRequest.post('/matches')

Backend:
  POST /api/matches handler (src/routes/create/create_match.ts)
    ↓
  Zod schema validation
    ↓
  Prisma transactions creating Match, Goals, Assists
    ↓
  Database persistence
```

## Key Concepts

### Player Overall System

Players have six attributes (pace, shooting, passing, dribble, defense, physics) plus overall rating.

- **Frontend:** Calculates overall using `calculateOverall()` utility
- **Backend:** Stores overall as JSON string, generated via `generateOverall()` utility
- **Positions:** MEI (midfielder), ATK (attacker), DEF (defender), GOL (goalkeeper)

### Week & Team Structure

The system organizes matches into weekly events:

1. **Week** created with a date
2. **Teams** generated (balanced via hill climbing algorithm on frontend)
3. **Matches** created between teams
4. **Goals/Assists** tracked per match
5. **Statistics** aggregated across weeks for awards

### Award System

Two-level prize system:

**Monthly Prizes:**
- MVP (most championship weeks)
- LVP (lowest performance)
- Best scorer, assistant, defender, pointer
- Calculated via `calculateMonthResume()` on frontend

**Yearly Prizes:**
- Aggregated from monthly data
- Stored in `YearIndividualPrizes` table

### Team Balancing Algorithm

The hill climbing algorithm (`src/utils/createTeam.tsx` in frontend) generates balanced teams:

1. Randomly distributes players into teams
2. Runs 10,000 iterations of random swaps
3. Keeps swaps that minimize overall difference between strongest and weakest team
4. Returns optimally balanced teams

This runs on the frontend and sends finalized teams to the backend.

## Environment Configuration

### Backend Environments

Three environment files (all gitignored):
- `.env` - Development
- `.env.test` - Test environment
- `.env.stage` - Staging

Scripts use `env-cmd` to load appropriate file.

**Important:** `src/lib/prisma.ts` has a hardcoded database URL (`file:./dev.db`) that overrides `DATABASE_URL` environment variable. To use different databases per environment, remove this hardcoded override.

### Frontend Environment

Frontend expects:
- `NEXT_PUBLIC_API_URL` - Backend API URL (defaults to `http://localhost:3334/api`)

## Development Workflow Patterns

### Adding a New Feature End-to-End

1. **Database Schema** (if needed):
   ```bash
   cd back-pelego-mvp
   # Edit prisma/schema.prisma
   npm run migrate:dev
   ```

2. **Backend API Endpoint**:
   - Add route handler in `src/routes/<method>/<name>.ts`
   - Define Zod validation schema
   - Implement Prisma queries
   - Register route in `src/server.ts`

3. **Frontend Types**:
   - Add/update type in `src/types/<domain>.ts`
   - Create Zod schema in `src/schema/<domain>/`

4. **Frontend Service Layer**:
   - Add API call to `src/services/<domain>/resources.ts`
   - Create SWR hook in `src/services/<domain>/use<Name>.ts`

5. **Frontend UI**:
   - Create page in `src/app/<feature>/page.tsx`
   - Use service hook for data fetching
   - Add forms with React Hook Form + Zod validation

### Debugging API Communication

If frontend can't reach backend:

1. Check backend is running: `curl http://localhost:3334/api/players`
2. Check CORS configuration in `back-pelego-mvp/src/server.ts`
3. Verify `NEXT_PUBLIC_API_URL` environment variable
4. Check browser network tab for actual request URL
5. Verify Fastify route registration in server startup logs

### Database Migrations

When changing database schema:

```bash
cd back-pelego-mvp

# Create migration
npm run migrate:dev
# Name your migration descriptively

# Regenerate Prisma client
npm run generate:dev

# For test environment
npm run migrate:test
npm run generate:test
```

## Common Pitfalls

1. **Port Confusion:** Backend listens on 3334 but console log says 3333 (server.ts bug)
2. **Database Override:** Prisma client ignores DATABASE_URL due to hardcoded path
3. **Form Mappers:** Always use mappers when sending form data to API (data structures differ)
4. **API Prefix:** All backend routes need `/api` prefix when called from frontend
5. **Overall JSON:** Player overall is stored as JSON string, not individual columns
6. **SWR Cache:** Frontend uses SWR caching - use `mutate()` to refresh after mutations

## Tech Stack Summary

**Frontend:**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn UI
- React Hook Form + Zod
- SWR for data fetching
- Recharts for visualizations

**Backend:**
- Fastify (Node.js framework)
- TypeScript
- Prisma ORM
- SQLite database
- Zod validation via fastify-type-provider-zod

## Further Reading

For detailed architectural guidance:
- Frontend: See `front-pelego-mvp/CLAUDE.md`
- Backend: See `back-pelego-mvp/CLAUDE.md`
