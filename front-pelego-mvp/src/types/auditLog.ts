export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  targetType: 'player' | 'week' | 'match' | 'team' | 'member' | 'stats';
  targetId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
