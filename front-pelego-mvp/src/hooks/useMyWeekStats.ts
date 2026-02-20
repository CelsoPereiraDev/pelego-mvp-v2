'use client';

import { useMemo } from 'react';
import { WeekResponse } from '@/types/weeks';
import { TeamResponse, MatchResponse } from '@/types/match';
import { PlayerResponse } from '@/types/player';

export interface MyWeekStats {
  myTeam: TeamResponse | null;
  teamNumber: number;
  isChampion: boolean;
  isTopScorer: boolean;
  isTopAssist: boolean;
  goals: number;
  assists: number;
  ownGoals: number;
  goalsConceded: number;
  avgGoalsConcededPerMatch: number;
  groupAvgGoalsConceded: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  myPlayer: PlayerResponse | null;
  hasData: boolean;
}

export function useMyWeekStats(week: WeekResponse | null, myPlayerId: string | null): MyWeekStats {
  return useMemo(() => {
    const empty: MyWeekStats = {
      myTeam: null,
      teamNumber: 0,
      isChampion: false,
      isTopScorer: false,
      isTopAssist: false,
      goals: 0,
      assists: 0,
      ownGoals: 0,
      goalsConceded: 0,
      avgGoalsConcededPerMatch: 0,
      groupAvgGoalsConceded: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      myPlayer: null,
      hasData: false,
    };

    if (!week || !myPlayerId) return empty;

    // Find my team
    const myTeamIndex = week.teams.findIndex((team) =>
      team.players.some((m) => m.playerId === myPlayerId),
    );

    if (myTeamIndex === -1) return empty;

    const myTeam = week.teams[myTeamIndex];
    const myPlayer = myTeam.players.find((m) => m.playerId === myPlayerId)?.player ?? null;

    // Deduplicate matches across all teams
    const matchMap = new Map<string, MatchResponse>();
    for (const team of week.teams) {
      for (const match of [...team.matchesHome, ...team.matchesAway]) {
        if (!matchMap.has(match.id)) matchMap.set(match.id, match);
      }
    }
    const allMatches = [...matchMap.values()];

    // My matches: home or away
    const myMatches = allMatches.filter(
      (m) => m.homeTeamId === myTeam.id || m.awayTeamId === myTeam.id,
    );

    // Goals, assists, own goals for me
    let goals = 0;
    let assists = 0;
    let ownGoals = 0;
    let goalsConceded = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let points = 0;

    for (const match of myMatches) {
      // Goals scored by me
      for (const goal of match.goals) {
        if (goal.playerId === myPlayerId) goals += goal.goals;
        if (goal.ownGoalPlayerId === myPlayerId) ownGoals += goal.goals;
      }

      // Assists by me
      for (const assist of match.assists) {
        if (assist.playerId === myPlayerId) assists += assist.assists;
      }

      // Goals conceded by my team (lógica do allPlayersStatsMapper)
      if (match.result) {
        const myGoals =
          match.homeTeamId === myTeam.id ? match.result.homeGoals : match.result.awayGoals;
        const opponentGoals =
          match.homeTeamId === myTeam.id ? match.result.awayGoals : match.result.homeGoals;

        goalsConceded += opponentGoals;

        if (myGoals > opponentGoals) {
          wins++;
          points += 3;
        } else if (myGoals === opponentGoals) {
          draws++;
          points += 1;
        } else {
          losses++;
        }
      }
    }

    const matchCount = myMatches.length;
    const avgGoalsConcededPerMatch = matchCount > 0 ? goalsConceded / matchCount : 0;

    // --- Week top scorers and assists (across all players) ---
    const playerGoals = new Map<string, number>();
    const playerAssists = new Map<string, number>();

    for (const match of allMatches) {
      for (const goal of match.goals) {
        if (goal.playerId) {
          playerGoals.set(goal.playerId, (playerGoals.get(goal.playerId) ?? 0) + goal.goals);
        }
      }
      for (const assist of match.assists) {
        if (assist.playerId) {
          playerAssists.set(
            assist.playerId,
            (playerAssists.get(assist.playerId) ?? 0) + assist.assists,
          );
        }
      }
    }

    const maxGoals = playerGoals.size > 0 ? Math.max(...playerGoals.values()) : 0;
    const maxAssists = playerAssists.size > 0 ? Math.max(...playerAssists.values()) : 0;

    const isTopScorer = maxGoals > 0 && (playerGoals.get(myPlayerId) ?? 0) === maxGoals;
    const isTopAssist = maxAssists > 0 && (playerAssists.get(myPlayerId) ?? 0) === maxAssists;

    // --- Group avg goals conceded ---
    // For each player in the week, calculate their goals conceded per match
    const playerGoalsConceded = new Map<string, { total: number; matches: number }>();

    for (const team of week.teams) {
      const teamPlayerIds = new Set(team.players.map((m) => m.playerId));
      const teamMatches = allMatches.filter(
        (m) => m.homeTeamId === team.id || m.awayTeamId === team.id,
      );

      for (const match of teamMatches) {
        const conceded = match.result
          ? match.homeTeamId === team.id
            ? match.result.awayGoals
            : match.result.homeGoals
          : 0;

        for (const pid of teamPlayerIds) {
          const current = playerGoalsConceded.get(pid) ?? { total: 0, matches: 0 };
          playerGoalsConceded.set(pid, {
            total: current.total + conceded,
            matches: current.matches + 1,
          });
        }
      }
    }

    const avgPerPlayer = [...playerGoalsConceded.values()].map(({ total, matches }) =>
      matches > 0 ? total / matches : 0,
    );

    const groupAvgGoalsConceded =
      avgPerPlayer.length > 0
        ? avgPerPlayer.reduce((sum, v) => sum + v, 0) / avgPerPlayer.length
        : 0;

    return {
      myTeam,
      teamNumber: myTeamIndex + 1,
      isChampion: myTeam.champion,
      isTopScorer,
      isTopAssist,
      goals,
      assists,
      ownGoals,
      goalsConceded,
      avgGoalsConcededPerMatch,
      groupAvgGoalsConceded,
      wins,
      draws,
      losses,
      points,
      myPlayer,
      hasData: true,
    };
  }, [week, myPlayerId]);
}
