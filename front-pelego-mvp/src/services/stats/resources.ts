import { MonthResumeProps } from '@/types/stats';
import { QueryRequest } from '@/utils/QueryRequest';

const BASE_URL = 'http://localhost:3334/api';
const CLIENT_ID = 'client-id';

export async function getMonthResume(
  year: string,
  month?: string,
  excludePlayerIds: string[] = []
) {
  const queryRequest = new QueryRequest<MonthResumeProps>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();

  // Build path
  const path = month
    ? `stats/month-resume/${year}/${month}`
    : `stats/month-resume/${year}`;

  // Add query params if there are excluded players
  const queryParams = excludePlayerIds.length > 0
    ? `?excludePlayerIds=${excludePlayerIds.join(',')}`
    : '';

  return queryRequest.get(`${path}${queryParams}`);
}
