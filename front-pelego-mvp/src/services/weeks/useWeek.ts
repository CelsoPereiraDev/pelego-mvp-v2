import { WeekResponse } from '@/types/weeks';
import useSWR, { useSWRConfig } from 'swr';
import { deleteWeek, getWeekById } from './resources';

export function useWeek(weekId: string) {
  const { data, error } = useSWR<WeekResponse>(weekId ? `/api/get_week/${weekId}` : null, () => getWeekById(weekId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const { mutate } = useSWRConfig();

  const methodsHandler = {
    delete: async function _delete() {
      await deleteWeek(weekId);
      mutate(`/api/get_weeks`);
    },
  };

  return {
    week: data,
    mutate,
    isError: error,
    isLoading: !error && !data,
    delete: methodsHandler.delete,
  };
}
