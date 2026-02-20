import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// ============================================================
// Firestore Data Access Layer (DAL)
// Replaces all Prisma operations with Firestore equivalents
// All data is scoped under /futs/{futId}/
// ============================================================

const db = adminDb;

// Helper to generate UUIDs (same format as Prisma)
function generateId(): string {
  return crypto.randomUUID();
}

// Helper to convert Firestore Timestamp to ISO string
function toDate(val: any): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val?.toDate) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return val;
}

// ============================================================
// FUTS
// ============================================================

export interface FutData {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  memberCount: number;
  years?: number[];
}

export async function createFut(name: string, description: string, userId: string, userEmail: string, userName: string): Promise<FutData> {
  const futId = generateId();
  const now = new Date();

  const batch = db.batch();

  // Create the fut document
  const futRef = db.collection('futs').doc(futId);
  batch.set(futRef, {
    name,
    description: description || '',
    createdAt: Timestamp.fromDate(now),
    createdBy: userId,
    memberCount: 1,
  });

  // Create the creator as admin member
  const memberRef = futRef.collection('members').doc(userId);
  batch.set(memberRef, {
    role: 'admin',
    joinedAt: Timestamp.fromDate(now),
    email: userEmail,
    displayName: userName,
  });

  // Update user document with this fut
  const userRef = db.collection('users').doc(userId);
  batch.set(userRef, {
    email: userEmail,
    displayName: userName,
    primaryFutId: futId,
    futs: { [futId]: { role: 'admin', joinedAt: Timestamp.fromDate(now) } },
  }, { merge: true });

  await batch.commit();

  return {
    id: futId,
    name,
    description: description || '',
    createdAt: now.toISOString(),
    createdBy: userId,
    memberCount: 1,
  };
}

export async function getFut(futId: string): Promise<FutData | null> {
  const doc = await db.collection('futs').doc(futId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    createdAt: toDate(data.createdAt),
    createdBy: data.createdBy,
    memberCount: data.memberCount || 0,
    years: data.years || [],
  };
}

export async function getUserFuts(userId: string): Promise<FutData[]> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return [];
  const userData = userDoc.data()!;
  const futIds = Object.keys(userData.futs || {});

  if (futIds.length === 0) return [];

  const results = await Promise.all(futIds.map(id => getFut(id)));
  return results.filter(Boolean) as FutData[];
}

export async function getUserPrimaryFutId(userId: string): Promise<string | null> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;
  return userDoc.data()?.primaryFutId || null;
}

// ============================================================
// MEMBERS
// ============================================================

export interface MemberData {
  userId: string;
  role: 'admin' | 'user' | 'viewer';
  email?: string;
  displayName?: string;
  linkedPlayerId?: string;
  joinedAt: string;
}

export async function getFutMembers(futId: string): Promise<MemberData[]> {
  const snapshot = await db.collection('futs').doc(futId).collection('members').get();
  return snapshot.docs.map(doc => ({
    userId: doc.id,
    ...doc.data(),
    joinedAt: toDate(doc.data().joinedAt),
  })) as MemberData[];
}

export async function getFutMember(futId: string, userId: string): Promise<MemberData | null> {
  const doc = await db.collection('futs').doc(futId).collection('members').doc(userId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    userId: doc.id,
    role: data.role,
    email: data.email,
    displayName: data.displayName,
    linkedPlayerId: data.linkedPlayerId,
    joinedAt: toDate(data.joinedAt),
  };
}

export async function addFutMember(futId: string, userId: string, role: 'admin' | 'user' | 'viewer', email?: string, displayName?: string): Promise<MemberData> {
  const now = new Date();
  const batch = db.batch();

  const memberRef = db.collection('futs').doc(futId).collection('members').doc(userId);
  const memberData = {
    role,
    email: email || '',
    displayName: displayName || '',
    joinedAt: Timestamp.fromDate(now),
  };
  batch.set(memberRef, memberData);

  // Update fut memberCount
  const futRef = db.collection('futs').doc(futId);
  batch.update(futRef, { memberCount: FieldValue.increment(1) });

  // Update user's futs map
  const userRef = db.collection('users').doc(userId);
  batch.set(userRef, {
    email: email || '',
    displayName: displayName || '',
    futs: { [futId]: { role, joinedAt: Timestamp.fromDate(now) } },
  }, { merge: true });

  await batch.commit();

  return {
    userId,
    role,
    email,
    displayName,
    joinedAt: now.toISOString(),
  };
}

export async function updateMemberRole(futId: string, userId: string, role: 'admin' | 'user' | 'viewer'): Promise<void> {
  const batch = db.batch();

  const memberRef = db.collection('futs').doc(futId).collection('members').doc(userId);
  batch.update(memberRef, { role });

  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, { [`futs.${futId}.role`]: role });

  await batch.commit();
}

export async function removeFutMember(futId: string, userId: string): Promise<void> {
  const batch = db.batch();

  const memberRef = db.collection('futs').doc(futId).collection('members').doc(userId);
  batch.delete(memberRef);

  const futRef = db.collection('futs').doc(futId);
  batch.update(futRef, { memberCount: FieldValue.increment(-1) });

  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, { [`futs.${futId}`]: FieldValue.delete() });

  await batch.commit();
}

export async function linkPlayerToMember(futId: string, userId: string, playerId: string): Promise<void> {
  const batch = db.batch();

  const memberRef = db.collection('futs').doc(futId).collection('members').doc(userId);
  batch.update(memberRef, { linkedPlayerId: playerId });

  const playerRef = db.collection('futs').doc(futId).collection('players').doc(playerId);
  batch.update(playerRef, { linkedUserId: userId });

  await batch.commit();
}

// ============================================================
// INVITES
// ============================================================

export interface InviteData {
  token: string;
  futId: string;
  futName: string;
  role: 'user' | 'viewer';
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  playerId?: string;
}

export async function createInvite(
  futId: string,
  futName: string,
  role: 'user' | 'viewer',
  createdBy: string,
  expiresAt?: Date,
  maxUses?: number,
  playerId?: string
): Promise<InviteData> {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const now = new Date();

  const inviteRef = db.collection('invites').doc(token);
  await inviteRef.set({
    futId,
    futName,
    role,
    createdBy,
    createdAt: Timestamp.fromDate(now),
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    maxUses: maxUses ?? null,
    usedCount: 0,
    active: true,
    ...(playerId ? { playerId } : {}),
  });

  return {
    token,
    futId,
    futName,
    role,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    maxUses: maxUses ?? null,
    usedCount: 0,
    active: true,
    ...(playerId ? { playerId } : {}),
  };
}

export async function getInvitesByFut(futId: string): Promise<InviteData[]> {
  const snapshot = await db.collection('invites')
    .where('futId', '==', futId)
    .where('active', '==', true)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      token: doc.id,
      futId: data.futId,
      futName: data.futName,
      role: data.role,
      createdBy: data.createdBy,
      createdAt: toDate(data.createdAt),
      expiresAt: data.expiresAt ? toDate(data.expiresAt) : null,
      maxUses: data.maxUses ?? null,
      usedCount: data.usedCount || 0,
      active: data.active,
      ...(data.playerId ? { playerId: data.playerId } : {}),
    };
  });
}

export async function getInviteByToken(token: string): Promise<InviteData | null> {
  const doc = await db.collection('invites').doc(token).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    token: doc.id,
    futId: data.futId,
    futName: data.futName,
    role: data.role,
    createdBy: data.createdBy,
    createdAt: toDate(data.createdAt),
    expiresAt: data.expiresAt ? toDate(data.expiresAt) : null,
    maxUses: data.maxUses ?? null,
    usedCount: data.usedCount || 0,
    active: data.active,
    ...(data.playerId ? { playerId: data.playerId } : {}),
  };
}

export async function revokeInvite(token: string): Promise<void> {
  await db.collection('invites').doc(token).update({ active: false });
}

export async function acceptInvite(
  token: string,
  userId: string,
  email: string,
  displayName: string
): Promise<{ futId: string; role: string }> {
  const inviteDoc = await db.collection('invites').doc(token).get();
  if (!inviteDoc.exists) throw new Error('Convite não encontrado');

  const data = inviteDoc.data()!;

  if (!data.active) throw new Error('Convite foi revogado');

  if (data.expiresAt) {
    const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
    if (expiresAt < new Date()) throw new Error('Convite expirado');
  }

  if (data.maxUses !== null && data.usedCount >= data.maxUses) {
    throw new Error('Convite atingiu o limite de usos');
  }

  // Check if user is already a member
  const existingMember = await getFutMember(data.futId, userId);
  if (existingMember) throw new Error('Você já é membro deste Fut');

  // Add user as member
  await addFutMember(data.futId, userId, data.role, email, displayName);

  // Auto-link player if invite was created for a specific player
  if (data.playerId) {
    await linkPlayerToMember(data.futId, userId, data.playerId);
  }

  // Increment usedCount
  await db.collection('invites').doc(token).update({
    usedCount: FieldValue.increment(1),
  });

  return { futId: data.futId, role: data.role };
}

// ============================================================
// UPDATE FUT
// ============================================================

export async function updateFut(futId: string, data: { name?: string; description?: string }): Promise<FutData> {
  const futRef = db.collection('futs').doc(futId);
  const futDoc = await futRef.get();
  if (!futDoc.exists) throw new Error('Fut não encontrado');

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  if (Object.keys(updateData).length > 0) {
    await futRef.update(updateData);
  }

  const updated = await futRef.get();
  const updatedData = updated.data()!;
  return {
    id: futId,
    name: updatedData.name,
    description: updatedData.description,
    createdAt: toDate(updatedData.createdAt),
    createdBy: updatedData.createdBy,
    memberCount: updatedData.memberCount || 0,
  };
}

