# Pelego MVP - Match Flow Complete Improvement Proposal

**Date:** December 22, 2024
**Project:** Pelego MVP Football League Management System
**Focus:** Match Creation & Editing Experience Overhaul

---

## Executive Summary

This document presents a comprehensive redesign of the match creation and editing flow in Pelego MVP. The current implementation suffers from critical UX and architectural issues including a confusing 2-step process, duplicate implementations with conflicting patterns, alert-based errors, and a 318-line monolithic form component.

### Current Problems

1. **Two competing implementations** with different patterns
2. **2-step process** requiring separate "Cadastrar Times" and "Cadastrar Partidas" clicks
3. **Alert-based errors** instead of inline validation
4. **Frontend champion calculation** (inconsistent with backend as source of truth)
5. **No edit functionality** accessible from UI
6. **Fragile index-based team IDs**
7. **Monolithic MatchForm component** (318 lines, deeply nested)
8. **Inconsistent icon libraries** (Material-UI + Lucide)

### Proposed Solution

**Consolidate to atomic single-transaction flow** with:
- Single "Save Week & Matches" button
- Backend champion calculation
- Zod validation with inline error display
- Modular component architecture (6+ reusable components)
- Full edit capability at `/week/[weekId]/edit`
- WCAG 2.1 AA accessibility compliance
- Consistent design system (Lucide icons, shadcn UI, Tailwind)

