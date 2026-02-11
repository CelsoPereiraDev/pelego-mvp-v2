import { MonthResumeProps } from '@/types/stats';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getMonthResume(
  year: string,
  month?: string,
  excludePlayerIds: string[] = []
) {
  const path = month
    ? `stats/month-resume/${year}/${month}`
    : `stats/month-resume/${year}`;

  const queryParams = excludePlayerIds.length > 0
    ? `?excludePlayerIds=${excludePlayerIds.join(',')}`
    : '';

  return new QueryRequest<MonthResumeProps>().get(`${path}${queryParams}`);
}