// ============================================================
// PLAYERS
// ============================================================

export interface PlayerData {
  id: string;
  name: string;
  country?: string;
  image?: string;
  position: string;
  overall: any; // JSON object
  isChampion: boolean;
  monthChampion: boolean;
  monthStriker: boolean;
  monthBestDefender: boolean;
  monthTopPointer: boolean;
  monthTopAssist: boolean;
  monthLVP: boolean;
  monthBestOfPosition?: boolean;
  team?: string;
  linkedUserId?: string;
  email?: string;
}

export async function getPlayers(futId: string): Promise<PlayerData[]> {
  const snapshot = await db.collection('futs').doc(futId).collection('players').get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      overall: typeof data.overall === 'string' ? JSON.parse(data.overall) : data.overall,
    } as PlayerData;
  });
}

export async function getPlayer(futId: string, playerId: string): Promise<PlayerData | null> {
  const doc = await db.collection('futs').doc(futId).collection('players').doc(playerId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    overall: typeof data.overall === 'string' ? JSON.parse(data.overall) : data.overall,
  } as PlayerData;
}

export async function getPlayerWithPrizes(futId: string, playerId: string) {
  const player = await getPlayer(futId, playerId);
  if (!player) return null;

  // Get month prizes
  const monthPrizesSnap = await db.collection('futs').doc(futId)
    .collection('monthPrizes').where('playerId', '==', playerId).get();

  // Get year prizes
  const yearPrizesSnap = await db.collection('futs').doc(futId)
    .collection('yearPrizes').get();

  return {
    ...player,
    monthIndividualPrizes: monthPrizesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    yearIndividualPrizes: yearPrizesSnap.docs
      .filter(d => d.data().players?.[playerId])
      .map(d => ({ id: d.id, ...d.data().players[playerId], year: d.id })),
  };
}

export async function createPlayer(futId: string, playerData: Omit<PlayerData, 'id'>): Promise<PlayerData> {
  const id = generateId();
  const ref = db.collection('futs').doc(futId).collection('players').doc(id);

  const dataToStore = {
    name: playerData.name,
    position: playerData.position,
    overall: typeof playerData.overall === 'string' ? playerData.overall : JSON.stringify(playerData.overall),
    isChampion: playerData.isChampion ?? false,
    monthChampion: playerData.monthChampion ?? false,
    monthStriker: playerData.monthStriker ?? false,
    monthBestDefender: playerData.monthBestDefender ?? false,
    monthTopPointer: playerData.monthTopPointer ?? false,
    monthTopAssist: playerData.monthTopAssist ?? false,
    monthLVP: playerData.monthLVP ?? false,
    monthBestOfPosition: playerData.monthBestOfPosition ?? false,
    ...(playerData.country != null && { country: playerData.country }),
    ...(playerData.image != null && { image: playerData.image }),
    ...(playerData.team != null && { team: playerData.team }),
    ...(playerData.email != null && { email: playerData.email }),
    ...(playerData.linkedUserId != null && { linkedUserId: playerData.linkedUserId }),
  };

  await ref.set(dataToStore);

  return {
    id,
    ...playerData,
    overall: typeof playerData.overall === 'string' ? JSON.parse(playerData.overall) : playerData.overall,
  };
}

export async function updatePlayer(futId: string, playerId: string, data: Partial<PlayerData>): Promise<PlayerData | null> {
  const ref = db.collection('futs').doc(futId).collection('players').doc(playerId);
  const doc = await ref.get();
  if (!doc.exists) return null;

  const updateData: any = { ...data };
  if (data.overall && typeof data.overall !== 'string') {
    updateData.overall = JSON.stringify(data.overall);
  }
  delete updateData.id;

  await ref.update(updateData);

  const updated = await ref.get();
  const updatedData = updated.data()!;
  return {
    id: playerId,
    ...updatedData,
    overall: typeof updatedData.overall === 'string' ? JSON.parse(updatedData.overall) : updatedData.overall,
  } as PlayerData;
}

export async function deletePlayer(futId: string, playerId: string): Promise<void> {
  await db.collection('futs').doc(futId).collection('players').doc(playerId).delete();
}

// ============================================================
// WEEKS (with teams, matches, goals, assists)
// ============================================================

export interface WeekData {
  id: string;
  date: string;
  teams: TeamData[];
}

export interface TeamData {
  id: string;
  weekId: string;
  champion: boolean;
  points: number;
  players: TeamMemberData[];
  matchesHome: MatchData[];
  matchesAway: MatchData[];
}

export interface TeamMemberData {
  id: string;
  playerId: string;
  teamId: string;
  player: PlayerData;
}

export interface MatchData {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  orderIndex: number | null;
  result: MatchResultData | null;
  goals: GoalData[];
  assists: AssistData[];
}

export interface MatchResultData {
  id: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
}

export interface GoalData {
  id: string;
  matchId: string;
  playerId: string | null;
  ownGoalPlayerId: string | null;
  goals: number;
  player: PlayerData | null;
  ownGoalPlayer: PlayerData | null;
}

export interface AssistData {
  id: string;
  matchId: string;
  playerId: string;
  assists: number;
  player: PlayerData | null;
}

// Helper: get a week with full nested data (teams, matches, goals, assists, players)
async function getWeekWithRelations(
  futId: string,
  weekId: string,
  playerMap?: Map<string, PlayerData>,
): Promise<WeekData | null> {
  const weekRef = db.collection('futs').doc(futId).collection('weeks').doc(weekId);
  const weekDoc = await weekRef.get();
  if (!weekDoc.exists) return null;

  const weekData = weekDoc.data()!;

  // Load players only if no pre-built map was provided by the caller
  if (!playerMap) {
    const allPlayers = await getPlayers(futId);
    playerMap = new Map(allPlayers.map(p => [p.id, p]));
  }

  // Get teams and matches in parallel — matches fetched once per week, not per team
  const [teamsSnap, matchesSnap] = await Promise.all([
    weekRef.collection('teams').get(),
    weekRef.collection('matches').get(),
  ]);

  // Pre-build match list once
  const allMatches: MatchData[] = matchesSnap.docs.map((matchDoc) => {
    const matchData = matchDoc.data();
    return {
      id: matchDoc.id,
      date: toDate(matchData.date),
      homeTeamId: matchData.homeTeamId,
      awayTeamId: matchData.awayTeamId,
      orderIndex: matchData.orderIndex ?? null,
      result: matchData.result ? {
        id: matchDoc.id + '_result',
        matchId: matchDoc.id,
        homeGoals: matchData.result.homeGoals,
        awayGoals: matchData.result.awayGoals,
      } : null,
      goals: (matchData.goals || []).map((g: any, i: number) => ({
        id: `${matchDoc.id}_goal_${i}`,
        matchId: matchDoc.id,
        playerId: g.playerId || null,
        ownGoalPlayerId: g.ownGoalPlayerId || null,
        goals: g.goals,
        player: g.playerId ? playerMap!.get(g.playerId) || null : null,
        ownGoalPlayer: g.ownGoalPlayerId ? playerMap!.get(g.ownGoalPlayerId) || null : null,
      })),
      assists: (matchData.assists || []).map((a: any, i: number) => ({
        id: `${matchDoc.id}_assist_${i}`,
        matchId: matchDoc.id,
        playerId: a.playerId,
        assists: a.assists,
        player: a.playerId ? playerMap!.get(a.playerId) || null : null,
      })),
    };
  });

  const teams: TeamData[] = teamsSnap.docs.map((teamDoc) => {
    const teamData = teamDoc.data();
    const playerIds: string[] = teamData.playerIds || [];
    const teamMembers: TeamMemberData[] = playerIds.map((pid: string) => ({
      id: `${teamDoc.id}_${pid}`,
      playerId: pid,
      teamId: teamDoc.id,
      player: playerMap!.get(pid) || { id: pid, name: 'Unknown', position: '', overall: {}, isChampion: false, monthChampion: false, monthStriker: false, monthBestDefender: false, monthTopPointer: false, monthTopAssist: false, monthLVP: false },
    }));

    return {
      id: teamDoc.id,
      weekId: weekId,
      champion: teamData.champion || false,
      points: teamData.points || 0,
      players: teamMembers,
      matchesHome: allMatches.filter(m => m.homeTeamId === teamDoc.id),
      matchesAway: allMatches.filter(m => m.awayTeamId === teamDoc.id),
    };
  });

  return {
    id: weekId,
    date: toDate(weekData.date),
    teams,
  };
}

export async function getWeeks(futId: string): Promise<WeekData[]> {
  const [weeksSnap, allPlayers] = await Promise.all([
    db.collection('futs').doc(futId).collection('weeks').orderBy('date', 'desc').get(),
    getPlayers(futId),
  ]);
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));

  const weeks: WeekData[] = [];
  for (const weekDoc of weeksSnap.docs) {
    const week = await getWeekWithRelations(futId, weekDoc.id, playerMap);
    if (week) weeks.push(week);
  }
  return weeks;
}

export async function getWeek(futId: string, weekId: string): Promise<WeekData | null> {
  return getWeekWithRelations(futId, weekId);
}

