import { Prisma } from "@prisma/client";

// Type for Week with full nested relations (same as get_weeks_by_date)
export type WeekWithRelations = Prisma.WeekGetPayload<{
  include: {
    teams: {
      include: {
        players: {
          include: {
            player: true;
          };
        };
        matchesHome: {
          include: {
            result: true;
            goals: {
              include: {
                player: true;
                ownGoalPlayer: true;
              };
            };
            assists: {
              include: {
                player: true;
              };
            };
          };
        };
        matchesAway: {
          include: {
            result: true;
            goals: {
              include: {
                player: true;
                ownGoalPlayer: true;
              };
            };
            assists: {
              include: {
                player: true;
              };
            };
          };
        };
      };
    };
  };
}>;

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
