import { AuditLog } from '@/types/auditLog';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getAuditLogs(futId: string, limit = 100): Promise<AuditLog[]> {
  return new QueryRequest<AuditLog[]>().get(`futs/${futId}/logs?limit=${limit}`);
}
