import { MonthResumeProps } from '@/types/stats';
import { useFut } from '@/contexts/FutContext';
import useSWR from 'swr';
import { getMonthResume } from './resources';

export function useMonthResume(
  year: string,
  month?: string,
  excludePlayerIds: string[] = [],
  initialData?: MonthResumeProps
) {
  const { futId } = useFut();

  const cacheKey = futId
    ? (month
      ? `/api/futs/${futId}/stats/month-resume/${year}/${month}?exclude=${excludePlayerIds.join(',')}`
      : `/api/futs/${futId}/stats/month-resume/${year}?exclude=${excludePlayerIds.join(',')}`)
    : null;

  const { data, error, isLoading } = useSWR(
    cacheKey,
    () => getMonthResume(futId!, year, month, excludePlayerIds),
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
