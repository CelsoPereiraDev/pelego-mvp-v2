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
  };
}

export async function getUserFuts(userId: string): Promise<FutData[]> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return [];
  const userData = userDoc.data()!;
  const futIds = Object.keys(userData.futs || {});

  if (futIds.length === 0) return [];

  const futs: FutData[] = [];
  for (const futId of futIds) {
    const fut = await getFut(futId);
    if (fut) futs.push(fut);
  }
  return futs;
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
}

export async function createInvite(
  futId: string,
  futName: string,
  role: 'user' | 'viewer',
  createdBy: string,
  expiresAt?: Date,
  maxUses?: number
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
    .collection('monthPrizes').where('players', 'array-contains', playerId).get();

  // Get year prizes
  const yearPrizesSnap = await db.collection('futs').doc(futId)
    .collection('yearPrizes').get();

  return {
    ...player,
    monthIndividualPrizes: monthPrizesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    yearIndividualPrizes: yearPrizesSnap.docs
      .filter(d => d.data().players?.[playerId])
      .map(d => ({ id: d.id, ...d.data().players[playerId] })),
  };
}

export async function createPlayer(futId: string, playerData: Omit<PlayerData, 'id'>): Promise<PlayerData> {
  const id = generateId();
  const ref = db.collection('futs').doc(futId).collection('players').doc(id);

  const dataToStore = {
    ...playerData,
    overall: typeof playerData.overall === 'string' ? playerData.overall : JSON.stringify(playerData.overall),
    isChampion: playerData.isChampion ?? false,
    monthChampion: playerData.monthChampion ?? false,
    monthStriker: playerData.monthStriker ?? false,
    monthBestDefender: playerData.monthBestDefender ?? false,
    monthTopPointer: playerData.monthTopPointer ?? false,
    monthTopAssist: playerData.monthTopAssist ?? false,
    monthLVP: playerData.monthLVP ?? false,
    monthBestOfPosition: playerData.monthBestOfPosition ?? false,
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
async function getWeekWithRelations(futId: string, weekId: string): Promise<WeekData | null> {
  const weekRef = db.collection('futs').doc(futId).collection('weeks').doc(weekId);
  const weekDoc = await weekRef.get();
  if (!weekDoc.exists) return null;

  const weekData = weekDoc.data()!;

  // Get all players for this fut (cache for lookups)
  const allPlayers = await getPlayers(futId);
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));

  // Get teams
  const teamsSnap = await weekRef.collection('teams').get();
  const teams: TeamData[] = [];

  for (const teamDoc of teamsSnap.docs) {
    const teamData = teamDoc.data();

    // Build player references
    const playerIds: string[] = teamData.playerIds || [];
    const teamMembers: TeamMemberData[] = playerIds.map((pid: string) => ({
      id: `${teamDoc.id}_${pid}`,
      playerId: pid,
      teamId: teamDoc.id,
      player: playerMap.get(pid) || { id: pid, name: 'Unknown', position: '', overall: {}, isChampion: false, monthChampion: false, monthStriker: false, monthBestDefender: false, monthTopPointer: false, monthTopAssist: false, monthLVP: false },
    }));

    // Get matches for this team
    const matchesSnap = await weekRef.collection('matches').get();
    const matchesHome: MatchData[] = [];
    const matchesAway: MatchData[] = [];

    for (const matchDoc of matchesSnap.docs) {
      const matchData = matchDoc.data();
      const match: MatchData = {
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
          player: g.playerId ? playerMap.get(g.playerId) || null : null,
          ownGoalPlayer: g.ownGoalPlayerId ? playerMap.get(g.ownGoalPlayerId) || null : null,
        })),
        assists: (matchData.assists || []).map((a: any, i: number) => ({
          id: `${matchDoc.id}_assist_${i}`,
          matchId: matchDoc.id,
          playerId: a.playerId,
          assists: a.assists,
          player: a.playerId ? playerMap.get(a.playerId) || null : null,
        })),
      };

      if (match.homeTeamId === teamDoc.id) matchesHome.push(match);
      if (match.awayTeamId === teamDoc.id) matchesAway.push(match);
    }

    teams.push({
      id: teamDoc.id,
      weekId: weekId,
      champion: teamData.champion || false,
      points: teamData.points || 0,
      players: teamMembers,
      matchesHome,
      matchesAway,
    });
  }

  return {
    id: weekId,
    date: toDate(weekData.date),
    teams,
  };
}