### Key Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Click count to create week | 2 submit buttons | 1 submit button | **-50%** |
| Component size (largest) | 318 lines | ~100 lines | **-68%** |
| Validation feedback | Alert popups | Inline + toast | **Better UX** |
| Edit capability | None | Full edit mode | **New feature** |
| Accessibility violations | Unknown | 0 (WCAG 2.1 AA) | **Compliant** |
| User error rate | High (no prevention) | Low (smart validation) | **-60% estimated** |

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [UX/UI Design Improvements](#2-uxui-design-improvements)
3. [Technical Architecture](#3-technical-architecture)
4. [Component Structure](#4-component-structure)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Migration Strategy](#6-migration-strategy)
7. [Testing & Validation](#7-testing--validation)
8. [Accessibility Specifications](#8-accessibility-specifications)
9. [Design System Integration](#9-design-system-integration)

---

## 1. Current State Analysis

### 1.1 Duplicate Implementations

**NEW FLOW** ([/app/match/page.tsx](front-pelego-mvp/src/app/match/page.tsx)):
- ✅ Single atomic operation
- ✅ Backend champion calculation
- ❌ No Zod validation (manual checks)
- ❌ Inline data mapping (bypasses mapper pattern)
- Uses: `useCreateWeekAndMatches()` → POST `/api/create_week_and_matches`

**OLD FLOW** ([/app/match/[weekId]/page.tsx](front-pelego-mvp/src/app/match/[weekId]/page.tsx)):
- ❌ Two-step process (teams → matches)
- ❌ Frontend champion calculation
- ✅ Zod validation with refinements
- ✅ Proper mapper pattern (`mapFormDataToBackend`, `mapWeekToFormValues`)
- Uses: `useCreateWeekWithTeams()` + `useCreateMatches()` + `useTeams().update()`

### 1.2 User Flow Pain Points

**Current (OLD FLOW):**
```
1. User navigates to /match/[weekId]
2. Fills date
3. Selects players for Team 1, Team 2, ...
4. Clicks "Cadastrar Times" → Backend creates teams → Alert success
5. Clicks "Adicionar Partida"
6. Selects home/away teams
7. Enters score (0-10)
8. Goal details section expands
9. Selects goal scorers (including own goals "GC")
10. Selects assist providers
11. Clicks "Cadastrar Partidas" → Backend creates matches
12. Frontend calculates champions → PATCH updates teams → Alert success
```

**Issues:**
- Step 5 only enabled after Step 4 succeeds
- If step 4 fails, must restart
- State stored in local variables (`createdTeams`, `weekId`)
- Refreshing page loses progress
- Complex state orchestration

### 1.3 Component Complexity

**MatchForm Component** ([components/MatchForm/index.tsx](front-pelego-mvp/src/components/MatchForm/index.tsx)):
- 318 lines
- Handles: team selection, score entry, goals, assists, own goals
- 4 levels of nesting (match → goals → players → own goal players)
- Local state for: `homeGoalsInputs`, `awayGoalsInputs`, `homeGoalsGC`, `awayGoalsGC`
- Uses `useWatch` for 4 different fields
- Difficult to test and maintain

### 1.4 Technical Debt

| Issue | Impact | Severity |
|-------|--------|----------|
| Duplicate implementations | Confusion, maintenance burden | **High** |
| Frontend business logic (champion calc) | Inconsistent with backend pattern | **High** |
| Index-based team IDs | Fragile, breaks on reorder | **Medium** |
| No mapper pattern in NEW flow | Inconsistent architecture | **Medium** |
| Alert-based errors | Poor UX, not screen reader friendly | **Medium** |
| No edit capability | Feature gap | **High** |
| Inconsistent icons | Design inconsistency | **Low** |

---

## 2. UX/UI Design Improvements

### 2.1 New Flow Architecture

**Proposed Single-Step Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  [←] Create Match Week                    [Auto-save: ✓]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📅 Week Date                                                │
│  ┌────────────────────────────┐                             │
│  │ December 15, 2025 ▼        │  [Calendar icon]            │
│  └────────────────────────────┘                             │
│                                                              │
│  ⚽ Teams Configuration                   [Collapse ▲]      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Team 1 (Overall: 85)      Team 2 (Overall: 83)      │  │
│  │ [Player multi-select]     [Player multi-select]     │  │
│  │ [+ Add Team]                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  🏆 Matches                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Match 1                                   [Delete]   │  │
│  │ Team 1  [2] × [1]  Team 2                           │  │
│  │ [+ Add Goal Details] ▼                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  [+ Add Match]                                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          [Save Week & Matches]                        │  │
│  │        (Disabled until form valid)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

**From 1 monolith → 6 focused components:**

```
WeekAndMatchesForm
├── WeekDateHeader
│   ├── DatePickerField (shadcn Popover + Calendar)
│   └── AutoSaveIndicator
│
├── TeamsSection (collapsible)
│   ├── TeamCard (repeatable)
│   │   ├── TeamHeader (name, overall badge)
│   │   ├── PlayerSelectField (multi-select)
│   │   └── TeamStats (overall display)
│   └── AddTeamButton
│
├── MatchesSection
│   ├── MatchCard (repeatable)
│   │   ├── MatchHeader (teams, score, delete)
│   │   ├── ScoreInputRow
│   │   └── GoalDetailsPanel (collapsible)
│   │       ├── GoalEntry (repeatable)
│   │       └── AssistEntry (repeatable)
│   └── AddMatchButton
│
└── FormFooter
    ├── ValidationSummary
    └── SaveButton
```

### 2.3 Interaction Improvements

**Progressive Disclosure:**
- Goal details only appear when score > 0
- Team overall calculated in real-time
- Visual balance indicator shows team strength

**Smart Defaults:**
- Auto-create goal entries based on score count
- Pre-populate 2 teams on page load
- Default to most recent players used

**Error Prevention:**
- Teams can't play against themselves (Zod refinement)
- Goal count must match sum of individual goals
- Own goal players must be from opposing team
- Players can't be on multiple teams simultaneously

**Visual Feedback:**
```typescript
// Color-coded team overalls
Overall 90+: Gold badge
Overall 80-89: Silver badge
Overall <80: Bronze badge

// Match validation states
✓ Valid match (green border)
⚠ Incomplete (yellow border)
✕ Invalid (red border)

// Loading states
Spinner + disabled form during save
Shimmer skeleton on data load
```

### 2.4 Keyboard Navigation

```typescript
Keyboard Shortcuts:
Alt + D → Focus date picker
Alt + T → Add new team
Alt + M → Add new match
Alt + S → Save (if valid)
Escape → Close dialog/collapse section
Enter → Confirm/expand
Tab/Shift+Tab → Navigate fields
```

**Focus Order:**
1. Date picker
2. Team 1 players
3. Team 2 players
4. Add team button
5. Match 1 home team
6. Match 1 home score
7. Match 1 away score
8. Match 1 away team
9. Goal details (if expanded)
10. Save button

### 2.5 Accessibility Features (WCAG 2.1 AA)

✅ **Color Contrast:**
- All text meets 4.5:1 minimum
- Interactive elements meet 3:1 minimum
- Non-color indicators for all states

✅ **Keyboard Operability:**
- All functions available via keyboard
- Visible focus indicators
- Logical tab order
- Skip links for long forms

✅ **Screen Reader Support:**
- ARIA labels on all form fields
- Live regions for dynamic updates
- Role attributes for custom components
- Meaningful alt text

✅ **Motion Preferences:**
- Respect `prefers-reduced-motion`
- Alternative static indicators
- No essential motion-only feedback

---

## 3. Technical Architecture

### 3.1 Architectural Decision

**Winner: Atomic Single-Transaction Pattern (NEW FLOW)**

**Rationale:**
- ✅ Data integrity (single transaction)
- ✅ Backend champion calculation (source of truth)
- ✅ Simpler state management
- ✅ Better UX (one submit)
- ✅ Prevents orphaned data

**Enhancements:**
- Add Zod validation (from OLD FLOW)
- Implement mapper pattern (from OLD FLOW)
- Add edit capability (new)
- Improve error handling (toast notifications)

### 3.2 Service Layer Architecture

```typescript
// New/Enhanced Hooks
useCreateWeekAndMatches() // Keep from NEW FLOW
useUpdateWeekAndMatches() // NEW - for edit mode
useWeekForm()             // NEW - shared form logic
useWeek(weekId)           // Keep - for data fetching

// Resources
createWeekAndMatches(data) → POST /api/create_week_and_matches
updateWeekAndMatches(weekId, data) → PATCH /api/update_week_and_matches/:weekId

// SWR Configuration
- Optimistic updates for edit mode
- Cache invalidation on mutations
- Error rollback on failure
```

### 3.3 Mapper Pattern

**Bidirectional mappers:**

```typescript
// Form → API (Create/Update)
mapFormToWeekAndMatches(formData: CreateMatchForm): CreateWeekAndMatchesRequest
- Converts team indices to player arrays
- Filters empty goals/assists
- Handles own goal transformations (GC → ownGoalPlayerId)

// API → Form (Edit)
mapWeekToFormValues(week: WeekResponse): CreateMatchForm
- Maps team UUIDs to array indices
- Separates goals into normal and own goals
- Deduplicates matches
- Formats date for datetime-local input
```

### 3.4 Route Structure

```
/match/new              → Create new week (WeekAndMatchesForm mode="create")
/week/[weekId]          → View week details (existing)
/week/[weekId]/edit     → Edit week (WeekAndMatchesForm mode="edit")
/weeks                  → List all weeks with edit buttons
```

**Navigation Changes:**
- Weeks list: Add "Editar" button → `/week/[weekId]/edit`
- Week detail: Add "Editar Semana" button → `/week/[weekId]/edit`
- Create button: `/match` → `/match/new`

### 3.5 Form Architecture

```typescript
// Unified form configuration
const form = useForm<CreateMatchForm>({
  resolver: zodResolver(CreateMatchSchema),
  defaultValues: week ? mapWeekToFormValues(week) : {
    date: '',
    teams: [{ players: [] }, { players: [] }],
    matches: []
  },
  mode: 'onBlur',
  reValidateMode: 'onChange'
});

// Field arrays
const { fields: teamFields, append, remove } = useFieldArray({
  control,
  name: 'teams'
});

const { fields: matchFields, append, remove } = useFieldArray({
  control,
  name: 'matches'
});
```

### 3.6 Validation Strategy

**Zod Schema with Refinements:**

```typescript
CreateMatchSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  teams: z.array(
    z.object({
      players: z.array(z.string()).min(1, 'Time deve ter pelo menos 1 jogador')
    })
  ).min(2, 'Pelo menos 2 times são necessários'),
  matches: z.array(/* ... */).min(1, 'Pelo menos 1 partida é necessária')
})
.refine((data) => {
  // Goal counts match whoScores totals
  // Teams don't play against themselves
  // Own goal players from opposing team
});
```

**Validation Display:**
- Real-time validation on blur
- Inline error messages below fields
- Section-level error summary at bottom
- Toast notification on submit errors

---

## 4. Component Structure

### 4.1 Component Hierarchy

```
src/
├── app/
│   ├── match/
│   │   └── new/
│   │       └── page.tsx                # "use client", renders WeekAndMatchesForm
│   └── week/
│       └── [weekId]/
│           ├── page.tsx                # View (existing)
│           └── edit/
│               └── page.tsx            # "use client", renders WeekAndMatchesForm
│
├── components/
│   ├── WeekAndMatchesForm/
│   │   ├── index.tsx                   # Main form container
│   │   ├── WeekDateHeader.tsx          # Date picker + title
│   │   ├── TeamsSection.tsx            # Teams management
│   │   ├── TeamCard.tsx                # Individual team
│   │   ├── MatchesSection.tsx          # Matches list
│   │   ├── MatchCard.tsx               # Individual match
│   │   ├── GoalDetailsPanel.tsx        # Goals/assists entry
│   │   └── FormFooter.tsx              # Save button + errors
│   │
│   ├── shared/
│   │   ├── PlayerMultiSelect.tsx       # Reusable player selector
│   │   └── LoadingSkeleton.tsx         # Loading states
│   │
│   └── ui/ (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx (enhanced with goal/assist variants)
│       ├── calendar.tsx
│       ├── popover.tsx
│       ├── dialog.tsx
│       ├── toast.tsx
│       └── ...
```

### 4.2 WeekAndMatchesForm Props

```typescript
interface WeekAndMatchesFormProps {
  mode: 'create' | 'edit';
  weekId?: string;
  onSuccess?: (weekId: string) => void;
  onCancel?: () => void;
}

// Usage
// Create mode
<WeekAndMatchesForm
  mode="create"
  onSuccess={(id) => router.push(`/week/${id}`)}
/>

// Edit mode
<WeekAndMatchesForm
  mode="edit"
  weekId={params.weekId}
  onSuccess={(id) => router.push(`/week/${id}`)}
  onCancel={() => router.back()}
/>
```

### 4.3 State Management Pattern

```typescript
// Data fetching (edit mode only)
const { week, isLoading, error } = useWeek(weekId);

// Form state
const form = useWeekForm(week ? mapWeekToFormValues(week) : undefined);
const { handleSubmit, formState: { errors, dirtyFields, isValid } } = form;

// Mutation hooks
const { create } = useCreateWeekAndMatches();
const { update } = useUpdateWeekAndMatches(weekId);

// Submit handler
const onSubmit = async (data: CreateMatchForm) => {
  const payload = mapFormToWeekAndMatches(data);

  if (mode === 'create') {
    const result = await create(payload);
    onSuccess?.(result.week.id);
  } else {
    const result = await update(payload);
    onSuccess?.(result.week.id);
  }
};
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1) - 5 days

**Day 1-2: Mappers & Validation**
- [ ] Create `mapFormToWeekAndMatches.ts`
- [ ] Enhance `CreateMatchSchema` with comprehensive refinements
- [ ] Add unit tests for mappers
- [ ] Test Zod validation edge cases

**Day 3-4: Shared Components**
- [ ] Create `WeekAndMatchesForm/index.tsx` (extract from `/match/page.tsx`)
- [ ] Create `useWeekForm.ts` hook
- [ ] Break down MatchForm into smaller components:
  - [ ] `MatchCard.tsx`
  - [ ] `GoalDetailsPanel.tsx`
  - [ ] `TeamCard.tsx`

**Day 5: Service Layer**
- [ ] Create `useUpdateWeekAndMatches.ts`
- [ ] Enhance `useCreateWeekAndMatches.ts` with SWR cache management
- [ ] Add error handling utilities

**Deliverable:** Reusable form components ready for integration

---

### Phase 2: Create Flow (Week 2) - 5 days

**Day 1-2: Route & Integration**
- [ ] Create `/match/new/page.tsx`
- [ ] Integrate `WeekAndMatchesForm` in create mode
- [ ] Add loading states and skeletons
- [ ] Implement toast notifications

**Day 3: Navigation Updates**
- [ ] Update weeks list: Change link from `/match` to `/match/new`
- [ ] Add "Criar Semana" button with proper routing
- [ ] Test navigation flows

**Day 4: Error Handling**
- [ ] Replace alert() calls with toast
- [ ] Add inline validation errors
- [ ] Create error summary component
- [ ] Add retry mechanisms

**Day 5: Testing**
- [ ] E2E test for create flow
- [ ] Integration tests for form submission
- [ ] Manual testing across browsers

**Deliverable:** Fully functional create flow with improved UX

---

### Phase 3: Edit Flow (Week 2-3) - 7 days

**Day 1-2: Backend Development**
- [ ] Create `PATCH /api/update_week_and_matches/:weekId` endpoint
- [ ] Implement transaction logic:
  - [ ] Validate weekId exists
  - [ ] Delete existing matches (cascade)
  - [ ] Update week date if changed
  - [ ] Recreate teams if composition changed
  - [ ] Create new matches
  - [ ] Recalculate champions and points
  - [ ] Update `MonthIndividualPrizes`
- [ ] Add backend tests

**Day 3-4: Frontend Edit Route**
- [ ] Create `/week/[weekId]/edit/page.tsx`
- [ ] Integrate `WeekAndMatchesForm` in edit mode
- [ ] Add data loading with `useWeek(weekId)`
- [ ] Implement form hydration with `mapWeekToFormValues`
- [ ] Add "modified" field indicators

**Day 5-6: Edit UI/UX**
- [ ] Add edit buttons to:
  - [ ] Weeks list page
  - [ ] Week detail page
- [ ] Create confirmation dialogs for destructive changes
- [ ] Add unsaved changes warning
- [ ] Implement optimistic updates

**Day 7: Testing**
- [ ] E2E test for edit flow
- [ ] Test with real week data
- [ ] Test edge cases (champions, ties, own goals)

**Deliverable:** Full edit capability with robust validation

---

### Phase 4: Cleanup (Week 3) - 3 days

**Day 1: Remove Old Code**
- [ ] Delete `/app/match/[weekId]/page.tsx` (OLD FLOW)
- [ ] Delete `/app/match/page.tsx` (NEW FLOW - replaced by `/match/new`)
- [ ] Remove unused hooks:
  - [ ] `useCreateWeekWithTeams.ts`
  - [ ] Old `useCreateMatches.ts`
- [ ] Remove old mapper `mapFormDataToBackend.ts`

**Day 2: Consolidate Patterns**
- [ ] Standardize on Lucide icons (remove Material-UI icon imports)
- [ ] Update all navigation links
- [ ] Ensure consistent error handling
- [ ] Remove dead code

**Day 3: Documentation**
- [ ] Update CLAUDE.md with new architecture
- [ ] Add developer guide for match flow
- [ ] Document mapper patterns
- [ ] Add inline code comments

**Deliverable:** Clean, maintainable codebase

---

### Phase 5: Polish & Accessibility (Week 4) - 5 days

**Day 1-2: Accessibility Audit**
- [ ] Add ARIA labels to all form fields
- [ ] Implement keyboard navigation
- [ ] Add focus management for dialogs
- [ ] Test with screen readers (NVDA, JAWS)
- [ ] Verify color contrast (4.5:1 minimum)

**Day 3: Keyboard Shortcuts**
- [ ] Implement Alt+D, Alt+T, Alt+M, Alt+S shortcuts
- [ ] Add keyboard shortcut help dialog
- [ ] Test tab order
- [ ] Add skip links

**Day 4: Motion & Animation**
- [ ] Add transitions to section collapse/expand
- [ ] Implement shimmer loading states
- [ ] Add success/error animations
- [ ] Respect `prefers-reduced-motion`

**Day 5: Final Testing**
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing (iOS, Android)
- [ ] Accessibility scan with axe DevTools
- [ ] Performance testing (Lighthouse)

**Deliverable:** WCAG 2.1 AA compliant, polished UX

---

## 6. Migration Strategy

### 6.1 Backward Compatibility Plan

**Step 1: Feature Flag (Optional)**
```typescript
// config/features.ts
export const FEATURES = {
  USE_NEW_MATCH_FLOW: process.env.NEXT_PUBLIC_NEW_MATCH_FLOW === 'true'
};

// Conditional routing
if (FEATURES.USE_NEW_MATCH_FLOW) {
  router.push('/match/new');
} else {
  router.push('/match'); // Old flow
}
```

**Step 2: Temporary Redirect**
```typescript
// app/match/page.tsx (old route)
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/match/new');
  }, [router]);

  return <div>Redirecionando...</div>;
}
```

**Step 3: Deprecation Notice**
```typescript
// Show banner on old flow (if keeping temporarily)
<Banner variant="warning">
  Esta página será removida em breve.
  <Link href="/match/new">Use a nova interface</Link>.
</Banner>
```

### 6.2 Data Migration

**No database changes needed** - schemas are compatible.

**UI Navigation Updates:**
```typescript
// Before
<Button onClick={() => router.push('/match')}>Adicionar Semana</Button>

// After
<Button onClick={() => router.push('/match/new')}>Adicionar Semana</Button>
<Button onClick={() => router.push(`/week/${weekId}/edit`)}>Editar</Button>
```

### 6.3 Rollback Plan

**If critical issues found:**

1. Revert navigation changes:
   ```bash
   git revert <commit-hash>
   ```

2. Re-enable old routes:
   ```typescript
   // Restore /app/match/[weekId]/page.tsx
   // Remove /match/new redirect
   ```

3. Feature flag to disable new flow:
   ```bash
   NEXT_PUBLIC_NEW_MATCH_FLOW=false
   ```

4. Database rollback not needed (no schema changes)

---

## 7. Testing & Validation

### 7.1 Unit Tests

```typescript
// Mapper tests
describe('mapFormToWeekAndMatches', () => {
  it('maps form data to API format', () => { /* ... */ });
  it('handles own goals correctly', () => { /* ... */ });
  it('filters empty assists', () => { /* ... */ });
});

// Validation tests
describe('CreateMatchSchema', () => {
  it('requires minimum 2 teams', () => { /* ... */ });
  it('validates goal count matches sum', () => { /* ... */ });
  it('prevents teams playing themselves', () => { /* ... */ });
});
```

### 7.2 Integration Tests

```typescript
describe('Match Creation Flow', () => {
  it('creates week, teams, and matches atomically', async () => {
    // Render form
    // Fill date
    // Add players to teams
    // Add match with score
    // Submit
    // Verify redirect to week view
  });

  it('shows validation errors on incomplete data', async () => {
    // Submit without teams
    // Verify error messages
  });
});
```

### 7.3 E2E Tests

```typescript
describe('Full Match Workflow', () => {
  it('creates and edits a week', async () => {
    // Create week
    // Navigate to weeks list
    // Click edit button
    // Modify match score
    // Save
    // Verify changes persisted
  });
});
```

### 7.4 Accessibility Testing

**Tools:**
- axe DevTools (automated scan)
- NVDA/JAWS (screen reader testing)
- Keyboard-only navigation
- Color contrast analyzer

**Checklist:**
- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] Focus indicators visible
- [ ] Logical heading hierarchy
- [ ] ARIA landmarks present
- [ ] Color contrast 4.5:1+ for text
- [ ] Keyboard navigation works
- [ ] Screen reader announcements clear

---

## 8. Accessibility Specifications

### 8.1 ARIA Attributes

```tsx
// Section headers
<section aria-labelledby="teams-heading">
  <h2 id="teams-heading">Times</h2>
  {/* ... */}
</section>

// Form fields
<Label htmlFor="date">Data da Semana</Label>
<Input
  id="date"
  aria-describedby="date-help date-error"
  aria-invalid={!!errors.date}
  aria-required="true"
/>
{errors.date && (
  <span id="date-error" role="alert" className="text-destructive">
    {errors.date.message}
  </span>
)}

// Dynamic updates
<div role="status" aria-live="polite" className="sr-only">
  {formStatus === 'saving' && 'Salvando semana...'}
  {formStatus === 'saved' && 'Semana salva com sucesso'}
</div>

// Buttons with icons
<button aria-label="Remover time">
  <Trash2 aria-hidden="true" />
</button>
```

### 8.2 Keyboard Navigation Map

```
Tab order:
1. [Skip to content] link
2. Date picker trigger
3. Team 1 player select
4. Team 1 add/remove buttons
5. Team 2 player select
6. Team 2 add/remove buttons
7. Add team button
8. Match 1 home team select
9. Match 1 home score input
10. Match 1 away score input
11. Match 1 away team select
12. Match 1 goal details expand button
13. [If expanded] Goal entry fields
14. Match 1 delete button
15. Add match button
16. Save button

Shortcuts:
Alt + D → Jump to date picker
Alt + T → Add new team
Alt + M → Add new match
Alt + S → Save form (if valid)
Escape → Close dialog / collapse section
```

### 8.3 Screen Reader Announcements

```typescript
// Success
<Toast>
  <div role="status" aria-live="polite">
    Semana criada com sucesso. 3 partidas registradas.
  </div>
</Toast>

// Error
<Toast>
  <div role="alert" aria-live="assertive">
    Erro ao salvar. Verifique os campos destacados.
  </div>
</Toast>

// Field updates
<div role="status" aria-live="polite" className="sr-only">
  Time 1 overall atualizado para 85
</div>
```

---

## 9. Design System Integration

### 9.1 New Color Tokens

```css
/* globals.css */
:root {
  /* Goal/Assist indicators */
  --goal-indicator: 142 76% 36%;      /* Green */
  --assist-indicator: 217 91% 60%;    /* Blue */
  --own-goal-indicator: 0 84% 60%;    /* Red */

  /* Form states */
  --field-dirty: 38 92% 50%;          /* Warning yellow */
  --field-valid: 142 76% 36%;         /* Success green */
  --field-invalid: 0 84% 60%;         /* Error red */
}

.dark {
  --goal-indicator: 142 76% 45%;      /* Brighter for dark mode */
  --assist-indicator: 217 91% 65%;
}
```

### 9.2 Component Variants

**Badge:**
```typescript
// components/ui/badge.tsx
const badgeVariants = cva(/* ... */, {
  variants: {
    variant: {
      // ... existing variants
      goal: "border-goal-indicator/20 bg-goal-indicator/10 text-goal-indicator",
      assist: "border-assist-indicator/20 bg-assist-indicator/10 text-assist-indicator",
      ownGoal: "border-own-goal-indicator/20 bg-own-goal-indicator/10 text-own-goal-indicator",
      modified: "border-field-dirty/20 bg-field-dirty/10 text-field-dirty",
    }
  }
});
```

**Card:**
```typescript
const cardVariants = cva(/* ... */, {
  variants: {
    variant: {
      default: "bg-card",
      elevated: "bg-card shadow-md",
      interactive: "bg-card hover:shadow-lg transition-shadow cursor-pointer",
      error: "bg-card border-destructive/50",
      success: "bg-card border-success/50",
    }
  }
});
```

### 9.3 Icon Standardization

**Decision: Lucide Icons Only**

```typescript
// Remove Material-UI imports
// import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'; ❌

// Use Lucide instead
import { Trash2, Plus, Edit, Save, Calendar, Users, Trophy } from 'lucide-react'; ✅
```

**Icon Sizes:**
```typescript
const iconSizes = {
  sm: 'w-4 h-4',     // 16px - inline icons
  md: 'w-5 h-5',     // 20px - buttons
  lg: 'w-6 h-6',     // 24px - section headers
};
```

### 9.4 Spacing Scale

```typescript
// Vertical gaps between sections
const sectionGap = 'gap-8';        // 32px

// Card padding
const cardPadding = 'p-6';         // 24px

// Form field gaps
const fieldGap = 'gap-4';          // 16px

// Inline element gaps
const inlineGap = 'gap-2';         // 8px
```

### 9.5 Typography Hierarchy

```typescript
const typography = {
  pageTitle: 'text-3xl font-bold text-foreground',
  sectionHeading: 'text-xl font-semibold text-foreground',
  cardTitle: 'text-lg font-medium text-foreground',
  label: 'text-sm font-medium text-foreground',
  body: 'text-base text-foreground',
  helper: 'text-sm text-muted-foreground',
  error: 'text-sm text-destructive',
};
```

---

## Summary & Next Steps

### Key Deliverables

✅ **UX/UI Design:**
- Single-step atomic flow wireframe
- Component breakdown (6 focused components)
- Accessibility specifications (WCAG 2.1 AA)
- Design system integration (colors, icons, spacing)

✅ **Technical Architecture:**
- Consolidated atomic transaction pattern
- Bidirectional mapper system
- Service layer with SWR optimistic updates
- Route structure: `/match/new`, `/week/[weekId]/edit`

✅ **Implementation Plan:**
- 4-week phased rollout
- Backward compatibility strategy
- Migration plan with rollback procedures
- Comprehensive testing strategy

### Success Metrics

| Metric | Target |
|--------|--------|
| Click reduction | -50% (2 buttons → 1 button) |
| Component size | -68% (318 lines → ~100 lines) |
| User error rate | -60% (smart validation) |
| Accessibility violations | 0 (WCAG 2.1 AA) |
| Time to create week | -40% |
| Developer satisfaction | High (cleaner code) |

### Immediate Next Steps

1. **Review & Approval** (Day 1):
   - Stakeholder review of this proposal
   - UI/UX team approval of wireframes
   - Backend team review of API changes

2. **Sprint Planning** (Day 2):
   - Break down Phase 1 tasks
   - Assign developers
   - Set up feature branch

3. **Development Kickoff** (Day 3):
   - Start mapper development
   - Begin component extraction
   - Set up test infrastructure

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Backend API delays | Build frontend with mocks first |
| User resistance to change | Gradual rollout with feature flag |
| Accessibility gaps | Early axe DevTools scans |
| Performance regression | Lighthouse CI in build pipeline |
| Data loss on errors | Auto-save draft to localStorage |

---

## Appendix

### A. File Structure Reference

```
front-pelego-mvp/
├── src/
│   ├── app/
│   │   ├── match/
│   │   │   ├── new/page.tsx                    # NEW - Create flow
│   │   │   ├── [weekId]/page.tsx               # DELETE - Old flow
│   │   │   └── page.tsx                        # DELETE - New flow (move to new/)
│   │   └── week/
│   │       └── [weekId]/
│   │           ├── page.tsx                    # Keep - View
│   │           └── edit/
│   │               └── page.tsx                # NEW - Edit flow
│   │
│   ├── components/
│   │   ├── WeekAndMatchesForm/
│   │   │   ├── index.tsx                       # NEW - Main form
│   │   │   ├── WeekDateHeader.tsx              # NEW
│   │   │   ├── TeamsSection.tsx                # NEW
│   │   │   ├── TeamCard.tsx                    # NEW
│   │   │   ├── MatchesSection.tsx              # NEW
│   │   │   ├── MatchCard.tsx                   # REFACTOR from MatchForm
│   │   │   ├── GoalDetailsPanel.tsx            # NEW
│   │   │   └── FormFooter.tsx                  # NEW
│   │   └── MatchForm/
│   │       └── index.tsx                       # DELETE (replaced)
│   │
│   ├── services/
│   │   └── matchs/
│   │       ├── useCreateWeekAndMatches.ts      # ENHANCE
│   │       ├── useUpdateWeekAndMatches.ts      # NEW
│   │       ├── useWeekForm.ts                  # NEW
│   │       ├── useCreateWeekWithTeams.ts       # DELETE
│   │       └── resources.ts                    # ENHANCE
│   │
│   ├── mapper/
│   │   ├── createWeekAndMatches.ts             # NEW
│   │   ├── updateWeekAndMatches.ts             # NEW
│   │   ├── weekToFormValues.ts                 # ENHANCE (from defaultValueMatches.ts)
│   │   ├── createMatches.ts                    # DELETE
│   │   └── defaultValueMatches.ts              # DELETE
│   │
│   └── schema/
│       └── match/
│           └── index.tsx                       # ENHANCE validation
│
└── back-pelego-mvp/
    └── src/
        └── routes/
            ├── create/
            │   └── create_week_and_matches.ts  # Keep
            └── edit/
                └── update_week_and_matches.ts  # NEW
```

### B. API Contract

**POST /api/create_week_and_matches**
```typescript
Request:
{
  date: string,
  teams: string[][], // Array of player ID arrays
  matches: {
    homeTeamIndex: number,
    awayTeamIndex: number,
    homeGoals: { playerId?: string, ownGoalPlayerId?: string, goals: number }[],
    awayGoals: { playerId?: string, ownGoalPlayerId?: string, goals: number }[],
    homeAssists: { playerId: string, assists: number }[],
    awayAssists: { playerId: string, assists: number }[]
  }[]
}

Response:
{
  week: { id: string, date: string },
  teams: { id: string, players: any[], champion: boolean, points: number }[],
  matches: { id: string, homeTeamId: string, awayTeamId: string, result: any }[],
  championTeams: string[]
}
```

**PATCH /api/update_week_and_matches/:weekId**
```typescript
// Same request/response structure as create
// Backend handles deletion of old matches and recreation
```

### C. Zod Schema Complete

```typescript
export const CreateMatchSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  teams: z.array(
    z.object({
      players: z.array(z.string()).min(1, 'Time deve ter pelo menos 1 jogador')
    })
  ).min(2, 'Pelo menos 2 times são necessários'),
  matches: z.array(
    z.object({
      homeTeamId: z.string(),
      awayTeamId: z.string(),
      homeGoals: z.object({
        goalsCount: z.string(),
        whoScores: z.array(
          z.object({
            goals: z.number().positive(),
            playerId: z.string(),
            ownGoalPlayerId: z.string().optional()
          })
        ).optional()
      }),
      homeAssists: z.array(
        z.object({
          assists: z.number().positive(),
          playerId: z.string()
        })
      ).optional(),
      awayGoals: z.object({
        goalsCount: z.string(),
        whoScores: z.array(
          z.object({
            goals: z.number().positive(),
            playerId: z.string(),
            ownGoalPlayerId: z.string().optional()
          })
        ).optional()
      }),
      awayAssists: z.array(
        z.object({
          assists: z.number().positive(),
          playerId: z.string()
        })
      ).optional()
    }).refine(
      (data) => data.homeTeamId !== data.awayTeamId,
      { message: 'Times não podem jogar contra si mesmos' }
    )
  ).min(1, 'Pelo menos 1 partida é necessária')
}).refine(
  (data) => {
    // Validate all matches have correct goal counts
    return data.matches.every(match => {
      const homeExpected = parseInt(match.homeGoals.goalsCount || '0');
      const awayExpected = parseInt(match.awayGoals.goalsCount || '0');

      const homeActual = match.homeGoals.whoScores?.reduce((sum, g) =>
        sum + (g.ownGoalPlayerId ? 0 : g.goals), 0) || 0;
      const homeOwnGoals = match.awayGoals.whoScores?.reduce((sum, g) =>
        sum + (g.ownGoalPlayerId ? g.goals : 0), 0) || 0;

      const awayActual = match.awayGoals.whoScores?.reduce((sum, g) =>
        sum + (g.ownGoalPlayerId ? 0 : g.goals), 0) || 0;
      const awayOwnGoals = match.homeGoals.whoScores?.reduce((sum, g) =>
        sum + (g.ownGoalPlayerId ? g.goals : 0), 0) || 0;

      return (homeActual + awayOwnGoals === homeExpected) &&
             (awayActual + homeOwnGoals === awayExpected);
    });
  },
  { message: 'Soma de gols não corresponde ao total', path: ['matches'] }
);
```

---

**Document Version:** 1.0
**Last Updated:** December 22, 2024
**Authors:** UI Designer Agent + Next.js Developer Agent
**Status:** Ready for Implementation
