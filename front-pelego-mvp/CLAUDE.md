# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pelego MVP** is a football/soccer statistics and team management application built with Next.js 14. The app manages weekly matches, tracks comprehensive player statistics, generates balanced teams using optimization algorithms, and produces detailed analytics with monthly/yearly awards.

Core features:
- Weekly match management with goals, assists, and own goals tracking
- Player profiles with 6 attributes (pace, shooting, passing, dribble, defense, physics)
- Hill climbing algorithm for automatic team balancing
- Time-filtered statistics (monthly/yearly leaderboards)
- Sophisticated award system (MVP, best scorer, best defender, best assistant, etc.)
- Individual player analytics and year-end wrap-ups

## Development Commands

```bash
# Run development server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

**API Backend:** The app connects to a REST API at `http://localhost:3334/api` (configured via `NEXT_PUBLIC_API_URL` or defaults to localhost:3334).

## Architecture

This codebase follows a **modular layered architecture** with clear separation of concerns:

```
UI Layer (Next.js App Router)
    ↓
Service Layer (SWR Custom Hooks)
    ↓
API Resources (QueryRequest wrapper)
    ↓
Mappers (Form ↔ Backend transformation)
    ↓
External API (localhost:3334)
```

### Key Architectural Patterns

1. **Service Layer Pattern**: Each domain has `resources.ts` (raw API calls) + custom hooks (SWR-based state management)
2. **Mapper Pattern**: All form submissions pass through mappers before reaching the API (see `src/mapper/`)
3. **Repository Pattern**: `resources.ts` files expose API endpoints as typed functions
4. **Custom Hooks with SWR**: Data fetching with automatic caching and revalidation
5. **Type-Safe API Calls**: `QueryRequest<ResponseType, PayloadType>` generic wrapper handles all HTTP operations

## Service Layer Organization

Services follow a strict pattern: `services/<domain>/resources.ts` + `services/<domain>/use*.ts`

### Pattern Example

```typescript
// services/player/resources.ts - Raw API client
export const getPlayers = () => new QueryRequest<PlayerResponse[]>().get('/players')

// services/player/usePlayers.ts - SWR hook with business logic
export const usePlayers = () => {
  const { data, error, mutate } = useSWR('/players', getPlayers)
  return { players: data, isLoading: !error && !data, mutate }
}
```

**Important**: Always use the `QueryRequest` class for API calls. It handles headers, error handling, and type safety.

### Service Domains

- **player**: Player CRUD operations (`getPlayers`, `getPlayer`, `createPlayer`, `editPlayer`, `deletePlayer`)
- **matchs**: Match creation and management (`createMatch`, `createMatches`, `getMatchById`, `getMatches`, `deleteMatch`)
- **weeks**: Week management (`getWeekById`, `getWeeks`, `getWeeksByDate`, `deleteWeek`)
- **teams**: Team operations (`getTeams`, `updateTeams`)
- **goals**: Goal creation (`createGoals`)

## Mapper Pattern Architecture

Mappers bridge the gap between frontend form structures and backend API contracts. **Always use mappers** when transforming form data to API payloads.

### Key Mappers

- **createMatches.ts**: `mapFormDataToBackend()` - Transforms nested match form data to flattened API structure
- **defaultValueMatches.ts**: `mapWeekToFormValues()` - Hydrates forms with existing week data
- **formToPlayerMapper.ts**: Converts player form submissions to Player type
- **playerStatMapper.ts**: Calculates aggregated player statistics from week data
- **allPlayersStatsMapper.ts**: Comprehensive player statistics aggregation

### Why Mappers Matter

Form structures use nested arrays and index-based references (e.g., `homeTeamId: "0"`) while the API expects flattened structures with UUIDs. Mappers handle this transformation, making the frontend and backend independent.

## Important Directories

### `src/app/` - Next.js App Router

Uses Next.js 14 App Router with extensive dynamic routing:

- Time-filtered routes: `/top-scorer/[year]/[month]`, `/stat-resume/[year]/[month]`
- Player routes: `/player/[playerSlug]`, `/wrapped/[playerSlug]`
- Match management: `/match/[weekId]`, `/week/[weekId]`

**Convention**: Month and year parameters are optional in most statistics pages. Always check for their presence.

### `src/utils/` - Business Logic Calculations

Contains pure functions for statistics and team generation:

- **createTeam.tsx**: `hillClimbing()` algorithm - Optimizes team balance through 10,000 iterations of random swaps
- **calculateMonthResume.tsx**: `calculateMonthResume()` - Orchestrates entire award system (MVP, LVP, top scorers, etc.)
- **calculateAssists.tsx**: Aggregates assist statistics across weeks
- **calculateBestDefender.tsx**: Calculates goals-against averages
- **calculateBestOfPositions.tsx**: Position-weighted scoring for ATK/MEI/DEF/GOL

**Pattern**: Utilities are pure functions that accept data and return calculated results. No side effects.

### `src/types/` - TypeScript Definitions

Core domain types:

- **Player**: `id`, `name`, `position` (enum: MEI/ATK/DEF/GOL), `overall` (6 attributes), `country`, `image`, prize tracking
- **Match**: Game records with `goals[]`, `assists[]`, team IDs, results
- **Week**: Container for matches with `date`, `teams[]`, matchups
- **Team**: Team composition with `players[]`, calculated `overall`, `champion` boolean

**Convention**: Types ending in `Response` are backend return formats. Types ending in `DataRequested` are API payload formats.

### `src/components/` - React Components