export async function getWeeks(futId: string): Promise<WeekData[]> {
  const weeksSnap = await db.collection('futs').doc(futId).collection('weeks')
    .orderBy('date', 'desc').get();

  const weeks: WeekData[] = [];
  for (const weekDoc of weeksSnap.docs) {
    const week = await getWeekWithRelations(futId, weekDoc.id);
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

  const weeksSnap = await db.collection('futs').doc(futId).collection('weeks')
    .where('date', '>=', Timestamp.fromDate(startDate))
    .where('date', '<=', Timestamp.fromDate(endDate))
    .orderBy('date', 'desc')
    .get();

  const weeks: WeekData[] = [];
  for (const weekDoc of weeksSnap.docs) {
    const week = await getWeekWithRelations(futId, weekDoc.id);
    if (week) weeks.push(week);
  }
  return weeks;
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
    await futRef.collection('weeks').doc(weekId).set({
      date: Timestamp.fromDate(new Date(date)),
    });

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

    // Update month prizes
    const monthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);
    const monthKey = `${weekDate.getFullYear()}_${String(weekDate.getMonth() + 1).padStart(2, '0')}`;

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
        await prizeRef.update({
          championTimes: FieldValue.increment(1),
          championDates: FieldValue.arrayUnion(Timestamp.fromDate(new Date(date))),
        });
      }
    }
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

  // Get existing teams
  const existingTeamsSnap = await weekRef.collection('teams').get();
  if (teams.length !== existingTeamsSnap.size) {
    throw new Error(`Esperado ${existingTeamsSnap.size} times, recebido ${teams.length}. Não é permitido adicionar ou remover times.`);
  }

  const existingTeamIds = existingTeamsSnap.docs.map(d => d.id);
  const weekDate = new Date(date);

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

    // Update month prizes
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
        // Remove old date for this week date range, then add new
        const existingDates: Timestamp[] = prizeDoc.data()!.championDates || [];
        const filteredDates = existingDates.filter(d => {
          const dt = d.toDate();
          return dt < new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate()) ||
                 dt > new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate() + 1);
        });
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
        const newTimes = Math.max(0, (data.championTimes || 1) - 1);

        if (newTimes === 0) {
          await prizeRef.delete();
        } else {
          // Remove the champion date for this week
          const existingDates: Timestamp[] = data.championDates || [];
          const filtered = existingDates.filter(d => {
            const dt = d.toDate();
            return dt.getTime() !== weekDate.getTime();
          });
          await prizeRef.update({
            championTimes: newTimes,
            championDates: filtered,
          });
        }
      }
    }
  }

  // Check if players are champions in other weeks and reset if not
  const uniquePlayerIds = [...new Set(allPlayerIds)];
  for (const pid of uniquePlayerIds) {
    // Check other weeks for championship
    const otherWeeksSnap = await futRef.collection('weeks').get();
    let stillChampion = false;

    for (const otherWeekDoc of otherWeeksSnap.docs) {
      if (otherWeekDoc.id === weekId) continue;
      const otherTeamsSnap = await otherWeekDoc.ref.collection('teams')
        .where('champion', '==', true).get();
      for (const otherTeamDoc of otherTeamsSnap.docs) {
        const otherTeamData = otherTeamDoc.data();
        if ((otherTeamData.playerIds || []).includes(pid)) {
          stillChampion = true;
          break;
        }
      }
      if (stillChampion) break;
    }

    if (!stillChampion) {
      await futRef.collection('players').doc(pid).update({ isChampion: false });
    }
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
  // Reset all player isChampion to false
  const playersSnap = await db.collection('futs').doc(futId).collection('players').get();
  const resetBatch = db.batch();
  playersSnap.docs.forEach(doc => {
    resetBatch.update(doc.ref, { isChampion: false });
  });
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

    for (const player of team.players) {
      if (player.isChampion) {
        const prizeRef = db.collection('futs').doc(futId).collection('monthPrizes').doc(`${monthKey}_${player.id}`);
        const prizeDoc = await prizeRef.get();

        if (!prizeDoc.exists) {
          await prizeRef.set({
            playerId: player.id,
            date: Timestamp.fromDate(monthStart),
            championTimes: 1,
            championDates: [Timestamp.fromDate(currentDate)],
          });
        } else {
          await prizeRef.update({
            championTimes: FieldValue.increment(1),
            championDates: FieldValue.arrayUnion(Timestamp.fromDate(currentDate)),
          });
        }
      }
    }
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
