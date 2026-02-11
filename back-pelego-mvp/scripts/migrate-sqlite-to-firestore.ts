/**
 * Migration Script: SQLite (Prisma) → Firestore
 *
 * Reads all data from the SQLite database via Prisma and writes it
 * to Firestore under a single "Fut" (football group).
 *
 * Usage:
 *   npx tsx scripts/migrate-sqlite-to-firestore.ts
 *
 * Prerequisites:
 *   - Firebase Admin SDK configured (GOOGLE_APPLICATION_CREDENTIALS or local emulator)
 *   - SQLite database at prisma/dev.db with data
 *   - Run `npx prisma generate` first if needed
 */

import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';

// ─── Configuration ──────────────────────────────────────────────
const FUT_NAME = 'Pelego';
const FUT_DESCRIPTION = 'Grupo de futebol migrado do sistema original';
const ADMIN_USER_ID = 'migration-admin'; // Placeholder until real user claims it

// ─── Initialize services ───────────────────────────────────────
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./dev.db' } },
});

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'pelego-v2' });
}
const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

// ─── Helpers ────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[migrate] ${msg}`);
}

function toTimestamp(date: Date | string): admin.firestore.Timestamp {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Timestamp.fromDate(d);
}

// Firestore batch has a 500-operation limit, so we chunk writes
async function commitBatched(operations: Array<() => void>) {
  const BATCH_SIZE = 450;
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = operations.slice(i, i + BATCH_SIZE);
    // Each operation is a function that receives the batch implicitly via closure
    // We need to rebind. Let's use a different approach:
    for (const op of chunk) {
      op();
    }
    // Hmm, the ops need access to the batch. Let's restructure.
  }
}

// Better approach: pass batch-building functions
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