export async function getWeeksByDate(futId: string, year: string, month?: string): Promise<WeekData[]> {
  const startDate = new Date(`${year}-${month || '01'}-01`);
  const endDate = month ? new Date(`${year}-${month}-31`) : new Date(`${year}-12-31`);

  const [weeksSnap, allPlayers] = await Promise.all([
    db.collection('futs').doc(futId).collection('weeks')
      .where('date', '>=', Timestamp.fromDate(startDate))
      .where('date', '<=', Timestamp.fromDate(endDate))
      .orderBy('date', 'desc')
      .get(),
    getPlayers(futId),
  ]);
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));

  const weeks: WeekData[] = [];
  for (const weekDoc of weeksSnap.docs) {
    const week = await getWeekWithRelations(futId, weekDoc.id, playerMap);
    if (week) weeks.push(week);
  }
  return weeks;
}

export async function getAvailableYears(futId: string): Promise<number[]> {
  const futDoc = await db.collection('futs').doc(futId).get();
  if (!futDoc.exists) return [];
  const years: number[] = futDoc.data()!.years || [];
  // Fallback: if years not yet populated (legacy data), scan weeks once
  if (years.length === 0) {
    const snap = await db.collection('futs').doc(futId).collection('weeks').get();
    const yearSet = new Set<number>();
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
      yearSet.add(date.getFullYear());
    });
    const computed = Array.from(yearSet).sort((a, b) => b - a);
    if (computed.length > 0) {
      await db.collection('futs').doc(futId).update({ years: computed });
    }
    return computed;
  }
  return [...years].sort((a, b) => b - a);
}

// Lightweight: returns date (YYYY-MM-DD) → weekId map without loading subcollections
// Lightweight: reads only a week doc's date (no subcollections)
export async function getWeekDate(futId: string, weekId: string): Promise<string | null> {
  const doc = await db.collection('futs').doc(futId).collection('weeks').doc(weekId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
  return date.toISOString().slice(0, 10);
}

export async function getWeekDateMap(futId: string): Promise<Map<string, string>> {
  const snap = await db.collection('futs').doc(futId).collection('weeks').get();
  const map = new Map<string, string>();
  for (const doc of snap.docs) {
    const data = doc.data();
    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
    map.set(date.toISOString().slice(0, 10), doc.id);
  }
  return map;
}

// ============================================================
// PLAYER STATS (pre-computed overview aggregation)
// ============================================================

import { calculateAllPlayerStats, buildTop5Lists, InternalPlayerStats, PlayerOverviewStats } from '../utils/stats/calculatePlayerOverview';
import { calculateMonthResume } from '../utils/stats/calculateMonthResume';
import { calculateBestOfEachPosition } from '../utils/stats/calculateBestOfPositions';

export interface PlayerStatsDocument {
  playerId: string;
  playerName: string;
  year: number;
  updatedAt: Timestamp;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goals: number;
  ownGoals: number;
  assists: number;
  goalsConceded: number;
  teamGoals: number;
  totalWeeks: number;
  totalGoalsPerWeek: number;
  totalAssistsPerWeek: number;
  totalPointsPerWeek: number;
  totalGoalsConcededPerWeek: number;
  averageGoalsConceded: number;
  averagePointsPerMatch: number;
  pointsPercentage: number;
  averagePointsPerWeek: number;
  averageGoalsPerWeek: number;
  averageAssistsPerWeek: number;
  averageGoalsConcededPerWeek: number;
  rankings: Record<string, number>;
  pointsWithPlayers: Record<string, { points: number; matches: number }>;
  pointsAgainstPlayers: Record<string, { points: number; matches: number }>;
  worstPerformingTeammates: Record<string, { points: number; matches: number }>;
}

function internalStatsToDoc(
  playerId: string,
  ps: InternalPlayerStats,
  year: number,
): PlayerStatsDocument {
  return {
    playerId,
    playerName: ps.name,
    year,
    updatedAt: Timestamp.now(),
    matches: ps.matches,
    wins: ps.wins,
    losses: ps.losses,
    draws: ps.draws,
    points: ps.points,
    goals: ps.goals,
    ownGoals: ps.ownGoals,
    assists: ps.assists,
    goalsConceded: ps.goalsConceded,
    teamGoals: ps.teamGoals,
    totalWeeks: ps.totalWeeks.size,
    totalGoalsPerWeek: ps.totalGoalsPerWeek,
    totalAssistsPerWeek: ps.totalAssistsPerWeek,
    totalPointsPerWeek: ps.totalPointsPerWeek,
    totalGoalsConcededPerWeek: ps.totalGoalsConcededPerWeek,
    averageGoalsConceded: ps.averageGoalsConceded,
    averagePointsPerMatch: ps.averagePointsPerMatch,
    pointsPercentage: ps.pointsPercentage,
    averagePointsPerWeek: ps.averagePointsPerWeek,
    averageGoalsPerWeek: ps.averageGoalsPerWeek,
    averageAssistsPerWeek: ps.averageAssistsPerWeek,
    averageGoalsConcededPerWeek: ps.averageGoalsConcededPerWeek,
    rankings: ps.rankings as Record<string, number>,
    pointsWithPlayers: ps.pointsWithPlayers,
    pointsAgainstPlayers: ps.pointsAgainstPlayers,
    worstPerformingTeammates: ps.worstPerformingTeammates,
  };
}

export function docToOverviewStats(doc: PlayerStatsDocument): PlayerOverviewStats {
  const top5 = buildTop5Lists({
    ...doc,
    totalWeeks: new Set<string>(), // not used by buildTop5Lists
  } as unknown as InternalPlayerStats);

  return {
    matches: doc.matches,
    wins: doc.wins,
    losses: doc.losses,
    draws: doc.draws,
    points: doc.points,
    goals: doc.goals,
    ownGoals: doc.ownGoals,
    assists: doc.assists,
    goalsConceded: doc.goalsConceded,
    teamGoals: doc.teamGoals,
    averageGoalsConceded: doc.averageGoalsConceded,
    averagePointsPerMatch: doc.averagePointsPerMatch,
    pointsPercentage: doc.pointsPercentage,
    averagePointsPerWeek: doc.averagePointsPerWeek,
    averageGoalsPerWeek: doc.averageGoalsPerWeek,
    averageAssistsPerWeek: doc.averageAssistsPerWeek,
    averageGoalsConcededPerWeek: doc.averageGoalsConcededPerWeek,
    totalWeeks: doc.totalWeeks,
    rankings: doc.rankings,
    ...top5,
  };
}

export function mergePlayerStatsDocs(docs: PlayerStatsDocument[]): PlayerOverviewStats {
  if (docs.length === 0) {
    return docToOverviewStats({
      playerId: '', playerName: '', year: 0, updatedAt: Timestamp.now(),
      matches: 0, wins: 0, losses: 0, draws: 0, points: 0,
      goals: 0, ownGoals: 0, assists: 0, goalsConceded: 0, teamGoals: 0,
      totalWeeks: 0, totalGoalsPerWeek: 0, totalAssistsPerWeek: 0,
      totalPointsPerWeek: 0, totalGoalsConcededPerWeek: 0,
      averageGoalsConceded: 0, averagePointsPerMatch: 0, pointsPercentage: 0,
      averagePointsPerWeek: 0, averageGoalsPerWeek: 0,
      averageAssistsPerWeek: 0, averageGoalsConcededPerWeek: 0,
      rankings: {}, pointsWithPlayers: {}, pointsAgainstPlayers: {},
      worstPerformingTeammates: {},
    });
  }
  if (docs.length === 1) return docToOverviewStats(docs[0]);

  // Sum raw counters
  let matches = 0, wins = 0, losses = 0, draws = 0, points = 0;
  let goals = 0, ownGoals = 0, assists = 0, goalsConceded = 0, teamGoals = 0;
  let totalWeeks = 0;
  let totalGoalsPerWeek = 0, totalAssistsPerWeek = 0;
  let totalPointsPerWeek = 0, totalGoalsConcededPerWeek = 0;
  const mergedWith: Record<string, { points: number; matches: number }> = {};
  const mergedAgainst: Record<string, { points: number; matches: number }> = {};
  const mergedWorst: Record<string, { points: number; matches: number }> = {};

  for (const doc of docs) {
    matches += doc.matches;
    wins += doc.wins;
    losses += doc.losses;
    draws += doc.draws;
    points += doc.points;
    goals += doc.goals;
    ownGoals += doc.ownGoals;
    assists += doc.assists;
    goalsConceded += doc.goalsConceded;
    teamGoals += doc.teamGoals;
    totalWeeks += doc.totalWeeks;
    totalGoalsPerWeek += doc.totalGoalsPerWeek;
    totalAssistsPerWeek += doc.totalAssistsPerWeek;
    totalPointsPerWeek += doc.totalPointsPerWeek;
    totalGoalsConcededPerWeek += doc.totalGoalsConcededPerWeek;

    for (const [name, data] of Object.entries(doc.pointsWithPlayers)) {
      if (!mergedWith[name]) mergedWith[name] = { points: 0, matches: 0 };
      mergedWith[name].points += data.points;
      mergedWith[name].matches += data.matches;
    }
    for (const [name, data] of Object.entries(doc.pointsAgainstPlayers)) {
      if (!mergedAgainst[name]) mergedAgainst[name] = { points: 0, matches: 0 };
      mergedAgainst[name].points += data.points;
      mergedAgainst[name].matches += data.matches;
    }
    for (const [name, data] of Object.entries(doc.worstPerformingTeammates)) {
      if (!mergedWorst[name]) mergedWorst[name] = { points: 0, matches: 0 };
      mergedWorst[name].points += data.points;
      mergedWorst[name].matches += data.matches;
    }
  }

  // Recompute averages from summed counters
  const merged: PlayerStatsDocument = {
    playerId: docs[0].playerId,
    playerName: docs[0].playerName,
    year: 0,
    updatedAt: Timestamp.now(),
    matches, wins, losses, draws, points,
    goals, ownGoals, assists, goalsConceded, teamGoals,
    totalWeeks,
    totalGoalsPerWeek, totalAssistsPerWeek,
    totalPointsPerWeek, totalGoalsConcededPerWeek,
    averageGoalsConceded: matches > 0 ? parseFloat((goalsConceded / matches).toFixed(2)) : 0,
    averagePointsPerMatch: matches > 0 ? parseFloat((points / matches).toFixed(2)) : 0,
    pointsPercentage: matches > 0 ? parseFloat(((points / (matches * 3)) * 100).toFixed(2)) : 0,
    averagePointsPerWeek: totalWeeks > 0 ? parseFloat((totalPointsPerWeek / totalWeeks).toFixed(2)) : 0,
    averageGoalsPerWeek: totalWeeks > 0 ? parseFloat((totalGoalsPerWeek / totalWeeks).toFixed(2)) : 0,
    averageAssistsPerWeek: totalWeeks > 0 ? parseFloat((totalAssistsPerWeek / totalWeeks).toFixed(2)) : 0,
    averageGoalsConcededPerWeek: totalWeeks > 0 ? parseFloat((totalGoalsConcededPerWeek / totalWeeks).toFixed(2)) : 0,
    rankings: {}, // no cross-year rankings
    pointsWithPlayers: mergedWith,
    pointsAgainstPlayers: mergedAgainst,
    worstPerformingTeammates: mergedWorst,
  };

  return docToOverviewStats(merged);
}

export async function recalculatePlayerStats(futId: string, year: number): Promise<number> {
  const weeks = await getWeeksByDate(futId, String(year));
  const { statsMap } = calculateAllPlayerStats(weeks);

  const collection = db.collection('futs').doc(futId).collection('playerStats');

  // Delete existing docs for this year
  const existingSnap = await collection.where('year', '==', year).get();
  if (!existingSnap.empty) {
    const deleteBatch = db.batch();
    existingSnap.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // Write new docs in batches of 500
  const entries = Object.entries(statsMap);
  for (let i = 0; i < entries.length; i += 500) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + 500);
    for (const [playerId, ps] of chunk) {
      const docId = `${playerId}__${year}`;
      const ref = collection.doc(docId);
      const data = internalStatsToDoc(playerId, ps, year);
      batch.set(ref, data);
    }
    await batch.commit();
  }

  return entries.length;
}

