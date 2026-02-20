'use client';

import { useState, useEffect } from 'react';
import { useFut } from '@/contexts/FutContext';
import { getAuditLogs } from './resources';
import { AuditLog } from '@/types/auditLog';

export function useLogs() {
  const { futId } = useFut();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!futId) return;
    setIsLoading(true);
    getAuditLogs(futId)
      .then(setLogs)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [futId]);

  return { logs, isLoading, error };
}
