/**
 * Script to fix corrupted championDates in monthPrizes.
 *
 * The bug: updateWeekAndMatches was not removing championDates for players
 * who stopped being champions after a week edit, and used imprecise date
 * comparison that could leave duplicate/ghost dates.
 *
 * Fix: For each monthPrize, rebuild championDates from actual weeks data
 * (teams with champion=true that include the player).
 *
 * Usage: npx tsx scripts/fix-champion-dates.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { Timestamp } from 'firebase-admin/firestore';

// Load .env manually (avoid dotenv dependency)
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// Initialize Firebase Admin
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

async function fixChampionDates() {
  // List all futs
  const futsSnap = await db.collection('futs').get();
  console.log(`Found ${futsSnap.size} fut(s)`);

  for (const futDoc of futsSnap.docs) {
    const futId = futDoc.id;
    const futData = futDoc.data();
    console.log(`\n=== Processing Fut: ${futData.name || futId} (${futId}) ===`);

    const futRef = db.collection('futs').doc(futId);

    // Step 1: Build a map of actual champion data from weeks
    // Map: playerId -> array of week dates where they were champion
    const actualChampionDates = new Map<string, Date[]>();

    const weeksSnap = await futRef.collection('weeks').get();
    console.log(`  Found ${weeksSnap.size} week(s)`);

    for (const weekDoc of weeksSnap.docs) {
      const weekData = weekDoc.data();
      const weekDate: Date = weekData.date?.toDate
        ? weekData.date.toDate()
        : new Date(weekData.date);

      const teamsSnap = await weekDoc.ref.collection('teams').get();

      for (const teamDoc of teamsSnap.docs) {
        const teamData = teamDoc.data();
        if (teamData.champion) {
          const playerIds: string[] = teamData.playerIds || [];
          for (const pid of playerIds) {
            if (!actualChampionDates.has(pid)) {
              actualChampionDates.set(pid, []);
            }
            actualChampionDates.get(pid)!.push(weekDate);
          }
        }
      }
    }

    console.log(`  Found ${actualChampionDates.size} player(s) with champion weeks`);

    // Step 2: Get all monthPrizes and fix them
    const monthPrizesSnap = await futRef.collection('monthPrizes').get();
    console.log(`  Found ${monthPrizesSnap.size} monthPrize doc(s)`);

    let fixedCount = 0;
    let deletedCount = 0;

    for (const prizeDoc of monthPrizesSnap.docs) {
      const data = prizeDoc.data();
      const playerId = data.playerId;
      const storedTimes = data.championTimes || 0;
      const storedDates: Timestamp[] = data.championDates || [];

      // Extract month from doc ID: format is YYYY_MM_playerId
      const docId = prizeDoc.id;
      const monthMatch = docId.match(/^(\d{4})_(\d{2})_/);
      if (!monthMatch) {
        console.log(`    WARN: Unexpected doc ID format: ${docId}`);
        continue;
      }
      const year = parseInt(monthMatch[1]);
      const month = parseInt(monthMatch[2]); // 1-indexed

      // Get actual champion dates for this player in this month
      const playerDates = actualChampionDates.get(playerId) || [];
      const actualDatesThisMonth = playerDates.filter(d =>
        d.getFullYear() === year && d.getMonth() + 1 === month
      );

      const actualTimes = actualDatesThisMonth.length;

      if (actualTimes === 0 && storedTimes > 0) {
        // Player has no champion weeks this month, but has a prize doc
        console.log(`    DELETE ${docId}: stored ${storedTimes} champion(s), actual 0`);
        // Keep non-champion prize data if it has other awards
        const hasOtherAwards = data.isMVP || data.isTopPointer || data.isStriker ||
          data.isBestAssist || data.isBestDefender || data.isLVP || data.isBestOfPosition;

        if (hasOtherAwards) {
          await prizeDoc.ref.update({
            championTimes: 0,
            championDates: [],
          });
          fixedCount++;
          console.log(`      -> Zeroed champion data (kept doc for other awards)`);
        } else {
          await prizeDoc.ref.delete();
          deletedCount++;
          console.log(`      -> Deleted doc (no other awards)`);
        }
      } else if (actualTimes !== storedTimes || actualDatesThisMonth.length !== storedDates.length) {
        // Mismatch - fix it
        console.log(`    FIX ${docId}: stored ${storedTimes} champion(s) / ${storedDates.length} date(s), actual ${actualTimes}`);
        const correctDates = actualDatesThisMonth.map(d => Timestamp.fromDate(d));
        await prizeDoc.ref.update({
          championTimes: actualTimes,
          championDates: correctDates,
        });
        fixedCount++;

        // Show details
        const storedDateStrs = storedDates.map(d => d.toDate().toISOString().slice(0, 10));
        const actualDateStrs = actualDatesThisMonth.map(d => d.toISOString().slice(0, 10));
        console.log(`      stored dates: [${storedDateStrs.join(', ')}]`);
        console.log(`      actual dates: [${actualDateStrs.join(', ')}]`);
      }
    }

    console.log(`\n  Summary for ${futData.name || futId}: ${fixedCount} fixed, ${deletedCount} deleted`);
  }

  console.log('\nDone!');
}

fixChampionDates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
