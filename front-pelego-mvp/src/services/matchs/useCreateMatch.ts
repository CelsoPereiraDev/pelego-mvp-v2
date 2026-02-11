import { CreateMatchDataRequested } from '@/types/match';
import { useFut } from '@/contexts/FutContext';
import { createMatches } from './resources';

export function useCreateMatches() {
  const { futId } = useFut();

  const createNewMatches = async (matchesData: { matches: CreateMatchDataRequested[] }) => {
    if (!futId) throw new Error('No fut selected');
    const createdMatches = await createMatches(futId, matchesData);
    return createdMatches;
  };

  return {
    createNewMatches,
  };
}
