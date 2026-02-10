import { MonthResumeProps } from '@/types/stats';
import useSWR from 'swr';
import { getMonthResume } from './resources';

export function useMonthResume(
  year: string,
  month?: string,
  excludePlayerIds: string[] = [],
  initialData?: MonthResumeProps
) {
  // Create a unique cache key that includes all parameters
  const cacheKey = month
    ? `/api/stats/month-resume/${year}/${month}?exclude=${excludePlayerIds.join(',')}`
    : `/api/stats/month-resume/${year}?exclude=${excludePlayerIds.join(',')}`;

  const { data, error, isLoading } = useSWR(
    cacheKey,
    () => getMonthResume(year, month, excludePlayerIds),
    {
      fallbackData: initialData,
    }
  );

  return {
    monthResume: data,
    isLoading,
    error,
  };
}