export async function recalculateMonthAwards(futId: string, year: number, month: number): Promise<void> {
  const monthStr = String(month).padStart(2, '0');
  const weeks = await getWeeksByDate(futId, String(year), monthStr);

  if (weeks.length === 0) return;

  const resume = calculateMonthResume(weeks);

  // Query monthPrizes for this month
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const prizesSnap = await db.collection('futs').doc(futId)
    .collection('monthPrizes')
    .where('date', '>=', Timestamp.fromDate(monthStart))
    .where('date', '<=', Timestamp.fromDate(monthEnd))
    .get();

  if (prizesSnap.empty) return;

  // Build player name map from the already-loaded weeks data (no extra read needed)
  const playerNameMap = new Map<string, string>();
  for (const week of weeks) {
    for (const team of week.teams) {
      for (const member of team.players) {
        if (member.player?.id && member.player.name) {
          playerNameMap.set(member.player.id, member.player.name);
        }
      }
    }
  }

  // Calculate best-of-position selection
  const bestOfPos = calculateBestOfEachPosition(weeks);

  // Build set of player names in the selection (2 per position, 1 for GOL)
  const selectionNames = new Set<string>();
  bestOfPos.attackers.slice(0, 2).forEach(p => selectionNames.add(p.name));
  bestOfPos.midfielders.slice(0, 2).forEach(p => selectionNames.add(p.name));
  bestOfPos.defenders.slice(0, 2).forEach(p => selectionNames.add(p.name));
  bestOfPos.goalkeepers.slice(0, 1).forEach(p => selectionNames.add(p.name));

  const batch = db.batch();
  for (const prizeDoc of prizesSnap.docs) {
    const data = prizeDoc.data();
    const playerName = playerNameMap.get(data.playerId) || '';

    const isMVP = resume.mvp[0]?.name === playerName;
    const isTopPointer = resume.topPointer[0]?.name === playerName;
    const isStriker = resume.scorer[0]?.name === playerName;
    const isBestAssist = resume.assists[0]?.name === playerName;
    const isBestDefender = resume.bestDefender[0]?.name === playerName;
    const isLVP = resume.lvp[0]?.name === playerName;
    const isBestOfPosition = selectionNames.has(playerName);

    batch.update(prizeDoc.ref, {
      isMVP, isTopPointer, isStriker, isBestAssist,
      isBestDefender, isLVP, isBestOfPosition,
    });
  }
  await batch.commit();
}

export async function getPlayerStatsDoc(futId: string, playerId: string, year: number): Promise<PlayerStatsDocument | null> {
  const docId = `${playerId}__${year}`;
  const doc = await db.collection('futs').doc(futId).collection('playerStats').doc(docId).get();
  if (!doc.exists) return null;
  return doc.data() as PlayerStatsDocument;
}

export async function getAllPlayerStatsDocs(futId: string, playerId: string): Promise<PlayerStatsDocument[]> {
  const snap = await db.collection('futs').doc(futId)
    .collection('playerStats')
    .where('playerId', '==', playerId)
    .get();
  return snap.docs.map(d => d.data() as PlayerStatsDocument);
}

// ============================================================
// CREATE WEEK + TEAMS + MATCHES (mega operation)
// ============================================================

interface GoalInput {
  playerId?: string;
  ownGoalPlayerId?: string;
  goals: number;
}

interface AssistInput {
  playerId: string;
  assists: number;
}

interface MatchInput {
  homeTeamIndex: number;
  awayTeamIndex: number;
  homeGoals: GoalInput[];
  awayGoals: GoalInput[];
  homeAssists: AssistInput[];
  awayAssists: AssistInput[];
}

interface TeamStats {
  teamId: string;
  points: number;
  matchesPlayed: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
}

function calculateChampion(teamStats: Map<string, TeamStats>): string | null {
  const statsArray = Array.from(teamStats.values());
  const maxPoints = Math.max(...statsArray.map(s => s.points));

  let champions = statsArray.filter(s => s.points === maxPoints);

  if (champions.length > 1) {
    const minMatches = Math.min(...champions.map(c => c.matchesPlayed));
    champions = champions.filter(c => c.matchesPlayed === minMatches);
  }

  if (champions.length > 1) {
    const maxGoalDiff = Math.max(...champions.map(c => c.goalDifference));
    champions = champions.filter(c => c.goalDifference === maxGoalDiff);
  }

  if (champions.length > 1) {
    const maxGoalsScored = Math.max(...champions.map(c => c.goalsScored));
    champions = champions.filter(c => c.goalsScored === maxGoalsScored);
  }

  return champions.length === 1 ? champions[0].teamId : null;
}

function calculateTeamStats(createdTeamIds: string[], matchesData: { homeTeamId: string; awayTeamId: string; homeGoals: number; awayGoals: number }[]): Map<string, TeamStats> {
  const teamStats = new Map<string, TeamStats>();

  createdTeamIds.forEach(teamId => {
    teamStats.set(teamId, {
      teamId,
      points: 0,
      matchesPlayed: 0,
      goalsScored: 0,
      goalsConceded: 0,
      goalDifference: 0,
    });
  });

  matchesData.forEach(match => {
    const homeStats = teamStats.get(match.homeTeamId)!;
    const awayStats = teamStats.get(match.awayTeamId)!;

    homeStats.matchesPlayed++;
    awayStats.matchesPlayed++;

    homeStats.goalsScored += match.homeGoals;
    homeStats.goalsConceded += match.awayGoals;
    awayStats.goalsScored += match.awayGoals;
    awayStats.goalsConceded += match.homeGoals;

    homeStats.goalDifference = homeStats.goalsScored - homeStats.goalsConceded;
    awayStats.goalDifference = awayStats.goalsScored - awayStats.goalsConceded;

    if (match.homeGoals > match.awayGoals) {
      homeStats.points += 3;
    } else if (match.awayGoals > match.homeGoals) {
      awayStats.points += 3;
    } else {
      homeStats.points += 1;
      awayStats.points += 1;
    }
  });

  return teamStats;
}

interface StreakEntry {
  playerId: string;
  streakCount: number;
}

interface FutStreaksDocument {
  weekChampion: StreakEntry[];
  weekStriker: StreakEntry[];
  weekTopAssist: StreakEntry[];
  monthChampion: StreakEntry | null;
  monthStriker: StreakEntry | null;
  monthTopAssist: StreakEntry | null;
}

const STREAKS_DOC_ID = 'current';