// ─── Main Migration ─────────────────────────────────────────────
async function migrate() {
  log('Starting migration SQLite → Firestore...');

  // 1. Create the Fut
  const futId = crypto.randomUUID();
  const now = new Date();

  log(`Creating Fut "${FUT_NAME}" with ID: ${futId}`);

  await db.collection('futs').doc(futId).set({
    name: FUT_NAME,
    description: FUT_DESCRIPTION,
    createdAt: toTimestamp(now),
    createdBy: ADMIN_USER_ID,
    memberCount: 1,
  });

  // Create placeholder admin member
  await db.collection('futs').doc(futId).collection('members').doc(ADMIN_USER_ID).set({
    role: 'admin',
    joinedAt: toTimestamp(now),
    displayName: 'Migration Admin',
  });

  // 2. Migrate Players
  log('Migrating players...');
  const players = await prisma.player.findMany();
  log(`  Found ${players.length} players`);

  const playerOps: BatchOp[] = players.map(player => (batch) => {
    const ref = db.collection('futs').doc(futId).collection('players').doc(player.id);

    let overallParsed: any = {};
    try {
      overallParsed = JSON.parse(player.overall);
    } catch {
      overallParsed = { overall: player.overall };
    }

    batch.set(ref, {
      name: player.name,
      country: player.country || null,
      image: player.image || null,
      position: player.position,
      overall: overallParsed,
      isChampion: player.isChampion,
      team: player.team || null,
      monthChampion: player.monthChampion,
      monthStriker: player.monthStriker,
      monthBestDefender: player.monthBestDefender,
      monthTopPointer: player.monthTopPointer,
      monthTopAssist: player.monthTopAssist,
      monthLVP: player.monthLVP,
      monthBestOfPosition: player.monthBestOfPosition || false,
    });
  });

  await runBatchedWrites(playerOps);
  log(`  Migrated ${players.length} players`);

  // 3. Migrate Weeks with Teams, Matches, Goals, Assists
  log('Migrating weeks...');
  const weeks = await prisma.week.findMany({
    include: {
      teams: {
        include: {
          players: {
            include: { player: true },
          },
          matchesHome: {
            include: {
              result: true,
              goals: {
                include: { player: true, ownGoalPlayer: true },
              },
              assists: {
                include: { player: true },
              },
            },
          },
          matchesAway: {
            include: {
              result: true,
              goals: {
                include: { player: true, ownGoalPlayer: true },
              },
              assists: {
                include: { player: true },
              },
            },
          },
        },
      },
    },
  });
  log(`  Found ${weeks.length} weeks`);

  for (const week of weeks) {
    log(`  Processing week ${week.id} (${week.date.toISOString().split('T')[0]})...`);

    const weekOps: BatchOp[] = [];

    // Week document
    weekOps.push((batch) => {
      const ref = db.collection('futs').doc(futId).collection('weeks').doc(week.id);
      batch.set(ref, {
        date: toTimestamp(week.date),
      });
    });

    // Teams as subcollection
    for (const team of week.teams) {
      const playerIds = team.players.map(tm => tm.playerId);

      weekOps.push((batch) => {
        const ref = db.collection('futs').doc(futId)
          .collection('weeks').doc(week.id)
          .collection('teams').doc(team.id);
        batch.set(ref, {
          champion: team.champion,
          points: team.points,
          playerIds,
        });
      });
    }

    // Collect unique matches (avoid duplicates from home/away relations)
    const matchMap = new Map<string, any>();
    for (const team of week.teams) {
      for (const match of [...team.matchesHome, ...team.matchesAway]) {
        if (!matchMap.has(match.id)) {
          matchMap.set(match.id, match);
        }
      }
    }

    // Matches as subcollection with embedded goals/assists
    for (const match of matchMap.values()) {
      const goals = match.goals.map((g: any) => ({
        playerId: g.playerId || null,
        ownGoalPlayerId: g.ownGoalPlayerId || null,
        goals: g.goals,
      }));

      const assists = match.assists.map((a: any) => ({
        playerId: a.playerId,
        assists: a.assists,
      }));

      weekOps.push((batch) => {
        const ref = db.collection('futs').doc(futId)
          .collection('weeks').doc(week.id)
          .collection('matches').doc(match.id);
        batch.set(ref, {
          date: toTimestamp(match.date),
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          orderIndex: match.orderIndex ?? null,
          result: match.result ? {
            homeGoals: match.result.homeGoals,
            awayGoals: match.result.awayGoals,
          } : null,
          goals,
          assists,
        });
      });
    }

    await runBatchedWrites(weekOps);
    log(`    Teams: ${week.teams.length}, Matches: ${matchMap.size}`);
  }

  // 4. Migrate PlayerScores
  log('Migrating player scores...');
  const scores = await prisma.playerScore.findMany();
  log(`  Found ${scores.length} player scores`);

  if (scores.length > 0) {
    const scoreOps: BatchOp[] = scores.map(score => (batch) => {
      const ref = db.collection('futs').doc(futId).collection('playerScores').doc(score.id);
      batch.set(ref, {
        playerId: score.playerId,
        points: score.points,
        date: toTimestamp(score.date),
      });
    });
    await runBatchedWrites(scoreOps);
    log(`  Migrated ${scores.length} scores`);
  }

  // 5. Migrate MonthIndividualPrizes
  log('Migrating month individual prizes...');
  const monthPrizes = await prisma.monthIndividualPrizes.findMany({
    include: {
      monthBestOfPosition: true,
      monthLVP: true,
      monthStriker: true,
      monthTopPointer: true,
      monthChampion: true,
      monthBestDefender: true,
      monthBestAssist: true,
      championDates: true,
    },
  });
  log(`  Found ${monthPrizes.length} month prize records`);

  if (monthPrizes.length > 0) {
    const prizeOps: BatchOp[] = monthPrizes.map(prize => (batch) => {
      const year = prize.date.getFullYear();
      const month = String(prize.date.getMonth() + 1).padStart(2, '0');
      const docId = `${year}_${month}_${prize.playerId}`;

      const ref = db.collection('futs').doc(futId).collection('monthPrizes').doc(docId);

      const mapDetails = (details: any) => {
        if (!details) return null;
        return {
          isAchieved: details.isAchieved,
          count: details.count,
          ranking: details.ranking ?? null,
          position: details.position ?? null,
        };
      };

      batch.set(ref, {
        playerId: prize.playerId,
        year,
        month: parseInt(month),
        date: toTimestamp(prize.date),
        championTimes: prize.championTimes,
        championDates: prize.championDates.map(cd => toTimestamp(cd.date)),
        monthBestOfPosition: mapDetails(prize.monthBestOfPosition),
        monthLVP: mapDetails(prize.monthLVP),
        monthStriker: mapDetails(prize.monthStriker),
        monthTopPointer: mapDetails(prize.monthTopPointer),
        monthChampion: mapDetails(prize.monthChampion),
        monthBestDefender: mapDetails(prize.monthBestDefender),
        monthBestAssist: mapDetails(prize.monthBestAssist),
      });
    });
    await runBatchedWrites(prizeOps);
    log(`  Migrated ${monthPrizes.length} month prizes`);
  }

  // 6. Migrate YearIndividualPrizes
  log('Migrating year individual prizes...');
  const yearPrizes = await prisma.yearIndividualPrizes.findMany();
  log(`  Found ${yearPrizes.length} year prize records`);

  if (yearPrizes.length > 0) {
    const yearPrizeOps: BatchOp[] = yearPrizes.map(prize => (batch) => {
      const year = prize.year.getFullYear();
      const docId = `${year}_${prize.playerId}`;

      const ref = db.collection('futs').doc(futId).collection('yearPrizes').doc(docId);
      batch.set(ref, {
        playerId: prize.playerId,
        year,
        championOfTheWeek: prize.championOfTheWeek,
        yearBestOfPosition: prize.yearBestOfPosition,
        yearLVP: prize.yearLVP,
        yearStriker: prize.yearStriker ?? false,
        yearTopPointer: prize.yearTopPointer,
        yearChampion: prize.yearChampion ?? false,
        yearBestDefender: prize.yearBestDefender ?? false,
        yearBestAssist: prize.yearBestAssist ?? false,
      });
    });
    await runBatchedWrites(yearPrizeOps);
    log(`  Migrated ${yearPrizes.length} year prizes`);
  }

  // ─── Summary ────────────────────────────────────────────────
  log('');
  log('=== Migration Complete ===');
  log(`Fut ID: ${futId}`);
  log(`Players: ${players.length}`);
  log(`Weeks: ${weeks.length}`);
  log(`Player Scores: ${scores.length}`);
  log(`Month Prizes: ${monthPrizes.length}`);
  log(`Year Prizes: ${yearPrizes.length}`);
  log('');
  log(`Save this Fut ID: ${futId}`);
  log('You can assign it as primaryFutId for your Firebase user after logging in.');
}

// ─── Run ────────────────────────────────────────────────────────
migrate()
  .then(() => {
    log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
