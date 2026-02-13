import { MatchResponse, TeamResponse } from './match';

import { PlayerResponse } from './player';

export interface WeekResponse {
  id: string;
  date: Date;
  teams: TeamResponse[];
}
export interface TeamMemberResponse {
  id: string;
  player: PlayerResponse;
}

export interface Week {
  id: string;
  date: Date;
  teams: {
    id: string;
    players: {
      player: PlayerResponse;
    }[];
    matchesHome: MatchResponse[];
    matchesAway: MatchResponse[];
  }[];
}