async function calculateAndUpdateStreaks(
  futId: string,
  matches: MatchInput[],
  teams: string[][],
  createdTeamIds: string[],
  championTeamId: string | null,
): Promise<void> {
  const streakDocRef = db.collection('futs').doc(futId).collection('streaks').doc(STREAKS_DOC_ID);

  // 1. Calculate week highlights from match data
  const goalsByPlayer: Map<string, number> = new Map();
  const assistsByPlayer: Map<string, number> = new Map();

  for (const match of matches) {
    for (const goal of [...match.homeGoals, ...match.awayGoals]) {
      if (goal.playerId) {
        goalsByPlayer.set(goal.playerId, (goalsByPlayer.get(goal.playerId) ?? 0) + goal.goals);
      }
    }
    for (const assist of [...match.homeAssists, ...match.awayAssists]) {
      if (assist.playerId) {
        assistsByPlayer.set(assist.playerId, (assistsByPlayer.get(assist.playerId) ?? 0) + assist.assists);
      }
    }
  }

  const maxGoals = goalsByPlayer.size > 0 ? Math.max(...goalsByPlayer.values()) : 0;
  const maxAssists = assistsByPlayer.size > 0 ? Math.max(...assistsByPlayer.values()) : 0;

  const topScorerIds = maxGoals > 0
    ? [...goalsByPlayer.entries()].filter(([, g]) => g === maxGoals).map(([id]) => id)
    : [];
  const topAssistIds = maxAssists > 0
    ? [...assistsByPlayer.entries()].filter(([, a]) => a === maxAssists).map(([id]) => id)
    : [];

  const championIndex = championTeamId ? createdTeamIds.indexOf(championTeamId) : -1;
  const championPlayerIds = championIndex >= 0 ? teams[championIndex] : [];

  // 2. Read current streaks document (1 read)
  const streakSnap = await streakDocRef.get();
  const existing = streakSnap.exists ? (streakSnap.data() as FutStreaksDocument) : null;

  // Helper: look up previous streakCount for a player in an existing array
  const prevCount = (arr: StreakEntry[] | undefined, playerId: string): number =>
    arr?.find(e => e.playerId === playerId)?.streakCount ?? 0;

  // 3. Build new arrays for each week category
  const newWeekChampion: StreakEntry[] = championPlayerIds.map(playerId => ({
    playerId,
    streakCount: prevCount(existing?.weekChampion, playerId) + 1,
  }));

  const newWeekStriker: StreakEntry[] = topScorerIds.map(playerId => ({
    playerId,
    streakCount: prevCount(existing?.weekStriker, playerId) + 1,
  }));

  const newWeekTopAssist: StreakEntry[] = topAssistIds.map(playerId => ({
    playerId,
    streakCount: prevCount(existing?.weekTopAssist, playerId) + 1,
  }));

  // 4. Write the updated document (1 write), preserving month fields
  const updatedDoc: FutStreaksDocument = {
    weekChampion: newWeekChampion,
    weekStriker: newWeekStriker,
    weekTopAssist: newWeekTopAssist,
    monthChampion: existing?.monthChampion ?? null,
    monthStriker: existing?.monthStriker ?? null,
    monthTopAssist: existing?.monthTopAssist ?? null,
  };

  await streakDocRef.set(updatedDoc);
}

export async function createWeekAndMatches(
  futId: string,
  date: string,
  teams: string[][],
  matches: MatchInput[]
) {
  const weekDate = new Date(date);
  const futRef = db.collection('futs').doc(futId);

  // Validate all players exist
  const allPlayerIds = [...new Set(teams.flat())];
  const playersSnap = await futRef.collection('players')
    .where('__name__', 'in', allPlayerIds.length <= 30 ? allPlayerIds : allPlayerIds.slice(0, 30))
    .get();

  // For more than 30 players, do multiple queries
  let existingPlayerIds = new Set(playersSnap.docs.map(d => d.id));
  if (allPlayerIds.length > 30) {
    for (let i = 30; i < allPlayerIds.length; i += 30) {
      const batch = allPlayerIds.slice(i, i + 30);
      const snap = await futRef.collection('players').where('__name__', 'in', batch).get();
      snap.docs.forEach(d => existingPlayerIds.add(d.id));
    }
  }

  if (existingPlayerIds.size !== allPlayerIds.length) {
    throw new Error('Um ou mais jogadores não existem');
  }

  // Check if week with same date already exists
  const dayStart = new Date(weekDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(weekDate);
  dayEnd.setHours(23, 59, 59, 999);

  const existingWeeksSnap = await futRef.collection('weeks')
    .where('date', '>=', Timestamp.fromDate(dayStart))
    .where('date', '<=', Timestamp.fromDate(dayEnd))
    .get();

  let weekId: string;
  const createdTeamIds: string[] = [];

  if (existingWeeksSnap.size > 0) {
    // Week exists, check if it has matches
    const existingWeekId = existingWeeksSnap.docs[0].id;
    const existingMatchesSnap = await futRef.collection('weeks').doc(existingWeekId).collection('matches').get();
    if (existingMatchesSnap.size > 0) {
      throw new Error('Já existem partidas cadastradas para esta semana');
    }

    weekId = existingWeekId;

    // Get existing teams
    const existingTeamsSnap = await futRef.collection('weeks').doc(weekId).collection('teams').get();
    existingTeamsSnap.docs.forEach(d => createdTeamIds.push(d.id));
  } else {
    // Create week
    weekId = generateId();
    await Promise.all([
      futRef.collection('weeks').doc(weekId).set({
        date: Timestamp.fromDate(new Date(date)),
      }),
      futRef.update({ years: FieldValue.arrayUnion(weekDate.getFullYear()) }),
    ]);

    // Create teams
    const batch = db.batch();
    for (const teamPlayers of teams) {
      const teamId = generateId();
      createdTeamIds.push(teamId);
      const teamRef = futRef.collection('weeks').doc(weekId).collection('teams').doc(teamId);
      batch.set(teamRef, {
        playerIds: teamPlayers,
        champion: false,
        points: 0,
      });
    }
    await batch.commit();
  }

  // Create matches
  const matchesCreated: { id: string; homeTeamId: string; awayTeamId: string; homeGoals: number; awayGoals: number }[] = [];
  const matchBatch = db.batch();

  for (let i = 0; i < matches.length; i++) {
    const matchData = matches[i];
    const homeTeamId = createdTeamIds[matchData.homeTeamIndex];
    const awayTeamId = createdTeamIds[matchData.awayTeamIndex];

    const homeGoalsCount = matchData.homeGoals.reduce((acc, g) => acc + g.goals, 0);
    const awayGoalsCount = matchData.awayGoals.reduce((acc, g) => acc + g.goals, 0);

    const matchId = generateId();
    const matchRef = futRef.collection('weeks').doc(weekId).collection('matches').doc(matchId);

    matchBatch.set(matchRef, {
      date: Timestamp.fromDate(new Date(date)),
      homeTeamId,
      awayTeamId,
      orderIndex: i,
      result: { homeGoals: homeGoalsCount, awayGoals: awayGoalsCount },
      goals: [
        ...matchData.homeGoals.map(g => ({
          playerId: g.playerId || null,
          ownGoalPlayerId: g.ownGoalPlayerId || null,
          goals: g.goals,
        })),
        ...matchData.awayGoals.map(g => ({
          playerId: g.playerId || null,
          ownGoalPlayerId: g.ownGoalPlayerId || null,
          goals: g.goals,
        })),
      ],
      assists: [
        ...matchData.homeAssists.map(a => ({
          playerId: a.playerId,
          assists: a.assists,
        })),
        ...matchData.awayAssists.map(a => ({
          playerId: a.playerId,
          assists: a.assists,
        })),
      ],
    });

    matchesCreated.push({ id: matchId, homeTeamId, awayTeamId, homeGoals: homeGoalsCount, awayGoals: awayGoalsCount });
  }

  await matchBatch.commit();

  // Calculate team stats and champion
  const teamStats = calculateTeamStats(createdTeamIds, matchesCreated);
  const championTeamId = calculateChampion(teamStats);

  // Update teams with stats
  const updateBatch = db.batch();
  for (const [teamId, stats] of teamStats.entries()) {
    const teamRef = futRef.collection('weeks').doc(weekId).collection('teams').doc(teamId);
    updateBatch.update(teamRef, {
      points: stats.points,
      champion: teamId === championTeamId,
    });
  }
  await updateBatch.commit();

  // Calculate and update player streaks (non-blocking, fire-and-forget errors are logged)
  await calculateAndUpdateStreaks(futId, matches, teams, createdTeamIds, championTeamId).catch(err =>
    console.error('Erro ao calcular streaks:', err),
  );

  // Update player isChampion flags
  const allPlayersInWeek = teams.flat();
  const playerUpdateBatch = db.batch();

  for (const pid of allPlayersInWeek) {
    const playerRef = futRef.collection('players').doc(pid);
    playerUpdateBatch.update(playerRef, { isChampion: false });
  }
  await playerUpdateBatch.commit();

  if (championTeamId) {
    const championIndex = createdTeamIds.indexOf(championTeamId);
    const championPlayerIds = teams[championIndex];

    const championBatch = db.batch();
    for (const pid of championPlayerIds) {
      const playerRef = futRef.collection('players').doc(pid);
      championBatch.update(playerRef, { isChampion: true });
    }
    await championBatch.commit();

    // Update month prizes — upsert with set+merge (no read needed)
    const monthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);
    const monthKey = `${weekDate.getFullYear()}_${String(weekDate.getMonth() + 1).padStart(2, '0')}`;
    const prizeBatch = db.batch();

    for (const pid of championPlayerIds) {
      const prizeRef = futRef.collection('monthPrizes').doc(`${monthKey}_${pid}`);
      prizeBatch.set(
        prizeRef,
        {
          playerId: pid,
          date: Timestamp.fromDate(monthStart),
          championTimes: FieldValue.increment(1),
          championDates: FieldValue.arrayUnion(Timestamp.fromDate(new Date(date))),
        },
        { merge: true },
      );
    }
    await prizeBatch.commit();
  }

  return {
    week: { id: weekId, date },
    teams: createdTeamIds.map((teamId, i) => ({
      id: teamId,
      points: teamStats.get(teamId)?.points || 0,
      champion: teamId === championTeamId,
      players: teams[i],
    })),
    matches: matchesCreated.map(m => ({
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      result: { homeGoals: m.homeGoals, awayGoals: m.awayGoals },
    })),
    championTeamId,
  };
}

