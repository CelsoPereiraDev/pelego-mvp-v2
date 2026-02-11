import { GoalDetails } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';

export async function createGoals(goalsData: GoalDetails[]) {
  return new QueryRequest<GoalDetails[], GoalDetails[]>().post('create_goals', goalsData);
}
