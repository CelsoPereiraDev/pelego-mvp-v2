'use client';

import { useAuth } from '@/contexts/AuthContext';
import { FutProvider, useFut } from '@/contexts/FutContext';
import MainMenu from '@/components/MainMenu';
import LandingPage from '@/app/landing/page';
import FutOnboarding from '@/components/FutOnboarding';
import { usePathname } from 'next/navigation';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { futId, loading: futLoading, futs } = useFut();
  const pathname = usePathname();

  // Invite pages bypass sidebar and FutOnboarding
  if (pathname.startsWith('/invite/')) {
    return <>{children}</>;
  }

  if (futLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (futs.length === 0 || !futId) {
    return <FutOnboarding />;
  }

  return (
    <div className="flex min-h-screen">
      <MainMenu />
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <FutProvider>
      <AppShellInner>{children}</AppShellInner>
    </FutProvider>
  );
}