// ============================================================
// UPDATE WEEK AND MATCHES
// ============================================================

export async function updateWeekAndMatches(
  futId: string,
  weekId: string,
  date: string,
  teams: string[][],
  matches: MatchInput[]
) {
  const futRef = db.collection('futs').doc(futId);
  const weekRef = futRef.collection('weeks').doc(weekId);

  // Verify week exists
  const weekDoc = await weekRef.get();
  if (!weekDoc.exists) throw new Error('Semana não encontrada');

  // Get existing teams and identify previous champions before any changes
  const existingTeamsSnap = await weekRef.collection('teams').get();
  if (teams.length !== existingTeamsSnap.size) {
    throw new Error(`Esperado ${existingTeamsSnap.size} times, recebido ${teams.length}. Não é permitido adicionar ou remover times.`);
  }

  const existingTeamIds = existingTeamsSnap.docs.map(d => d.id);
  const weekDate = new Date(date);

  // Capture previous champion players and week date before update
  const previousWeekData = weekDoc.data()!;
  const previousWeekDate: Date = previousWeekData.date.toDate
    ? previousWeekData.date.toDate()
    : new Date(previousWeekData.date);
  const previousChampionPlayerIds: string[] = [];
  for (const teamDoc of existingTeamsSnap.docs) {
    const teamData = teamDoc.data();
    if (teamData.champion) {
      previousChampionPlayerIds.push(...(teamData.playerIds || []));
    }
  }

  // Validate all players
  const allPlayerIds = [...new Set(teams.flat())];
  for (let i = 0; i < allPlayerIds.length; i += 30) {
    const batch = allPlayerIds.slice(i, i + 30);
    const snap = await futRef.collection('players').where('__name__', 'in', batch).get();
    if (snap.size !== batch.length) throw new Error('Um ou mais jogadores não existem');
  }

  // Update week date
  await weekRef.update({ date: Timestamp.fromDate(new Date(date)) });

  // Update team players
  const teamUpdateBatch = db.batch();
  existingTeamIds.forEach((teamId, i) => {
    const teamRef = weekRef.collection('teams').doc(teamId);
    teamUpdateBatch.update(teamRef, { playerIds: teams[i] });
  });
  await teamUpdateBatch.commit();

  // Delete old matches
  const oldMatchesSnap = await weekRef.collection('matches').get();
  if (oldMatchesSnap.size > 0) {
    const deleteBatch = db.batch();
    oldMatchesSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // Create new matches
  const matchesCreated: { id: string; homeTeamId: string; awayTeamId: string; homeGoals: number; awayGoals: number }[] = [];
  const matchBatch = db.batch();

  for (let i = 0; i < matches.length; i++) {
    const matchData = matches[i];
    const homeTeamId = existingTeamIds[matchData.homeTeamIndex];
    const awayTeamId = existingTeamIds[matchData.awayTeamIndex];

    const homeGoalsCount = matchData.homeGoals.reduce((acc, g) => acc + g.goals, 0);
    const awayGoalsCount = matchData.awayGoals.reduce((acc, g) => acc + g.goals, 0);

    const matchId = generateId();
    const matchRef = weekRef.collection('matches').doc(matchId);

    matchBatch.set(matchRef, {
      date: Timestamp.fromDate(new Date(date)),
      homeTeamId,
      awayTeamId,
      orderIndex: i,
      result: { homeGoals: homeGoalsCount, awayGoals: awayGoalsCount },
      goals: [
        ...matchData.homeGoals.map(g => ({ playerId: g.playerId || null, ownGoalPlayerId: g.ownGoalPlayerId || null, goals: g.goals })),
        ...matchData.awayGoals.map(g => ({ playerId: g.playerId || null, ownGoalPlayerId: g.ownGoalPlayerId || null, goals: g.goals })),
      ],
      assists: [
        ...matchData.homeAssists.map(a => ({ playerId: a.playerId, assists: a.assists })),
        ...matchData.awayAssists.map(a => ({ playerId: a.playerId, assists: a.assists })),
      ],
    });

    matchesCreated.push({ id: matchId, homeTeamId, awayTeamId, homeGoals: homeGoalsCount, awayGoals: awayGoalsCount });
  }
  await matchBatch.commit();

  // Calculate team stats and champion
  const teamStats = calculateTeamStats(existingTeamIds, matchesCreated);
  const championTeamId = calculateChampion(teamStats);

  // Update teams
  const statsBatch = db.batch();
  for (const [teamId, stats] of teamStats.entries()) {
    statsBatch.update(weekRef.collection('teams').doc(teamId), {
      points: stats.points,
      champion: teamId === championTeamId,
    });
  }
  await statsBatch.commit();

  // Reset all week player champions
  const allWeekPlayerIds = teams.flat();
  const resetBatch = db.batch();
  for (const pid of allWeekPlayerIds) {
    resetBatch.update(futRef.collection('players').doc(pid), { isChampion: false });
  }
  await resetBatch.commit();

  // Set champion players
  if (championTeamId) {
    const championIndex = existingTeamIds.indexOf(championTeamId);
    const championPlayerIds = teams[championIndex];

    const champBatch = db.batch();
    for (const pid of championPlayerIds) {
      champBatch.update(futRef.collection('players').doc(pid), { isChampion: true });
    }
    await champBatch.commit();

    // Update month prizes — remove old champion dates, add new ones

    // Remove championDate from previous champions who are no longer champions
    const previousMonthKey = `${previousWeekDate.getFullYear()}_${String(previousWeekDate.getMonth() + 1).padStart(2, '0')}`;
    const removedChampions = previousChampionPlayerIds.filter(pid => !championPlayerIds.includes(pid));

    for (const pid of removedChampions) {
      const prizeRef = futRef.collection('monthPrizes').doc(`${previousMonthKey}_${pid}`);
      const prizeDoc = await prizeRef.get();
      if (prizeDoc.exists) {
        const existingDates: Timestamp[] = prizeDoc.data()!.championDates || [];
        const filtered = existingDates.filter(d => d.toDate().getTime() !== previousWeekDate.getTime());
        if (filtered.length === 0) {
          await prizeRef.delete();
        } else {
          await prizeRef.update({ championTimes: filtered.length, championDates: filtered });
        }
      }
    }

    // Add/update championDate for current champions
    const monthKey = `${weekDate.getFullYear()}_${String(weekDate.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);

    for (const pid of championPlayerIds) {
      const prizeRef = futRef.collection('monthPrizes').doc(`${monthKey}_${pid}`);
      const prizeDoc = await prizeRef.get();

      if (!prizeDoc.exists) {
        await prizeRef.set({
          playerId: pid,
          date: Timestamp.fromDate(monthStart),
          championTimes: 1,
          championDates: [Timestamp.fromDate(new Date(date))],
        });
      } else {
        // Remove old date for this week (exact match), then add new
        const existingDates: Timestamp[] = prizeDoc.data()!.championDates || [];
        const filteredDates = existingDates.filter(d =>
          d.toDate().getTime() !== previousWeekDate.getTime()
        );
        filteredDates.push(Timestamp.fromDate(new Date(date)));
        await prizeRef.update({
          championTimes: filteredDates.length,
          championDates: filteredDates,
        });
      }
    }
  }

  return {
    week: { id: weekId, date },
    teams: existingTeamIds.map((teamId, i) => ({
      id: teamId,
      players: teams[i],
    })),
    matches: matchesCreated.map(m => ({
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      result: { homeGoals: m.homeGoals, awayGoals: m.awayGoals },
    })),
    championTeamId,
  };
}

// ============================================================
// DELETE WEEK
// ============================================================

export async function deleteWeekAndRelated(futId: string, weekId: string) {
  const futRef = db.collection('futs').doc(futId);
  const weekRef = futRef.collection('weeks').doc(weekId);

  const weekDoc = await weekRef.get();
  if (!weekDoc.exists) throw new Error('Semana não encontrada');

  const weekData = weekDoc.data()!;
  const weekDate = weekData.date.toDate ? weekData.date.toDate() : new Date(weekData.date);

  // Get teams
  const teamsSnap = await weekRef.collection('teams').get();
  const allPlayerIds: string[] = [];
  const championPlayerIds: string[] = [];

  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data();
    const playerIds: string[] = teamData.playerIds || [];
    allPlayerIds.push(...playerIds);
    if (teamData.champion) {
      championPlayerIds.push(...playerIds);
    }
  }

  // Handle month prizes for champions
  if (championPlayerIds.length > 0) {
    const monthKey = `${weekDate.getFullYear()}_${String(weekDate.getMonth() + 1).padStart(2, '0')}`;

    for (const pid of championPlayerIds) {
      const prizeRef = futRef.collection('monthPrizes').doc(`${monthKey}_${pid}`);
      const prizeDoc = await prizeRef.get();

      if (prizeDoc.exists) {
        const data = prizeDoc.data()!;
        const existingDates: Timestamp[] = data.championDates || [];
        const filtered = existingDates.filter(d =>
          d.toDate().getTime() !== weekDate.getTime()
        );

        if (filtered.length === 0) {
          await prizeRef.delete();
        } else {
          await prizeRef.update({
            championTimes: filtered.length,
            championDates: filtered,
          });
        }
      }
    }
  }

  // Determine which players are still champions in other weeks via a single collectionGroup query
  const uniquePlayerIds = [...new Set(allPlayerIds)];
  if (uniquePlayerIds.length > 0) {
    const otherChampionSnap = await db.collectionGroup('teams')
      .where('champion', '==', true)
      .get();

    const stillChampionIds = new Set<string>();
    for (const doc of otherChampionSnap.docs) {
      // Ignore teams belonging to the week being deleted
      if (doc.ref.parent.parent?.id === weekId) continue;
      // Also ignore if not in this fut
      const pathSegments = doc.ref.path.split('/');
      const docFutId = pathSegments[1];
      if (docFutId !== futId) continue;

      const playerIds: string[] = doc.data().playerIds || [];
      for (const pid of playerIds) {
        if (uniquePlayerIds.includes(pid)) stillChampionIds.add(pid);
      }
    }

    const resetBatch = db.batch();
    for (const pid of uniquePlayerIds) {
      if (!stillChampionIds.has(pid)) {
        resetBatch.update(futRef.collection('players').doc(pid), { isChampion: false });
      }
    }
    await resetBatch.commit();
  }

  // Delete matches
  const matchesSnap = await weekRef.collection('matches').get();
  if (matchesSnap.size > 0) {
    const deleteBatch = db.batch();
    matchesSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // Delete teams
  if (teamsSnap.size > 0) {
    const deleteBatch = db.batch();
    teamsSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // Delete week
  await weekRef.delete();

  // Recalculate years on the fut document after deletion
  const remainingWeeksSnap = await futRef.collection('weeks').get();
  const remainingYears = [...new Set(remainingWeeksSnap.docs.map(d => {
    const dt = d.data().date;
    return (dt instanceof Timestamp ? dt.toDate() : new Date(dt)).getFullYear();
  }))].sort((a, b) => b - a);
  await futRef.update({ years: remainingYears });

  return {
    deletedWeekId: weekId,
    deletedWeekDate: weekDate.toISOString(),
    championPlayersAffected: championPlayerIds.length,
    totalPlayersAffected: allPlayerIds.length,
  };
}

// ============================================================
// PLAYER SCORES
// ============================================================

export async function createPlayerScores(futId: string, scores: { playerId: string; points: number }[]): Promise<void> {
  const batch = db.batch();
  const now = Timestamp.fromDate(new Date());

  for (const score of scores) {
    const scoreId = generateId();
    const ref = db.collection('futs').doc(futId).collection('playerScores').doc(scoreId);
    batch.set(ref, {
      playerId: score.playerId,
      points: score.points,
      date: now,
    });
  }

  await batch.commit();
}

// ============================================================
// GOALS (standalone create)
// ============================================================

export async function createGoals(futId: string, weekId: string, matchId: string, goals: { playerId?: string; ownGoalPlayerId?: string; goals: number }[]): Promise<void> {
  const matchRef = db.collection('futs').doc(futId).collection('weeks').doc(weekId).collection('matches').doc(matchId);
  const matchDoc = await matchRef.get();
  if (!matchDoc.exists) throw new Error('Partida não encontrada');

  const existingGoals = matchDoc.data()!.goals || [];
  await matchRef.update({
    goals: [...existingGoals, ...goals.map(g => ({
      playerId: g.playerId || null,
      ownGoalPlayerId: g.ownGoalPlayerId || null,
      goals: g.goals,
    }))],
  });
}

// ============================================================
// UPDATE TEAMS (standalone)
// ============================================================

export async function updateTeams(
  futId: string,
  teamsData: { id: string; champion: boolean; points: number; players: { id: string; isChampion: boolean }[]; weekId?: string }[]
): Promise<void> {
  // Reset isChampion only for players present in the provided teams (avoids loading the full collection)
  const allPlayerIds = [...new Set(teamsData.flatMap(t => t.players.map(p => p.id)))];
  const resetBatch = db.batch();
  for (const pid of allPlayerIds) {
    resetBatch.update(db.collection('futs').doc(futId).collection('players').doc(pid), { isChampion: false });
  }
  await resetBatch.commit();

  // Update each team and its players
  for (const team of teamsData) {
    // We need the weekId to locate the team in Firestore
    // Teams are stored under weeks/{weekId}/teams/{teamId}
    // The frontend should provide weekId, or we search for it
    if (team.weekId) {
      const teamRef = db.collection('futs').doc(futId)
        .collection('weeks').doc(team.weekId)
        .collection('teams').doc(team.id);
      await teamRef.update({ champion: team.champion, points: team.points });
    }

    // Update players
    const playerBatch = db.batch();
    for (const player of team.players) {
      const playerRef = db.collection('futs').doc(futId).collection('players').doc(player.id);
      playerBatch.update(playerRef, { isChampion: player.isChampion });
    }
    await playerBatch.commit();

    // Update month prizes for champion players
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthKey = `${currentDate.getFullYear()}_${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const prizeUpsertBatch = db.batch();
    for (const player of team.players) {
      if (player.isChampion) {
        const prizeRef = db.collection('futs').doc(futId).collection('monthPrizes').doc(`${monthKey}_${player.id}`);
        prizeUpsertBatch.set(
          prizeRef,
          {
            playerId: player.id,
            date: Timestamp.fromDate(monthStart),
            championTimes: FieldValue.increment(1),
            championDates: FieldValue.arrayUnion(Timestamp.fromDate(currentDate)),
          },
          { merge: true },
        );
      }
    }
    await prizeUpsertBatch.commit();
  }
}

// ============================================================
// MATCHES (standalone get)
// ============================================================

export async function getMatches(futId: string): Promise<MatchData[]> {
  const weeksSnap = await db.collection('futs').doc(futId).collection('weeks').get();
  const allPlayers = await getPlayers(futId);
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));

  const allMatches: MatchData[] = [];

  for (const weekDoc of weeksSnap.docs) {
    const matchesSnap = await weekDoc.ref.collection('matches').get();
    for (const matchDoc of matchesSnap.docs) {
      const data = matchDoc.data();
      allMatches.push({
        id: matchDoc.id,
        date: toDate(data.date),
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        orderIndex: data.orderIndex ?? null,
        result: data.result ? { id: matchDoc.id + '_r', matchId: matchDoc.id, homeGoals: data.result.homeGoals, awayGoals: data.result.awayGoals } : null,
        goals: (data.goals || []).map((g: any, i: number) => ({
          id: `${matchDoc.id}_g${i}`,
          matchId: matchDoc.id,
          playerId: g.playerId,
          ownGoalPlayerId: g.ownGoalPlayerId,
          goals: g.goals,
          player: g.playerId ? playerMap.get(g.playerId) || null : null,
          ownGoalPlayer: g.ownGoalPlayerId ? playerMap.get(g.ownGoalPlayerId) || null : null,
        })),
        assists: (data.assists || []).map((a: any, i: number) => ({
          id: `${matchDoc.id}_a${i}`,
          matchId: matchDoc.id,
          playerId: a.playerId,
          assists: a.assists,
          player: a.playerId ? playerMap.get(a.playerId) || null : null,
        })),
      });
    }
  }

  return allMatches;
}

