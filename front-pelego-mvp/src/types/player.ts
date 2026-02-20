import { playerGetOverallSchema } from '@/schema/player';
import { z } from 'zod';

export enum PlayerPosition {
  MEI = 'MEI',
  ATK = 'ATK',
  DEF = 'DEF',
  GOL = 'GOL',
}

export interface PlayerOverall {
  pace: number;
  shooting: number;
  passing: number;
  dribble: number;
  defense: number;
  physics: number;
  overall: number;
}

export interface Player {
  id: string;
  name: string;
  overall: PlayerOverall;
  country?: string;
  value?: string;
  team?: string;
  image?: string;
  position: PlayerPosition;
  isChampion: boolean;
  email?: string;
  monthLVP?: boolean;
  monthTopPointer?: boolean;
  monthStriker?: boolean;
  monthChampion?: boolean;
  monthBestDefender?: boolean;
  monthBestOfPosition?: boolean;
  monthBestAssist?: boolean;
  monthIndividualPrizes?: MonthIndividualPrizes[];
  yearIndividualPrizes?: YearIndividualPrizes[];
}

export interface MonthIndividualPrizes {
  date: Date;
  championOfTheWeek: {
    championTimes: number;
    date: Date[];
  };
  monthBestOfPosition: boolean;
  monthLVP: boolean;
  monthStriker?: boolean;
  monthTopPointer: boolean;
  monthChampion?: boolean;
  monthBestDefender?: boolean;
  monthBestAssist?: boolean;
}

export interface YearIndividualPrizes {
  year: string;
  championOfTheWeek: number;
  yearBestOfPosition: boolean;
  yearLVP: boolean;
  yearStriker?: boolean;
  yearTopPointer: boolean;
  yearChampion?: boolean;
  yearBestDefender?: boolean;
  yearBestAssist?: boolean;
}
export interface PlayerGoals {
  name: string;
  goals: number;
}

export type PlayerGetOverallFormData = z.infer<typeof playerGetOverallSchema>;

export interface PlayerResponse {
  id: string;
  name: string;
  overall: PlayerOverall;
  country?: string;
  image?: string;
  position: PlayerPosition;
  isChampion: boolean;
  goalsCount?: number;
  email?: string;
}

interface IndividualPrize {
  id?: string;
  name: string;
  date?: string;
}

// Enriched monthPrizes from overview endpoint
export interface MonthPrizeRecord {
  id: string;
  playerId: string;
  date: string;
  championTimes: number;
  championWeeks: Array<{ weekId: string; date: string }>;
  isMVP: boolean;
  isTopPointer: boolean;
  isStriker: boolean;
  isBestAssist: boolean;
  isBestDefender: boolean;
  isLVP: boolean;
  isBestOfPosition: boolean;
}

// ============================================================
// Player Overview (from GET /players/:playerId/overview)
// ============================================================

export interface PlayerOverviewInteraction {
  name: string;
  points: number;
  pointsExpected: number;
}

export type NumericOverviewKey =
  | 'matches' | 'wins' | 'losses' | 'draws' | 'points'
  | 'goals' | 'ownGoals' | 'assists' | 'goalsConceded'
  | 'averageGoalsConceded' | 'averagePointsPerMatch' | 'pointsPercentage'
  | 'totalGoalsPerWeek' | 'totalAssistsPerWeek' | 'totalPointsPerWeek'
  | 'totalGoalsConcededPerWeek' | 'averagePointsPerWeek' | 'averageGoalsPerWeek'
  | 'averageAssistsPerWeek' | 'averageGoalsConcededPerWeek';

export interface PlayerOverviewStats {
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
  averageGoalsConceded: number;
  averagePointsPerMatch: number;
  pointsPercentage: number;
  averagePointsPerWeek: number;
  averageGoalsPerWeek: number;
  averageAssistsPerWeek: number;
  averageGoalsConcededPerWeek: number;
  totalWeeks: number;
  rankings: Partial<Record<NumericOverviewKey, number>>;
  top5PointsWithPlayers: PlayerOverviewInteraction[];
  top5WorstPerformingTeammates: PlayerOverviewInteraction[];
  top5PointsAgainstPlayers: PlayerOverviewInteraction[];
  top5PointsGivenByPlayers: PlayerOverviewInteraction[];
}

export interface PlayerOverviewResponse {
  player: {
    id: string;
    name: string;
    position: PlayerPosition;
    country?: string;
    image?: string;
    overall: PlayerOverall;
    isChampion: boolean;
    email?: string;
    isAuthenticated: boolean;
    monthIndividualPrizes: MonthPrizeRecord[];
    yearIndividualPrizes: YearIndividualPrizes[];
  };
  stats: PlayerOverviewStats | null;
  availableYears: number[];
}

export interface CreatePlayerDataRequested {
  name?: string;
  country?: string;
  team?: string;
  image?: string;
  position?: PlayerPosition;
  overall?: PlayerOverall;
  isChampion?: boolean;
  monthIndividualPrizes?: IndividualPrize[];
  yearIndividualPrizes?: IndividualPrize[];
  email?: string;
}
