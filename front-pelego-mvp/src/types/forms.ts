// Shared form types for match creation flow

export interface CreateMatchForm {
  date: string;
  teams: {
    players: string[];
  }[];
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: {
      goalsCount: string;
      whoScores?: {
        goals?: number;
        playerId?: string;
        ownGoalPlayerId?: string;
      }[];
    };
    homeAssists?: {
      assists: number;
      playerId: string;
    }[];
    awayGoals: {
      goalsCount: string;
      whoScores?: {
        goals?: number;
        playerId?: string;
        ownGoalPlayerId?: string;
      }[];
    };
    awayAssists?: {
      assists: number;
      playerId: string;
    }[];
  }[];
}
