import { MemberData } from '@/types/member';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getMembers(futId: string) {
  return new QueryRequest<MemberData[]>().get(`futs/${futId}/members`);
}

export async function updateMemberRole(futId: string, userId: string, role: 'admin' | 'user' | 'viewer') {
  return new QueryRequest<{ message: string }, { role: string }>().patch(`futs/${futId}/members/${userId}`, { role });
}

export async function removeMember(futId: string, userId: string) {
  return new QueryRequest<{ message: string }>().delete(`futs/${futId}/members/${userId}`);
}

export async function linkPlayerToMember(futId: string, userId: string, playerId: string) {
  return new QueryRequest<{ message: string }, { playerId: string }>().post(
    `futs/${futId}/members/${userId}/link-player`,
    { playerId }
  );
}

export async function updateFut(futId: string, data: { name?: string; description?: string }) {
  return new QueryRequest<any, typeof data>().patch(`futs/${futId}`, data);
}
