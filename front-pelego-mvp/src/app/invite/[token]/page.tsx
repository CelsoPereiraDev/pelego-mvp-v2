'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFut } from '@/contexts/FutContext';
import { getInviteInfo, acceptInvite } from '@/services/invites/resources';
import { InviteData } from '@/types/invite';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const roleLabels: Record<string, string> = {
  user: 'Membro',
  viewer: 'Espectador',
};

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { refreshFuts, switchFut } = useFut();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      try {
        const data = await getInviteInfo(params.token);
        setInvite(data);
      } catch {
        setError('Convite não encontrado ou inválido.');
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [params.token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    try {
      const result = await acceptInvite(params.token);
      setSuccess(true);
      await refreshFuts();
      switchFut(result.futId);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao aceitar convite';
      if (message.includes('já é membro')) {
        setError('Você já é membro deste Fut.');
      } else if (message.includes('expirado')) {
        setError('Este convite expirou.');
      } else if (message.includes('limite')) {
        setError('Este convite atingiu o limite de usos.');
      } else if (message.includes('revogado')) {
        setError('Este convite foi revogado.');
      } else {
        setError(message);
      }
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando convite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-pitch flex items-center justify-center shadow-pitch mx-auto mb-4">
            <SportsSoccerIcon className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">PELEGO</h1>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          {error && !invite ? (
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Ir para o app
              </button>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <GroupAddIcon className="text-green-500 w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Convite aceito!</h2>
              <p className="text-sm text-muted-foreground">
                Você agora faz parte de <strong>{invite?.futName}</strong>. Redirecionando...
              </p>
            </div>
          ) : invite ? (
            <>
              <div className="text-center mb-6">
                <GroupAddIcon className="text-primary w-10 h-10 mb-3" />
                <h2 className="text-lg font-semibold mb-2">Você foi convidado!</h2>
                <p className="text-sm text-muted-foreground">
                  Você foi convidado para participar do Fut{' '}
                  <strong className="text-foreground">{invite.futName}</strong> como{' '}
                  <strong className="text-foreground">
                    {roleLabels[invite.role] || invite.role}
                  </strong>
                  .
                </p>
              </div>

              {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {accepting ? 'Aceitando...' : 'Aceitar convite'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
