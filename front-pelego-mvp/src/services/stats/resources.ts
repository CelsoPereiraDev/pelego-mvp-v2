import { MonthResumeProps } from '@/types/stats';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getMonthResume(
  futId: string,
  year: string,
  month?: string,
  excludePlayerIds: string[] = [],
) {
  const path = month
    ? `futs/${futId}/stats/month-resume/${year}/${month}`
    : `futs/${futId}/stats/month-resume/${year}`;

  const queryParams =
    excludePlayerIds.length > 0 ? `?excludePlayerIds=${excludePlayerIds.join(',')}` : '';

  return new QueryRequest<MonthResumeProps>().get(`${path}${queryParams}`);
}

export interface FinalizeMonthPayload {
  awards: {
    mvp: { playerId: string; playerName: string };
    topPointer: { playerId: string; playerName: string };
    scorer: { playerId: string; playerName: string };
    assists: { playerId: string; playerName: string };
    bestDefender: { playerId: string; playerName: string };
    lvp: { playerId: string; playerName: string };
  };
  teamOfTheMonth: {
    atackers: string[];
    midfielders: string[];
    defenders: string[];
    goalkeepers: string[];
  };
}

export async function finalizeMonth(futId: string, year: string, month: string, payload: FinalizeMonthPayload) {
  return new QueryRequest<{ message: string }, FinalizeMonthPayload>().post(
    `futs/${futId}/finalize-month/${year}/${month}`,
    payload,
  );
}

export async function isMonthFinalized(futId: string, year: string, month: string) {
  return new QueryRequest<{ finalized: boolean }>().get(
    `futs/${futId}/is-month-finalized/${year}/${month}`,
  );
}

export interface FinalizeYearPayload {
  awards: FinalizeMonthPayload['awards'];
  teamOfTheYear: {
    atackers: string[];
    midfielders: string[];
    defenders: string[];
    goalkeepers: string[];
  };
}

export async function finalizeYear(futId: string, year: string, payload: FinalizeYearPayload) {
  return new QueryRequest<{ message: string }, FinalizeYearPayload>().post(
    `futs/${futId}/finalize-year/${year}`,
    payload,
  );
}

export async function isYearFinalized(futId: string, year: string) {
  return new QueryRequest<{ finalized: boolean }>().get(
    `futs/${futId}/is-year-finalized/${year}`,
  );
}
