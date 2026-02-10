# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a backend API for "Pelego MVP" - a football/soccer league management system. It tracks players, teams, weekly matches, goals, assists, scores, and various monthly/yearly prizes and achievements.

**Tech Stack:**
- Fastify web framework with TypeScript
- Prisma ORM with SQLite database
- Zod for schema validation via `fastify-type-provider-zod`
- env-cmd for environment management

## Development Commands

### Running the Application
```bash
# Development mode (uses .env)
npm run dev

# Development mode with test database (uses .env.test)
npm run dev:test
```

### Database Management
```bash
# Run Prisma migrations (dev environment)
npm run migrate:dev

# Run Prisma migrations (test environment)
npm run migrate:test

# Generate Prisma client (dev environment)
npm run generate:dev

# Generate Prisma client (test environment)
npm run generate:test
```

### Testing
```bash
# Run tests (uses .env.test)
npm test
```

## Architecture

### Application Entry Point
- **src/server.ts**: Main server file that:
  - Configures Fastify with Zod type provider for request/response validation
  - Registers CORS plugin (allows all origins)
  - Registers all route handlers with `/api` prefix
  - Starts server on port 3334 (note: console log incorrectly says 3333)

### Database Layer
- **src/lib/prisma.ts**: Prisma client singleton with query logging enabled
  - Hardcoded to use `file:./dev.db` (overrides DATABASE_URL from env)
  - This is a potential issue if you need to switch databases via environment variables

### Route Organization
Routes are organized by HTTP method in separate directories:
- **src/routes/create/**: POST endpoints for creating resources
- **src/routes/get/**: GET endpoints for retrieving resources
- **src/routes/edit/**: PUT/PATCH endpoints for updating resources
- **src/routes/delete/**: DELETE endpoints for removing resources

Each route file exports an async function that receives `FastifyInstance` and registers route handlers using Fastify's plugin pattern.

### Route Pattern
All routes follow this structure:
```typescript
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

export async function handlerName(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().method('/endpoint', {
    schema: {
      body: zodSchema  // or params, querystring, etc.
    }
  }, async (request, reply) => {
    // Implementation
  });
}
```

### Utility Functions
- **src/utils/createWeek.ts**: Creates a week with teams and player assignments
- **src/utils/createMatch.ts**: Creates matches between teams
- **src/utils/generateOverall.ts**: Utility for player overall stats calculation

### Data Model Key Concepts

**Week System:**
- Weeks contain Teams (multiple teams per week)
- Teams contain Players via TeamMember junction table
- Teams participate in Matches (as home or away team)

**Match & Stats:**
- Matches have Goals and Assists linked to specific players
- Goals can be regular (linked to playerId) or own goals (linked to ownGoalPlayerId)
- MatchResult stores the final score

**Player Achievements:**
- Players have boolean flags for current month prizes (monthChampion, monthStriker, etc.)
- MonthIndividualPrizes tracks historical monthly achievements with detailed prize info via MonthPrizeDetails
- YearIndividualPrizes tracks yearly achievements
- PlayerScore tracks points over time

**Player Overall:**
- Stored as JSON string in the database (not as separate fields)
- Contains: pace, shooting, passing, dribble, defense, physics, overall (all 0-100)

## Important Notes

### Database Connection
The Prisma client in `src/lib/prisma.ts` has a hardcoded database URL (`file:./dev.db`) which overrides the DATABASE_URL environment variable. To use different databases per environment, this hardcoded datasource should be removed.

### Environment Files
Three environment files exist:
- `.env` - development
- `.env.test` - test environment
- `.env.stage` - staging environment

All are gitignored. Scripts use env-cmd to load the appropriate file.

### Player Position Enum
Valid positions are: 'MEI' (midfielder), 'ATK' (attacker), 'DEF' (defender), 'GOL' (goalkeeper)

### Server Port Mismatch
The server listens on port 3334 but the console log says 3333 (see src/server.ts:64-65).
