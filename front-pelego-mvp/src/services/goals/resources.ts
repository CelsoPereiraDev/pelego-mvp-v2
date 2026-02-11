import { GoalDetails } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';

export async function createGoals(futId: string, goalsData: GoalDetails[]) {
  return new QueryRequest<GoalDetails[], GoalDetails[]>().post(`futs/${futId}/create_goals`, goalsData);
}
