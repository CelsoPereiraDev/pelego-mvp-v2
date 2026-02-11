import { MonthResumeProps } from '@/types/stats';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getMonthResume(
  futId: string,
  year: string,
  month?: string,
  excludePlayerIds: string[] = []
) {
  const path = month
    ? `futs/${futId}/stats/month-resume/${year}/${month}`
    : `futs/${futId}/stats/month-resume/${year}`;

  const queryParams = excludePlayerIds.length > 0
    ? `?excludePlayerIds=${excludePlayerIds.join(',')}`
    : '';

  return new QueryRequest<MonthResumeProps>().get(`${path}${queryParams}`);
}
