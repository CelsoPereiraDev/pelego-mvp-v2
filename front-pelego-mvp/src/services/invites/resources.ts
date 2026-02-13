import { InviteData } from '@/types/invite';
import { QueryRequest } from '@/utils/QueryRequest';

export async function createInvite(
  futId: string,
  data: { role: 'user' | 'viewer'; expiresInDays?: number; maxUses?: number },
) {
  return new QueryRequest<InviteData, typeof data>().post(`futs/${futId}/invites`, data);
}

export async function getInvites(futId: string) {
  return new QueryRequest<InviteData[]>().get(`futs/${futId}/invites`);
}

export async function revokeInvite(futId: string, token: string) {
  return new QueryRequest<{ message: string }>().delete(`futs/${futId}/invites/${token}`);
}

export async function getInviteInfo(token: string) {
  return new QueryRequest<InviteData>().get(`invite/${token}`);
}

export async function acceptInvite(token: string) {
  return new QueryRequest<{ futId: string; role: string }, Record<string, never>>().post(
    `invite/${token}/accept`,
    {},
  );
}