// ============================================================
// TEAMS (standalone get)
// ============================================================

export async function getTeams(futId: string): Promise<TeamData[]> {
  const weeksSnap = await db.collection('futs').doc(futId).collection('weeks').get();
  const allPlayers = await getPlayers(futId);
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));

  const allTeams: TeamData[] = [];

  for (const weekDoc of weeksSnap.docs) {
    const teamsSnap = await weekDoc.ref.collection('teams').get();
    for (const teamDoc of teamsSnap.docs) {
      const data = teamDoc.data();
      allTeams.push({
        id: teamDoc.id,
        weekId: weekDoc.id,
        champion: data.champion || false,
        points: data.points || 0,
        players: (data.playerIds || []).map((pid: string) => ({
          id: `${teamDoc.id}_${pid}`,
          playerId: pid,
          teamId: teamDoc.id,
          player: playerMap.get(pid) || { id: pid, name: 'Unknown', position: '', overall: {}, isChampion: false, monthChampion: false, monthStriker: false, monthBestDefender: false, monthTopPointer: false, monthTopAssist: false, monthLVP: false },
        })),
        matchesHome: [],
        matchesAway: [],
      });
    }
  }

  return allTeams;
}

// ============================================================
// FINALIZE MONTH
// ============================================================

export interface FinalizeMonthAwards {
  mvp: { playerId: string; playerName: string };
  topPointer: { playerId: string; playerName: string };
  scorer: { playerId: string; playerName: string };
  assists: { playerId: string; playerName: string };
  bestDefender: { playerId: string; playerName: string };
  lvp: { playerId: string; playerName: string };
}

export interface FinalizeMonthTeam {
  atackers: string[];
  midfielders: string[];
  defenders: string[];
  goalkeepers: string[];
}

export async function isMonthFinalized(futId: string, year: number, month: number): Promise<boolean> {
  const docId = `${year}-${String(month).padStart(2, '0')}`;
  const doc = await db.collection('futs').doc(futId).collection('finalizedMonths').doc(docId).get();
  return doc.exists;
}

