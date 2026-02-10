import { GoalDetails } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334/api';
const ORGANIZATION_ID = 'your-organization-id';

export async function createGoals(goalsData: GoalDetails[]) {
  const queryRequest = new QueryRequest<GoalDetails[], GoalDetails[]>(BASE_URL, ORGANIZATION_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.post('create_goals', goalsData);
}
