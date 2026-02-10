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
