'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFut } from '@/contexts/FutContext';
import { QueryRequest } from '@/utils/QueryRequest';
import { MemberData } from '@/types/member';

export function useLinkedPlayerId() {
  const { user } = useAuth();
  const { futId } = useFut();
  const [linkedPlayerId, setLinkedPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !futId) {
      setLinkedPlayerId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    new QueryRequest<MemberData[]>()
      .get(`futs/${futId}/members`)
      .then((members) => {
        const me = members.find((m) => m.userId === user.uid);
        setLinkedPlayerId(me?.linkedPlayerId ?? null);
      })
      .catch(() => {
        setLinkedPlayerId(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, futId]);

  return { linkedPlayerId, loading };
}
