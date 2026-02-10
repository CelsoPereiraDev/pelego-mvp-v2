import { playerGetOverallSchema } from "@/schema/player";
import { z } from "zod";

export enum PlayerPosition {
  MEI = 'MEI',
  ATK = 'ATK',
  DEF = 'DEF',
  GOL = 'GOL'
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
  monthLVP?: boolean;
  monthTopPointer?: boolean;
  monthStriker?: boolean;
  monthChampion?: boolean;
  monthBestDefender?: boolean;
  monthBestOfPosition?: boolean;
  monthBestAssist?: boolean;
  monthIndividualPrizes?: MonthIndividualPrizes[]
  yearIndividualPrizes?: YearIndividualPrizes[]
}


export interface MonthIndividualPrizes {
  date: Date;
  championOfTheWeek: {
    championTimes: number;
    date: Date[];
  }
  monthBestOfPosition: boolean;
  monthLVP: boolean;
  monthStriker?: boolean;
  monthTopPointer: boolean;
  monthChampion?: boolean;
  monthBestDefender?: boolean;
  monthBestAssist?: boolean;
}

export interface YearIndividualPrizes {
  year: Date;
  championOfTheWeek: number
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
}

interface IndividualPrize {
  id?: string;
  name: string;
  date?: string;
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
}
