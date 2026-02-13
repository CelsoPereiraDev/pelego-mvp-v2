/**
 * Migration Script: SQLite → Firestore
 *
 * Reads all data from the recovered SQLite database and writes it
 * to Firestore under a new Fut called "Sr Caetano".
 * Links the admin user (celsopereira.dev@gmail.com) to player "Celso".
 *
 * Usage:
 *   cd back-pelego-mvp
 *   npx tsx scripts/migrate-sqlite-to-firestore.ts
 *
 * Prerequisites:
 *   - Firebase Admin SDK configured (GOOGLE_APPLICATION_CREDENTIALS env var)
 *   - SQLite database at scripts/dev.db (extracted from git history)
 */

import Database from 'better-sqlite3';
import * as admin from 'firebase-admin';
import * as path from 'path';

// ─── Configuration ──────────────────────────────────────────────
const FUT_NAME = 'Sr Caetano';
const FUT_DESCRIPTION = 'Grupo de futebol migrado do sistema original';
const ADMIN_EMAIL = 'celsopereira.dev@gmail.com';
const CELSO_PLAYER_ID = '7601fdd5-5479-4a43-afc7-08b02c5f1baf';

// ─── Initialize services ───────────────────────────────────────
const dbPath = path.join(__dirname, 'dev.db');
const sqlite = new Database(dbPath, { readonly: true });

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!SERVICE_ACCOUNT_PATH) {
  console.error('ERROR: Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pelego-v2',
  });
}
const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

// ─── Helpers ────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[migrate] ${msg}`);
}

function toTimestamp(date: number | string | Date): admin.firestore.Timestamp {
  const d = typeof date === 'number' ? new Date(date) : new Date(date);
  return Timestamp.fromDate(d);
}

type BatchOp = (batch: admin.firestore.WriteBatch) => void;

async function runBatchedWrites(ops: BatchOp[]) {
  const BATCH_SIZE = 450;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = ops.slice(i, i + BATCH_SIZE);
    for (const op of chunk) {
      op(batch);
    }
    await batch.commit();
    log(`  Committed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ops.length / BATCH_SIZE)} (${chunk.length} ops)`);
  }
}

// ─── SQLite interfaces ──────────────────────────────────────────
interface SqlitePlayer {
  id: string;
  name: string;
  country: string | null;
  image: string | null;
  position: string;
  overall: string; // JSON string
  isChampion: number; // SQLite boolean (0/1)
  monthChampion: number;
  monthStriker: number;
  monthBestDefender: number;
  monthTopPointer: number;
  monthTopAssist: number;
  monthLVP: number;
  team: string | null;
  monthBestOfPosition: number | null;
}

interface SqliteWeek {
  id: string;
  date: string;
}

interface SqliteTeam {
  id: string;
  weekId: string;
  champion: number;
  points: number;
}

interface SqliteTeamMember {
  id: string;
  playerId: string;
  teamId: string;
}

interface SqliteMatch {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  orderIndex: number | null;
}

interface SqliteMatchResult {
  id: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
}

interface SqliteGoal {
  id: string;
  matchId: string;
  playerId: string | null;
  ownGoalPlayerId: string | null;
  goals: number;
}

interface SqliteAssist {
  id: string;
  matchId: string;
  playerId: string;
  assists: number;
}

interface SqliteMonthPrize {
  id: string;
  playerId: string;
  date: string;
  championTimes: number;
}

interface SqliteChampionDate {
  id: string;
  monthIndividualPrizeId: string;
  date: string;
}

