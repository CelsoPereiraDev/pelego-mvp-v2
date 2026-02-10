import { TeamMember } from "./match";
import { Player } from "./player";

export interface Team {
    players: Player[];
    overall: number;
    id: number; 
}

export interface TeamPlayerResponse {
  id: string;
  name: string;
  isChampion: boolean;
}



export interface WeekTeamResponse {
  id: string;
  weekId: string;
  champion: boolean;
  points: number;
  players: TeamMember[];
}

export interface UpdateTeamRequest {
  id: string;
  champion: boolean;
  players: {
    id: string;
    isChampion: boolean;
  }[];
}
