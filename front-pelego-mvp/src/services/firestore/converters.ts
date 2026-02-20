import { Player, PlayerOverall, PlayerPosition, PlayerResponse } from '@/types/player';
import { WeekResponse } from '@/types/weeks';
import {
  AssistResponse,
  GoalResponse,
  MatchResponse,
  MatchResultResponse,
  TeamMember,
  TeamResponse,
} from '@/types/match';
import { DocumentData, Timestamp } from 'firebase/firestore';

// ─── Helpers ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toISOString(val: any): string {
  return toDate(val).toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOverall(overall: any): PlayerOverall {
  if (typeof overall === 'string') {
    try {
      return JSON.parse(overall);
    } catch {
      return { pace: 0, shooting: 0, passing: 0, dribble: 0, defense: 0, physics: 0, overall: 0 };
    }
  }
  return (
    overall || { pace: 0, shooting: 0, passing: 0, dribble: 0, defense: 0, physics: 0, overall: 0 }
  );
}

// ─── Player Converters ──────────────────────────────────────────

export function firestorePlayerToResponse(data: DocumentData, id: string): Player {
  return {
    id,
    name: data.name || '',
    overall: parseOverall(data.overall),
    country: data.country || undefined,
    image: data.image || undefined,
    team: data.team || undefined,
    position: (data.position || 'MEI') as PlayerPosition,
    isChampion: data.isChampion || false,
    email: data.email || undefined,
    monthChampion: data.monthChampion || false,
    monthTopPointer: data.monthTopPointer || false,
    monthStriker: data.monthStriker || false,
    monthBestAssist: data.monthBestAssist || data.monthTopAssist || false,
    monthBestDefender: data.monthBestDefender || false,
    monthLVP: data.monthLVP || false,
    monthBestOfPosition: data.monthBestOfPosition || false,
  };
}

// Keep backward-compatible alias for code that expects PlayerResponse
export function firestorePlayerToPlayerResponse(data: DocumentData, id: string): PlayerResponse {
  return {
    id,
    name: data.name || '',
    overall: parseOverall(data.overall),
    country: data.country || undefined,
    image: data.image || undefined,
    position: (data.position || 'MEI') as PlayerPosition,
    isChampion: data.isChampion || false,
    email: data.email || undefined,
  };
}

// ─── Week Converters ────────────────────────────────────────────

/**
 * Builds a full WeekResponse from Firestore subcollection data.
 * This requires pre-fetched teams, matches, and players.
 */
export function buildWeekResponse(
  weekId: string,
  weekData: DocumentData,
  teamsData: Array<{ id: string; data: DocumentData }>,
  matchesData: Array<{ id: string; data: DocumentData }>,
  playersMap: Map<string, PlayerResponse>,
): WeekResponse {
  const teams: TeamResponse[] = teamsData.map((teamDoc) => {
    const td = teamDoc.data;
    const playerIds: string[] = td.playerIds || [];

    const players: TeamMember[] = playerIds.map((pid) => ({
      id: `${teamDoc.id}_${pid}`,
      playerId: pid,
      teamId: teamDoc.id,
      player: playersMap.get(pid) || {
        id: pid,
        name: 'Unknown',
        position: 'MEI' as PlayerPosition,
        overall: {
          pace: 0,
          shooting: 0,
          passing: 0,
          dribble: 0,
          defense: 0,
          physics: 0,
          overall: 0,
        },
        isChampion: false,
      },
    }));

    // Build matches for this team
    const matchesHome: MatchResponse[] = [];
    const matchesAway: MatchResponse[] = [];

    for (const matchDoc of matchesData) {
      const md = matchDoc.data;
      const match = buildMatchResponse(matchDoc.id, md, playersMap);

      if (md.homeTeamId === teamDoc.id) matchesHome.push(match);
      if (md.awayTeamId === teamDoc.id) matchesAway.push(match);
    }

    return {
      id: teamDoc.id,
      weekId,
      champion: td.champion || false,
      points: td.points || 0,
      players,
      matchesHome,
      matchesAway,
    };
  });

  return {
    id: weekId,
    date: toDate(weekData.date),
    teams,
  };
}

function buildMatchResponse(
  matchId: string,
  md: DocumentData,
  playersMap: Map<string, PlayerResponse>,
): MatchResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goals: GoalResponse[] = (md.goals || []).map((g: any, i: number) => ({
    id: `${matchId}_goal_${i}`,
    matchId,
    playerId: g.playerId || '',
    ownGoalPlayerId: g.ownGoalPlayerId || undefined,
    ownGoalPlayer: g.ownGoalPlayerId ? playersMap.get(g.ownGoalPlayerId) || undefined : undefined,
    match: {} as MatchResponse, // circular ref not needed in practice
    player: g.playerId
      ? playersMap.get(g.playerId) || {
          id: g.playerId,
          name: 'Unknown',
          position: 'MEI' as PlayerPosition,
          overall: {
            pace: 0,
            shooting: 0,
            passing: 0,
            dribble: 0,
            defense: 0,
            physics: 0,
            overall: 0,
          },
          isChampion: false,
        }
      : ({} as PlayerResponse),
    goals: g.goals,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assists: AssistResponse[] = (md.assists || []).map((a: any, i: number) => ({
    id: `${matchId}_assist_${i}`,
    matchId,
    playerId: a.playerId || '',
    player: a.playerId
      ? playersMap.get(a.playerId) || {
          id: a.playerId,
          name: 'Unknown',
          position: 'MEI' as PlayerPosition,
          overall: {
            pace: 0,
            shooting: 0,
            passing: 0,
            dribble: 0,
            defense: 0,
            physics: 0,
            overall: 0,
          },
          isChampion: false,
        }
      : ({} as PlayerResponse),
    assists: a.assists,
  }));

  const result: MatchResultResponse | undefined = md.result
    ? { homeGoals: md.result.homeGoals, awayGoals: md.result.awayGoals }
    : undefined;

  return {
    id: matchId,
    date: toISOString(md.date),
    homeTeamId: md.homeTeamId,
    awayTeamId: md.awayTeamId,
    orderIndex: md.orderIndex ?? undefined,
    result,
    goals,
    assists,
  };
}
