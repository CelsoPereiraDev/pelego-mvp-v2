import { Player, PlayerGoals } from "./player";
import { Team } from "./team";

export interface MonthGoals {
    monthName: string,
    players: PlayerGoals[],
}

export interface MonthStats {
    monthName: string,
    matches: string,
    totalGoals: string,
    goalAverage: string,
    playerOfTheMonth: Player[],
}

export interface TeamMatch {
    name: string,
    goals:string,
    team: Team,
    scores: string[]
}

export interface Match {
    firstTeam: TeamMatch,
    secontTeam: TeamMatch,
}
