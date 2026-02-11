'use client';

import { useFut } from '@/contexts/FutContext';
import { useState } from 'react';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

export default function FutOnboarding() {
  const { createFut } = useFut();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await createFut(name.trim(), description.trim());
    } catch (err) {
      setError('Erro ao criar o Fut. Tente novamente.');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-pitch flex items-center justify-center shadow-pitch mx-auto mb-4">
            <SportsSoccerIcon className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Crie seu primeiro Fut</h1>
          <p className="text-muted-foreground mt-2">
            Um Fut é o seu grupo de futebol. Adicione jogadores, registre partidas e acompanhe estatísticas.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 bg-card rounded-xl p-6 border border-border shadow-sm">
          <div>
            <label htmlFor="futName" className="block text-sm font-medium mb-1">
              Nome do Fut
            </label>
            <input
              id="futName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Pelada de Terça"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isCreating}
            />
          </div>

          <div>
            <label htmlFor="futDescription" className="block text-sm font-medium mb-1">
              Descrição <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="futDescription"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Futebol toda terça às 20h"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isCreating}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Criando...' : 'Criar Fut'}
          </button>
        </form>
      </div>
    </div>
  );
}
