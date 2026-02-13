import { PlayerResponse } from '@/types/player';

export interface AssistDetails {
  playerId: string;
  assists: number;
}
export interface AssistResponse {
  id: string;
  matchId: string;
  playerId: string;
  player: PlayerResponse;
  assists: number;
}

export interface MatchResponse {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  result?: MatchResultResponse;
  goals: GoalResponse[];
  assists: AssistResponse[];
  orderIndex?: number;
}

export interface CreateMatchDataRequested {
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: GoalDetails[];
  awayGoals: GoalDetails[];
  homeAssists: AssistDetails[];
  awayAssists: AssistDetails[];
}

export interface GoalDetails {
  playerId: string;
  goals: number;
}

export interface TeamResponse {
  id: string;
  champion: boolean;
  players: TeamMember[];
  matchesHome: MatchResponse[];
  matchesAway: MatchResponse[];
  weekId: string;
}
export interface TeamMember {
  id: string;
  player: PlayerResponse;
  playerId: string;
  teamId: string;
}

export interface CreateWeekWithTeamsBody {
  date: string;
  teams: string[][];
}

export interface MatchResultResponse {
  homeGoals: number;
  awayGoals: number;
}

export interface GoalResponse {
  id: string;
  ownGoalPlayerId?: string;
  ownGoalPlayer?: PlayerResponse;
  matchId: string;
  playerId: string;
  match: MatchResponse;
  player: PlayerResponse;
  goals: number;
}

export type CreateMatch = {
  date: string;
  teams: {
    players: string[];
  }[];
  matches: {
    homeTeamId: string;
    homeGoals: {
      goalsCount: string;
      whoScores: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    homeAssists: {
      assists: number;
      playerId: string;
    }[];
    awayGoals: {
      goalsCount: string;
      whoScores: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    awayAssists: {
      assists: number;
      playerId: string;
    }[];
    awayTeamId: string;
  }[];
};

export interface CreateWeekAndMatchesRequest {
  date: string;
  teams: string[][];
  matches: {
    homeTeamIndex: number;
    awayTeamIndex: number;
    homeGoals: {
      playerId?: string;
      ownGoalPlayerId?: string;
      goals: number;
    }[];
    awayGoals: {
      playerId?: string;
      ownGoalPlayerId?: string;
      goals: number;
    }[];
    homeAssists: {
      playerId: string;
      assists: number;
    }[];
    awayAssists: {
      playerId: string;
      assists: number;
    }[];
  }[];
}

export interface CreateWeekAndMatchesResponse {
  message: string;
  week: {
    id: string;
    date: string;
  };
  teams: {
    id: string;
    points: number;
    champion: boolean;
    players: string[];
  }[];
  matches: {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    result: MatchResultResponse;
  }[];
  championTeamId: string | null;
}
