/**
 * Script to backfill /futs/{futId}/streaks/current for a given Fut.
 *
 * Strategy: iterate weeks in DESCENDING order (most recent → oldest).
 * - The most recent week sets streakCount: 1 for all highlights.
 * - Each prior week that keeps a player in a highlight increments their streak.
 * - When a player is missing from a highlight category, their streak for that
 *   category is "frozen" at its current value (they're no longer tracked).
 * - Early exit when all accumulators are empty (all streaks resolved).
 *
 * Only updates weekChampion / weekStriker / weekTopAssist.
 * Month fields (monthChampion, monthStriker, monthTopAssist) are preserved via merge.
 *
 * Usage:
 *   cd back-pelego-mvp
 *   env-cmd -f .env tsx scripts/backfill-streaks.ts [futName]
 *
 * Default futName: "Sr Caetano"
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Load .env manually (avoid dotenv dependency)
// ---------------------------------------------------------------------------
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// ---------------------------------------------------------------------------
// Initialize Firebase Admin
// ---------------------------------------------------------------------------
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credPath) {
  const resolvedPath = path.isAbsolute(credPath) ? credPath : path.resolve(credPath);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require(resolvedPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'pelego-v2',
  });
} else {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'pelego-v2',
  });
}

const db = admin.firestore();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StreakEntry {
  playerId: string;
  streakCount: number;
}

interface GoalData {
  playerId?: string;
  ownGoalPlayerId?: string;
  goals: number;
}

interface AssistData {
  playerId?: string;
  assists: number;
}

interface MatchData {
  homeTeamId: string;
  awayTeamId: string;
  result?: { homeGoals: number; awayGoals: number };
  goals: GoalData[];
  assists: AssistData[];
}

interface TeamData {
  id: string;
  champion: boolean;
  playerIds: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given match data for a week, compute:
 * - Set of champion player IDs (players on the champion team)
 * - Set of top scorer player IDs (players with max goals, ties included)
 * - Set of top assist player IDs (players with max assists, ties included)
 */
function computeWeekHighlights(
  teams: TeamData[],
  matches: MatchData[],
): {
  championPlayerIds: Set<string>;
  strikerPlayerIds: Set<string>;
  assistPlayerIds: Set<string>;
} {
  // Champion team players
  const championPlayerIds = new Set<string>();
  const championTeam = teams.find((t) => t.champion);
  if (championTeam) {
    for (const pid of championTeam.playerIds) {
      championPlayerIds.add(pid);
    }
  }

  // Goals and assists per player
  const playerGoals = new Map<string, number>();
  const playerAssists = new Map<string, number>();

  for (const match of matches) {
    for (const g of match.goals) {
      if (g.playerId) {
        playerGoals.set(g.playerId, (playerGoals.get(g.playerId) ?? 0) + g.goals);
      }
    }
    for (const a of match.assists) {
      if (a.playerId) {
        playerAssists.set(a.playerId, (playerAssists.get(a.playerId) ?? 0) + a.assists);
      }
    }
  }

  const maxGoals = playerGoals.size > 0 ? Math.max(...playerGoals.values()) : 0;
  const maxAssists = playerAssists.size > 0 ? Math.max(...playerAssists.values()) : 0;

  const strikerPlayerIds = new Set<string>();
  if (maxGoals > 0) {
    for (const [pid, g] of playerGoals) {
      if (g === maxGoals) strikerPlayerIds.add(pid);
    }
  }

  const assistPlayerIds = new Set<string>();
  if (maxAssists > 0) {
    for (const [pid, a] of playerAssists) {
      if (a === maxAssists) assistPlayerIds.add(pid);
    }
  }

  return { championPlayerIds, strikerPlayerIds, assistPlayerIds };
}

/**
 * Merge highlights from one week into the accumulators using the
 * regressive (descending) streak strategy:
 *
 * - If a player IS in the highlight set and IS in the accumulator → increment.
 * - If a player IS in the highlight set and NOT in the accumulator → add with 1
 *   (only on the first/most-recent week pass).
 * - If a player IS in the accumulator but NOT in the highlight set → remove
 *   (streak broken; their frozen value remains in `finalStreak`).
 *
 * `isFirstWeek` controls whether new players can enter the accumulators.
 * After the first week, only players already in the accumulator are tracked.
 */
function mergeHighlightsIntoAcc(
  acc: Map<string, number>,
  finalStreak: Map<string, number>,
  currentHighlights: Set<string>,
  isFirstWeek: boolean,
): void {
  if (isFirstWeek) {
    // Seed accumulators: every highlighted player enters with 1
    for (const pid of currentHighlights) {
      acc.set(pid, 1);
    }
    return;
  }

  // For subsequent weeks, update existing entries
  const toRemove: string[] = [];
  for (const [pid, count] of acc) {
    if (currentHighlights.has(pid)) {
      acc.set(pid, count + 1);
    } else {
      // Streak broken for this player — freeze current value
      finalStreak.set(pid, count);
      toRemove.push(pid);
    }
  }
  for (const pid of toRemove) {
    acc.delete(pid);
  }
}

