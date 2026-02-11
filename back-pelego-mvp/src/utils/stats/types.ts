import { WeekData } from '../../lib/firestore';

// Re-export WeekData as WeekWithRelations for backward compatibility with stat utils
export type WeekWithRelations = WeekData;

// Minimal player interface for stat calculations (replaces @prisma/client Player)
export interface PlayerInfo {
  id: string;
  name: string;
  position: string;
}

export interface PlayerResumeData {
  name: string;
  count: number;
}

export interface MonthResumeProps {
  assists: PlayerResumeData[];
  scorer: PlayerResumeData[];
  mvp: PlayerResumeData[];
  lvp: PlayerResumeData[];
  bestDefender: PlayerResumeData[];
  topPointer: PlayerResumeData[];
}

export interface SimpleAssistStats {
  name: string;
  assists: number;
  matchesPlayed: number;
}

export interface PlayerStatsSummary {
  playerName: string;
  position: string;
  weeksPlayed: number;
  goalsConceded: number;
  matches: number;
  averageGoalsConceded: number;
  averageGoalsConcededPerWeek: number;
}

export interface SimplePlayerStats {
  name: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  pointsPercentage: number;
  weeksParticipated: number;
}