export async function finalizeMonth(
  futId: string,
  year: number,
  month: number,
  awards: FinalizeMonthAwards,
  teamOfTheMonth: FinalizeMonthTeam,
  adminUid: string,
): Promise<void> {
  const docId = `${year}-${String(month).padStart(2, '0')}`;
  const docRef = db.collection('futs').doc(futId).collection('finalizedMonths').doc(docId);

  const existing = await docRef.get();
  if (existing.exists) {
    throw new Error('MONTH_ALREADY_FINALIZED');
  }

  // Save finalized month document
  await docRef.set({
    year,
    month,
    finalizedAt: Timestamp.now(),
    finalizedBy: adminUid,
    awards,
    teamOfTheMonth,
  });

  // Update monthPrizes with admin selections
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const prizesSnap = await db.collection('futs').doc(futId)
    .collection('monthPrizes')
    .where('date', '>=', Timestamp.fromDate(monthStart))
    .where('date', '<=', Timestamp.fromDate(monthEnd))
    .get();

  const players = await getPlayers(futId);
  const playerNameMap = new Map(players.map(p => [p.id, p.name]));

  // Build set of team-of-month player names
  const selectionNames = new Set<string>([
    ...teamOfTheMonth.atackers,
    ...teamOfTheMonth.midfielders,
    ...teamOfTheMonth.defenders,
    ...teamOfTheMonth.goalkeepers,
  ]);

  if (!prizesSnap.empty) {
    const prizesBatch = db.batch();
    for (const prizeDoc of prizesSnap.docs) {
      const data = prizeDoc.data();
      const playerName = playerNameMap.get(data.playerId) || '';

      prizesBatch.update(prizeDoc.ref, {
        isMVP: awards.mvp.playerName === playerName,
        isTopPointer: awards.topPointer.playerName === playerName,
        isStriker: awards.scorer.playerName === playerName,
        isBestAssist: awards.assists.playerName === playerName,
        isBestDefender: awards.bestDefender.playerName === playerName,
        isLVP: awards.lvp.playerName === playerName,
        isBestOfPosition: selectionNames.has(playerName),
      });
    }
    await prizesBatch.commit();
  }

  // Update player documents with month award flags
  await applyMonthAwardsToPlayerDocs(futId, players, awards, selectionNames);

  // Update month streak fields in the centralized streaks document
  await updateMonthStreaks(futId, awards);
}

async function updateMonthStreaks(futId: string, awards: FinalizeMonthAwards): Promise<void> {
  const streakDocRef = db.collection('futs').doc(futId).collection('streaks').doc(STREAKS_DOC_ID);
  const streakSnap = await streakDocRef.get();
  const existing = streakSnap.exists ? (streakSnap.data() as FutStreaksDocument) : null;

  const buildMonthEntry = (
    newPlayerId: string,
    prev: StreakEntry | null | undefined,
  ): StreakEntry => ({
    playerId: newPlayerId,
    streakCount: prev?.playerId === newPlayerId ? (prev.streakCount ?? 0) + 1 : 1,
  });

  await streakDocRef.set(
    {
      monthChampion: buildMonthEntry(awards.mvp.playerId, existing?.monthChampion),
      monthStriker: buildMonthEntry(awards.scorer.playerId, existing?.monthStriker),
      monthTopAssist: buildMonthEntry(awards.assists.playerId, existing?.monthTopAssist),
    },
    { merge: true },
  );
}

async function applyMonthAwardsToPlayerDocs(
  futId: string,
  players: PlayerData[],
  awards: FinalizeMonthAwards,
  teamOfMonthNames: Set<string>,
): Promise<void> {
  const playersRef = db.collection('futs').doc(futId).collection('players');

  // Process in batches of 500 (Firestore limit)
  for (let i = 0; i < players.length; i += 500) {
    const chunk = players.slice(i, i + 500);
    const batch = db.batch();

    for (const player of chunk) {
      const ref = playersRef.doc(player.id);
      batch.update(ref, {
        monthChampion: player.id === awards.mvp.playerId,
        monthTopPointer: player.id === awards.topPointer.playerId,
        monthStriker: player.id === awards.scorer.playerId,
        monthBestAssist: player.id === awards.assists.playerId,
        monthBestDefender: player.id === awards.bestDefender.playerId,
        monthLVP: player.id === awards.lvp.playerId,
        monthBestOfPosition: teamOfMonthNames.has(player.name),
      });
    }

    await batch.commit();
  }
}

// ============================================================
// REAPPLY MONTH AWARDS (retroactive migration)
// ============================================================

export async function reapplyFinalizedMonthAwards(
  futId: string,
  year: number,
  month: number,
): Promise<void> {
  const docId = `${year}-${String(month).padStart(2, '0')}`;
  const docSnap = await db.collection('futs').doc(futId).collection('finalizedMonths').doc(docId).get();

  if (!docSnap.exists) {
    throw new Error('MONTH_NOT_FINALIZED');
  }

  const { awards, teamOfTheMonth } = docSnap.data() as {
    awards: FinalizeMonthAwards;
    teamOfTheMonth: FinalizeMonthTeam;
  };

  const players = await getPlayers(futId);

  const selectionNames = new Set<string>([
    ...teamOfTheMonth.atackers,
    ...teamOfTheMonth.midfielders,
    ...teamOfTheMonth.defenders,
    ...teamOfTheMonth.goalkeepers,
  ]);

  await applyMonthAwardsToPlayerDocs(futId, players, awards, selectionNames);
}

// ============================================================
// FINALIZE YEAR
// ============================================================

export type FinalizeYearAwards = FinalizeMonthAwards;
export type FinalizeYearTeam = FinalizeMonthTeam;

export async function isYearFinalized(futId: string, year: number): Promise<boolean> {
  const doc = await db.collection('futs').doc(futId).collection('yearPrizes').doc(String(year)).get();
  return doc.exists;
}

export async function finalizeYear(
  futId: string,
  year: number,
  awards: FinalizeYearAwards,
  teamOfTheYear: FinalizeYearTeam,
  adminUid: string,
): Promise<void> {
  const docRef = db.collection('futs').doc(futId).collection('yearPrizes').doc(String(year));

  const existing = await docRef.get();
  if (existing.exists) {
    throw new Error('YEAR_ALREADY_FINALIZED');
  }

  // Get all monthPrizes for this year to calculate championOfTheWeek per player
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const monthPrizesSnap = await db.collection('futs').doc(futId)
    .collection('monthPrizes')
    .where('date', '>=', Timestamp.fromDate(yearStart))
    .where('date', '<=', Timestamp.fromDate(yearEnd))
    .get();

  // Sum championTimes per player
  const championTimesMap = new Map<string, number>();
  for (const doc of monthPrizesSnap.docs) {
    const data = doc.data();
    const playerId = data.playerId as string;
    const times = (data.championTimes as number) || 0;
    championTimesMap.set(playerId, (championTimesMap.get(playerId) || 0) + times);
  }

  // Build set of team-of-year player names
  const selectionNames = new Set<string>([
    ...teamOfTheYear.atackers,
    ...teamOfTheYear.midfielders,
    ...teamOfTheYear.defenders,
    ...teamOfTheYear.goalkeepers,
  ]);

  // Get all players to resolve names to IDs
  const allPlayers = await getPlayers(futId);
  const playerNameToId = new Map(allPlayers.map(p => [p.name, p.id]));

  // Collect all unique player IDs that should appear in yearPrizes
  const allPlayerIds = new Set<string>();
  // From monthPrizes
  for (const doc of monthPrizesSnap.docs) {
    allPlayerIds.add(doc.data().playerId as string);
  }
  // From awards
  Object.values(awards).forEach(a => { if (a.playerId) allPlayerIds.add(a.playerId); });
  // From team selection
  selectionNames.forEach(name => {
    const id = playerNameToId.get(name);
    if (id) allPlayerIds.add(id);
  });

  const playerIdToName = new Map(allPlayers.map(p => [p.id, p.name]));
  const yearTimestamp = Timestamp.fromDate(new Date(year, 0, 1));

  // Build players map
  const playersMap: Record<string, unknown> = {};
  for (const playerId of allPlayerIds) {
    const playerName = playerIdToName.get(playerId) || '';
    playersMap[playerId] = {
      year: yearTimestamp,
      championOfTheWeek: championTimesMap.get(playerId) || 0,
      yearChampion: awards.mvp.playerId === playerId,
      yearTopPointer: awards.topPointer.playerId === playerId,
      yearStriker: awards.scorer.playerId === playerId,
      yearBestAssist: awards.assists.playerId === playerId,
      yearBestDefender: awards.bestDefender.playerId === playerId,
      yearLVP: awards.lvp.playerId === playerId,
      yearBestOfPosition: selectionNames.has(playerName),
    };
  }

  await docRef.set({
    year,
    finalizedAt: Timestamp.now(),
    finalizedBy: adminUid,
    players: playersMap,
  });
}

// ============================================================
// AUDIT LOGS
// ============================================================

export interface AuditLogData {
  id: string;
  action: string;
  userId: string;
  userName: string;
  targetType: 'player' | 'week' | 'match' | 'team' | 'member' | 'stats';
  targetId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export async function createAuditLog(
  futId: string,
  log: Omit<AuditLogData, 'id' | 'createdAt'>
): Promise<void> {
  const id = generateId();
  const ref = db.collection('futs').doc(futId).collection('logs').doc(id);
  await ref.set({
    ...log,
    createdAt: Timestamp.fromDate(new Date()),
  });
}

export async function getAuditLogs(futId: string, limit = 100): Promise<AuditLogData[]> {
  const snap = await db.collection('futs').doc(futId)
    .collection('logs')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      action: data.action,
      userId: data.userId,
      userName: data.userName,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details || {},
      createdAt: toDate(data.createdAt),
    };
  });
}
