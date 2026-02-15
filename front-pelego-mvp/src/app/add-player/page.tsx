'use client';

import { useFut } from '@/contexts/FutContext';
import { useToast } from '@/hooks/use-toast';
import { addPlayerMapper } from '@/mapper/addPlayerMapper';
import { createPlayer } from '@/services/player/resources';
import { PlayerGetOverallFormData } from '@/types/player';

import PlayerForm from '@/components/PlayerForm';
import RoleGate from '@/components/RoleGate';

export default function AddPlayersPage() {
  const { futId } = useFut();
  const { toast } = useToast();

  const onSubmit = async (formData: PlayerGetOverallFormData) => {
    if (!futId) return;
    const playerData = addPlayerMapper(formData);

    try {
      await createPlayer(futId, playerData);
      toast({ title: 'Jogador criado com sucesso!' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar jogador',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    }
  };

  return (
    <RoleGate
      allow={['admin']}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
          <p className="text-lg">Apenas administradores podem adicionar jogadores.</p>
        </div>
      }>
      <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center p-8 gap-8">
        <h1 className="text-3xl font-semibold text-[hsl(var(--foreground))] mb-8">
          Adicionar Jogador
        </h1>
        <PlayerForm onSubmit={onSubmit} submitLabel="Salvar Jogador" />
      </div>
    </RoleGate>
  );
}
