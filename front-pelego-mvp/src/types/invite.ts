export interface InviteData {
  token: string;
  futId: string;
  futName: string;
  role: 'user' | 'viewer';
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}
