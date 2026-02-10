
import { CreateWeekWithTeamsBody } from '@/types/match';
import useSWR from 'swr';
import { createWeekWithTeams } from './resources';

export function useCreateWeekWithTeams() {
  const { data, error, mutate } = useSWR('/api/create_week_with_teams', () => null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const createWeek = async (weekData: CreateWeekWithTeamsBody) => {
    const createdWeek = await createWeekWithTeams(weekData.date, weekData.teams);
    mutate();
    return createdWeek;
  };

  return {
    createWeek,
    data,
    error,
    isLoading: !error && !data,
  };
}
