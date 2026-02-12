export interface MemberData {
  userId: string;
  role: 'admin' | 'user' | 'viewer';
  email?: string;
  displayName?: string;
  linkedPlayerId?: string;
  joinedAt: string;
}