// ---------------------------------------------------------------------------
// Main backfill logic
// ---------------------------------------------------------------------------
async function backfillStreaks(futName: string) {
  console.log(`\nSearching for Fut: "${futName}"...`);

  // 1. Find futId by name
  const futsSnap = await db.collection('futs').where('name', '==', futName).get();
  if (futsSnap.empty) {
    console.error(`ERROR: No Fut found with name "${futName}"`);
    process.exit(1);
  }
  const futDoc = futsSnap.docs[0];
  const futId = futDoc.id;
  console.log(`Found Fut: ${futName} (${futId})`);

  const futRef = db.collection('futs').doc(futId);

  // 2. Fetch all weeks ordered by date DESC (most recent first)
  const weeksSnap = await futRef.collection('weeks').orderBy('date', 'desc').get();
  console.log(`Found ${weeksSnap.size} week(s) — iterating most recent → oldest`);

  // Accumulators: playerId → current streak count (still "live")
  const championAcc = new Map<string, number>();
  const strikerAcc = new Map<string, number>();
  const assistAcc = new Map<string, number>();

  // Frozen final values for players whose streak has been broken
  const championFinal = new Map<string, number>();
  const strikerFinal = new Map<string, number>();
  const assistFinal = new Map<string, number>();

  let isFirstWeek = true;

  for (const weekDoc of weeksSnap.docs) {
    const weekData = weekDoc.data();
    const weekDate: string = weekData.date?.toDate
      ? weekData.date.toDate().toISOString().slice(0, 10)
      : String(weekData.date);

    // Early exit: nothing left to track
    if (!isFirstWeek && championAcc.size === 0 && strikerAcc.size === 0 && assistAcc.size === 0) {
      console.log(`  → All streaks resolved. Stopping early at week ${weekDate}`);
      break;
    }

    // Fetch teams subcollection
    const teamsSnap = await weekDoc.ref.collection('teams').get();
    const teams: TeamData[] = teamsSnap.docs.map((d) => ({
      id: d.id,
      champion: d.data().champion ?? false,
      playerIds: d.data().playerIds ?? [],
    }));

    // Fetch matches subcollection
    const matchesSnap = await weekDoc.ref.collection('matches').get();
    const matches: MatchData[] = matchesSnap.docs.map((d) => ({
      homeTeamId: d.data().homeTeamId,
      awayTeamId: d.data().awayTeamId,
      result: d.data().result,
      goals: d.data().goals ?? [],
      assists: d.data().assists ?? [],
    }));

    const { championPlayerIds, strikerPlayerIds, assistPlayerIds } = computeWeekHighlights(
      teams,
      matches,
    );

    console.log(
      `  Week ${weekDate}: ` +
        `champions=${championPlayerIds.size}, ` +
        `strikers=${strikerPlayerIds.size}, ` +
        `assists=${assistPlayerIds.size}`,
    );

    mergeHighlightsIntoAcc(championAcc, championFinal, championPlayerIds, isFirstWeek);
    mergeHighlightsIntoAcc(strikerAcc, strikerFinal, strikerPlayerIds, isFirstWeek);
    mergeHighlightsIntoAcc(assistAcc, assistFinal, assistPlayerIds, isFirstWeek);

    isFirstWeek = false;
  }

  // Flush remaining live accumulators into final maps
  for (const [pid, count] of championAcc) championFinal.set(pid, count);
  for (const [pid, count] of strikerAcc) strikerFinal.set(pid, count);
  for (const [pid, count] of assistAcc) assistFinal.set(pid, count);

  // Build the streak arrays
  const weekChampion: StreakEntry[] = [...championFinal.entries()].map(([playerId, streakCount]) => ({
    playerId,
    streakCount,
  }));
  const weekStriker: StreakEntry[] = [...strikerFinal.entries()].map(([playerId, streakCount]) => ({
    playerId,
    streakCount,
  }));
  const weekTopAssist: StreakEntry[] = [...assistFinal.entries()].map(([playerId, streakCount]) => ({
    playerId,
    streakCount,
  }));

  console.log('\n--- Results ---');
  console.log('weekChampion:', JSON.stringify(weekChampion, null, 2));
  console.log('weekStriker:', JSON.stringify(weekStriker, null, 2));
  console.log('weekTopAssist:', JSON.stringify(weekTopAssist, null, 2));

  // 3. Write to Firestore (merge: true preserves month fields)
  const streakDocRef = futRef.collection('streaks').doc('current');
  await streakDocRef.set({ weekChampion, weekStriker, weekTopAssist }, { merge: true });

  console.log(`\n✓ Written to /futs/${futId}/streaks/current`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const futName = process.argv[2] ?? 'Sr Caetano';

backfillStreaks(futName).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
