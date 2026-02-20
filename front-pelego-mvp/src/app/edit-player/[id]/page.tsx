'use client';

import { useParams, useRouter } from 'next/navigation';

import { useFut } from '@/contexts/FutContext';
import { useToast } from '@/hooks/use-toast';
import { addPlayerMapper } from '@/mapper/addPlayerMapper';
import { usePlayer } from '@/services/player/usePlayer';
import { PlayerGetOverallFormData } from '@/types/player';

import PlayerForm from '@/components/PlayerForm';
import RoleGate from '@/components/RoleGate';

export default function EditPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { futId } = useFut();
  const { toast } = useToast();
  const router = useRouter();
  const { player, edit, isLoading } = usePlayer(id);

  const onSubmit = async (formData: PlayerGetOverallFormData) => {
    if (!futId) return;
    const playerData = addPlayerMapper(formData);

    try {
      await edit(playerData);
      toast({ title: 'Jogador atualizado com sucesso!' });
      router.back();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao editar jogador',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    }
  };

  if (isLoading || !player) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <p className="text-[hsl(var(--foreground))]">Carregando...</p>
      </div>
    );
  }

  const defaultValues: Partial<PlayerGetOverallFormData> = {
    name: player.name,
    position: player.position,
    country: player.country || '',
    email: player.email || '',
    overall: {
      pace: String(player.overall.pace),
      shooting: String(player.overall.shooting),
      passing: String(player.overall.passing),
      dribble: String(player.overall.dribble),
      defense: String(player.overall.defense),
      physics: String(player.overall.physics),
    },
  };

  return (
    <RoleGate
      allow={['admin', 'user']}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
          <p className="text-lg">Apenas membros e administradores podem editar jogadores.</p>
        </div>
      }>
      <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center p-8 gap-8">
        <h1 className="text-3xl font-semibold text-[hsl(var(--foreground))] mb-8">
          Editar Jogador
        </h1>
        <PlayerForm
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          submitLabel="Salvar Alterações"
        />
      </div>
    </RoleGate>
  );
}
