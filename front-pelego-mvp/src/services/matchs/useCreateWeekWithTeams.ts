import { CreateWeekWithTeamsBody } from '@/types/match';
import { useFut } from '@/contexts/FutContext';
import { createWeekWithTeams } from './resources';

export function useCreateWeekWithTeams() {
  const { futId } = useFut();

  const createWeek = async (weekData: CreateWeekWithTeamsBody) => {
    if (!futId) throw new Error('No fut selected');
    const createdWeek = await createWeekWithTeams(futId, weekData.date, weekData.teams);
    return createdWeek;
  };

  return {
    createWeek,
  };
}