Key reusable components:

- **MatchForm**: Complex form for entering match details (goals, assists, own goals)
- **SelectWithSearch**: Heavily used multi-select dropdown with search (for players, teams)
- **Field**: Team lineup/field visualization
- **PlayerCard/PlayerCardSmall**: Player info displays
- **Chart components**: RadarGrahic, RadialChart, BarChart for statistics
- **ui/**: shadcn UI primitives (Button, Card, Dialog, etc.)

## Data Flow Patterns

### Typical Data Flow: Creating Matches

```
User fills MatchForm
    ↓
handleCreateMatches() triggered
    ↓
mapFormDataToBackend() [Mapper transforms data]
    ↓
useCreateMatches() [SWR hook]
    ↓
createMatches() [resources.ts]
    ↓
QueryRequest.post() [HTTP wrapper]
    ↓
External API response
    ↓
Calculate team points from results
    ↓
updateTeams() to save champion status
    ↓
SWR cache update + UI refresh
```

### Reading Data Flow

```
Component mounts
    ↓
useWeeks() / usePlayers() / etc. [SWR hook]
    ↓
SWR checks cache
    ↓
If stale: resources.ts → QueryRequest → fetch()
    ↓
SWR updates cache
    ↓
Component renders with data
```

## Special Conventions

### 1. Portuguese Naming

The codebase uses extensive Portuguese naming. Maintain this convention:
- Variable names: `participatedWeeks`, `jogadores`, `equipes`
- Component class names may use Portuguese terms
- Keep consistency with existing naming patterns

### 2. Time-Based Filtering Pattern

Most statistics pages support optional year/month filtering:

```typescript
// URL patterns
/stat-resume/[year]              // Yearly summary
/stat-resume/[year]/[month]      // Monthly summary

// Service calls
getWeeksByDate(year, month?)     // month is optional
```

Always handle both cases (with and without month parameter).

### 3. Award System Logic

The `calculateMonthResume()` function orchestrates a sophisticated award system:

- **MVP**: Most championship weeks (requires minimum participation)
- **LVP**: Lowest point percentage
- **Top 5 Categories**: Best scorer, assistant, defender, pointer
- **Tie-breaking**: Uses matches played and points percentage
- **Maximum 9 players per category** (5th place + ties)

When modifying award logic, always check this function first.

### 4. Hill Climbing Algorithm

The homepage uses `hillClimbing()` to generate balanced teams:

```typescript
hillClimbing(selectedPlayers, numberOfTeams, 10000)
```

The algorithm:
1. Starts with random team distribution
2. Performs 10,000 iterations of random player swaps
3. Keeps swaps that minimize the difference between strongest and weakest team
4. Returns optimally balanced teams

### 5. Form Structure Complexity

Forms use deeply nested field arrays with React Hook Form:

```typescript
// Dynamic structure
teams[].players[]                    // Multiple teams with multiple players
matches[].homeGoals.whoScores[]      // Multiple goals per match
matches[].homeAssists[]              // Multiple assists
```

Use `useFieldArray()` for dynamic form sections and `Controller` for custom inputs.

### 6. Match Champion Calculation

After matches are created:
1. Calculate points: Win = 3pts, Draw = 1pt each
2. Find team(s) with maximum points
3. If tie: Multiple teams can be co-champions (`champion: true`)
4. Update all players in champion teams with prize tracking

## Path Aliases

The project uses `@/*` path alias configured in `tsconfig.json`:

```typescript
import { Player } from '@/types/player'
import { usePlayers } from '@/services/player/usePlayers'
import { calculateMonthResume } from '@/utils/calculateMonthResume'
```

Always use path aliases instead of relative imports.

## Form Validation

Forms use Zod schemas defined in `src/schema/<domain>/`:

```typescript
import { playerOverallSchema } from '@/schema/player'

const form = useForm({
  resolver: zodResolver(playerOverallSchema)
})
```

When modifying forms, update the corresponding Zod schema first.

## Common Development Patterns

### Adding a New Statistics Page

1. Create route: `src/app/<stat-name>/[year]/[month]/page.tsx`
2. Add calculation utility: `src/utils/calculate<StatName>.tsx`
3. Use existing chart components: `RadarGrahic`, `BarChart`, etc.
4. Apply time filtering: `getWeeksByDate(year, month?)`
5. Add route to `MainMenu` component

### Adding a New Service Endpoint

1. Add to `services/<domain>/resources.ts`:
   ```typescript
   export const newEndpoint = (payload) =>
     new QueryRequest<ResponseType, PayloadType>()
       .post('/endpoint', payload)
   ```
2. Create SWR hook in `services/<domain>/useNewEndpoint.ts`
3. Update types in `src/types/<domain>.ts`
4. Add mapper if form transformation needed

### Modifying API Contracts

1. Update type definitions in `src/types/`
2. Update mappers in `src/mapper/` (bidirectional)
3. Update Zod schemas in `src/schema/`
4. Test form submissions and data display

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn UI components
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Charts**: Recharts
- **UI Components**: Material-UI + shadcn UI + custom components

## Key Files to Understand

To understand this codebase quickly, read these files in order:

1. `src/utils/calculateMonthResume.tsx` - Heart of the award system
2. `src/mapper/createMatches.ts` - Demonstrates mapper pattern
3. `src/services/player/resources.ts` + `usePlayers.ts` - Service layer pattern
4. `src/app/match/[weekId]/page.tsx` - Complex form with nested data
5. `src/utils/createTeam.tsx` - Hill climbing algorithm
