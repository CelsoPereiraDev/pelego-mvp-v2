'use client';

import { useFut } from '@/contexts/FutContext';
import { ReactNode } from 'react';

interface RoleGateProps {
  allow: Array<'admin' | 'user' | 'viewer'>;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { userRole } = useFut();

  if (!userRole || !allow.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