// ─── Main Migration ─────────────────────────────────────────────
async function migrate() {
  log('Starting migration SQLite → Firestore...');

  // 1. Look up user by email to get Firebase UID
  log(`Looking up Firebase user for ${ADMIN_EMAIL}...`);
  let userId: string;
  try {
    const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    userId = userRecord.uid;
    log(`  Found user: ${userId} (${userRecord.displayName || 'no name'})`);
  } catch (error) {
    log(`  ERROR: Could not find Firebase user for ${ADMIN_EMAIL}.`);
    log('  Make sure you have logged in at least once with Google.');
    throw error;
  }

  // 2. Create the Fut
  const futId = crypto.randomUUID();
  const now = new Date();

  log(`Creating Fut "${FUT_NAME}" with ID: ${futId}`);

  const futBatch = db.batch();

  const futRef = db.collection('futs').doc(futId);
  futBatch.set(futRef, {
    name: FUT_NAME,
    description: FUT_DESCRIPTION,
    createdAt: Timestamp.fromDate(now),
    createdBy: userId,
    memberCount: 1,
  });

  // Create admin member linked to Celso
  const memberRef = futRef.collection('members').doc(userId);
  futBatch.set(memberRef, {
    role: 'admin',
    joinedAt: Timestamp.fromDate(now),
    email: ADMIN_EMAIL,
    displayName: 'Celso',
    linkedPlayerId: CELSO_PLAYER_ID,
  });

  // Create user index document
  const userRef = db.collection('users').doc(userId);
  futBatch.set(userRef, {
    email: ADMIN_EMAIL,
    displayName: 'Celso',
    primaryFutId: futId,
    futs: { [futId]: { role: 'admin', joinedAt: Timestamp.fromDate(now) } },
  }, { merge: true });

  await futBatch.commit();
  log('  Fut, member, and user index created');

  // 3. Migrate Players
  log('Migrating players...');
  const players = sqlite.prepare('SELECT * FROM Player').all() as SqlitePlayer[];
  log(`  Found ${players.length} players`);

  const playerOps: BatchOp[] = players.map(player => (batch) => {
    const ref = futRef.collection('players').doc(player.id);

    let overallParsed: Record<string, number> = {};
    try {
      overallParsed = JSON.parse(player.overall);
    } catch {
      overallParsed = { overall: parseInt(player.overall) || 0 };
    }

    const data: Record<string, unknown> = {
      name: player.name,
      country: player.country || null,
      image: player.image || null,
      position: player.position,
      overall: overallParsed,
      isChampion: !!player.isChampion,
      team: player.team || null,
      monthChampion: !!player.monthChampion,
      monthStriker: !!player.monthStriker,
      monthBestDefender: !!player.monthBestDefender,
      monthTopPointer: !!player.monthTopPointer,
      monthTopAssist: !!player.monthTopAssist,
      monthLVP: !!player.monthLVP,
      monthBestOfPosition: !!(player.monthBestOfPosition),
    };

    // Link Celso's player doc to the user
    if (player.id === CELSO_PLAYER_ID) {
      data.linkedUserId = userId;
    }

    batch.set(ref, data);
  });

  await runBatchedWrites(playerOps);
  log(`  Migrated ${players.length} players`);

  // 4. Read all relational data from SQLite
  log('Reading weeks, teams, matches, goals, assists...');
  const weeks = sqlite.prepare('SELECT * FROM Week').all() as SqliteWeek[];
  const teams = sqlite.prepare('SELECT * FROM Team').all() as SqliteTeam[];
  const teamMembers = sqlite.prepare('SELECT * FROM TeamMember').all() as SqliteTeamMember[];
  const matches = sqlite.prepare(`
    SELECT m.*, t.weekId
    FROM Match m
    JOIN Team t ON m.homeTeamId = t.id
  `).all() as (SqliteMatch & { weekId: string })[];
  const matchResults = sqlite.prepare('SELECT * FROM MatchResult').all() as SqliteMatchResult[];
  const goals = sqlite.prepare('SELECT * FROM Goal').all() as SqliteGoal[];
  const assists = sqlite.prepare('SELECT * FROM Assist').all() as SqliteAssist[];

  log(`  Weeks: ${weeks.length}, Teams: ${teams.length}, Matches: ${matches.length}`);
  log(`  Goals: ${goals.length}, Assists: ${assists.length}`);

  // Build lookup maps
  const teamMembersByTeam = new Map<string, string[]>();
  for (const tm of teamMembers) {
    if (!teamMembersByTeam.has(tm.teamId)) {
      teamMembersByTeam.set(tm.teamId, []);
    }
    teamMembersByTeam.get(tm.teamId)!.push(tm.playerId);
  }

  const resultByMatch = new Map<string, SqliteMatchResult>();
  for (const r of matchResults) {
    resultByMatch.set(r.matchId, r);
  }

  const goalsByMatch = new Map<string, SqliteGoal[]>();
  for (const g of goals) {
    if (!goalsByMatch.has(g.matchId)) {
      goalsByMatch.set(g.matchId, []);
    }
    goalsByMatch.get(g.matchId)!.push(g);
  }

  const assistsByMatch = new Map<string, SqliteAssist[]>();
  for (const a of assists) {
    if (!assistsByMatch.has(a.matchId)) {
      assistsByMatch.set(a.matchId, []);
    }
    assistsByMatch.get(a.matchId)!.push(a);
  }

  const teamsByWeek = new Map<string, SqliteTeam[]>();
  for (const t of teams) {
    if (!teamsByWeek.has(t.weekId)) {
      teamsByWeek.set(t.weekId, []);
    }
    teamsByWeek.get(t.weekId)!.push(t);
  }

  const matchesByWeek = new Map<string, (SqliteMatch & { weekId: string })[]>();
  for (const m of matches) {
    if (!matchesByWeek.has(m.weekId)) {
      matchesByWeek.set(m.weekId, []);
    }
    matchesByWeek.get(m.weekId)!.push(m);
  }

  // 5. Migrate Weeks with Teams and Matches
  log('Migrating weeks with teams and matches...');

  let totalTeams = 0;
  let totalMatches = 0;

  for (const week of weeks) {
    const weekOps: BatchOp[] = [];

    // Week document
    weekOps.push((batch) => {
      const ref = futRef.collection('weeks').doc(week.id);
      batch.set(ref, {
        date: toTimestamp(week.date),
      });
    });

    // Teams as subcollection
    const weekTeams = teamsByWeek.get(week.id) || [];
    for (const team of weekTeams) {
      const playerIds = teamMembersByTeam.get(team.id) || [];

      weekOps.push((batch) => {
        const ref = futRef.collection('weeks').doc(week.id)
          .collection('teams').doc(team.id);
        batch.set(ref, {
          champion: !!team.champion,
          points: team.points,
          playerIds,
        });
      });
      totalTeams++;
    }

    // Matches as subcollection with embedded goals/assists
    const weekMatches = matchesByWeek.get(week.id) || [];
    const processedMatchIds = new Set<string>();

    for (const match of weekMatches) {
      if (processedMatchIds.has(match.id)) continue;
      processedMatchIds.add(match.id);

      const result = resultByMatch.get(match.id);
      const matchGoals = goalsByMatch.get(match.id) || [];
      const matchAssists = assistsByMatch.get(match.id) || [];

      weekOps.push((batch) => {
        const ref = futRef.collection('weeks').doc(week.id)
          .collection('matches').doc(match.id);
        batch.set(ref, {
          date: toTimestamp(match.date),
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          orderIndex: match.orderIndex ?? null,
          result: result ? {
            homeGoals: result.homeGoals,
            awayGoals: result.awayGoals,
          } : null,
          goals: matchGoals.map(g => ({
            playerId: g.playerId || null,
            ownGoalPlayerId: g.ownGoalPlayerId || null,
            goals: g.goals,
          })),
          assists: matchAssists.map(a => ({
            playerId: a.playerId,
            assists: a.assists,
          })),
        });
      });
      totalMatches++;
    }

    await runBatchedWrites(weekOps);
  }

  log(`  Migrated ${weeks.length} weeks, ${totalTeams} teams, ${totalMatches} matches`);

  // 6. Migrate MonthIndividualPrizes + ChampionDates
  log('Migrating month prizes...');
  const monthPrizes = sqlite.prepare('SELECT id, playerId, date, championTimes FROM MonthIndividualPrizes').all() as SqliteMonthPrize[];
  const championDates = sqlite.prepare('SELECT * FROM ChampionDate').all() as SqliteChampionDate[];

  log(`  Found ${monthPrizes.length} month prize records, ${championDates.length} champion dates`);

  // Build champion dates lookup
  const championDatesByPrize = new Map<string, string[]>();
  for (const cd of championDates) {
    if (!championDatesByPrize.has(cd.monthIndividualPrizeId)) {
      championDatesByPrize.set(cd.monthIndividualPrizeId, []);
    }
    championDatesByPrize.get(cd.monthIndividualPrizeId)!.push(cd.date);
  }

  if (monthPrizes.length > 0) {
    const prizeOps: BatchOp[] = monthPrizes.map(prize => (batch) => {
      const prizeDate = new Date(parseInt(prize.date) || prize.date);
      const year = prizeDate.getFullYear();
      const month = String(prizeDate.getMonth() + 1).padStart(2, '0');
      const docId = `${year}_${month}_${prize.playerId}`;

      const ref = futRef.collection('monthPrizes').doc(docId);
      const dates = championDatesByPrize.get(prize.id) || [];

      batch.set(ref, {
        playerId: prize.playerId,
        date: toTimestamp(prizeDate),
        championTimes: prize.championTimes,
        championDates: dates.map(d => toTimestamp(parseInt(d) || d)),
      });
    });

    await runBatchedWrites(prizeOps);
    log(`  Migrated ${monthPrizes.length} month prizes`);
  }

  // ─── Summary ────────────────────────────────────────────────
  log('');
  log('=== Migration Complete ===');
  log(`Fut ID:    ${futId}`);
  log(`Fut Name:  ${FUT_NAME}`);
  log(`Admin:     ${ADMIN_EMAIL} (uid: ${userId})`);
  log(`Linked to: Player "Celso" (${CELSO_PLAYER_ID})`);
  log(`Players:   ${players.length}`);
  log(`Weeks:     ${weeks.length}`);
  log(`Teams:     ${totalTeams}`);
  log(`Matches:   ${totalMatches}`);
  log(`Goals:     ${goals.length}`);
  log(`Assists:   ${assists.length}`);
  log(`Month Prizes: ${monthPrizes.length}`);
  log('');
  log('You can now log in with your Google account to see the Fut.');
}

// ─── Run ────────────────────────────────────────────────────────
migrate()
  .then(() => {
    log('Done!');
    sqlite.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    sqlite.close();
    process.exit(1);
  });
