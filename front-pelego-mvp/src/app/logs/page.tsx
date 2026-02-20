'use client';

import RoleGate from '@/components/RoleGate';
import { Card } from '@/components/ui/card';
import { useLogs } from '@/services/logs/useLogs';
import { AuditLog } from '@/types/auditLog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

const ACTION_LABELS: Record<string, string> = {
  player_created: 'Jogador criado',
  player_updated: 'Jogador atualizado',
  player_deleted: 'Jogador excluído',
  week_created: 'Semana criada',
  week_updated: 'Semana atualizada',
  week_deleted: 'Semana excluída',
  goals_registered: 'Gols registrados',
  teams_updated: 'Times atualizados',
  scores_updated: 'Pontuações atualizadas',
  month_finalized: 'Mês finalizado',
  year_finalized: 'Ano finalizado',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  player: 'Jogadores',
  week: 'Semanas',
  match: 'Partidas',
  team: 'Times',
  member: 'Membros',
  stats: 'Estatísticas',
};

const TARGET_TYPE_COLORS: Record<string, string> = {
  player: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  week: 'bg-green-500/10 text-green-600 dark:text-green-400',
  match: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  team: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  member: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  stats: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
};

function formatWeekDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

function renderDetails(log: AuditLog): string | null {
  const d = log.details;
  if (!d) return null;

  switch (log.action) {
    case 'player_created':
      return [
        d.name as string | undefined,
        d.position as string | undefined,
        d.overall != null ? `Overall: ${d.overall}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

    case 'player_updated': {
      const playerName = d.playerName as string | undefined;
      const changes = d.changes as Record<string, unknown> | undefined;
      if (playerName && changes) {
        const fields = Object.keys(changes);
        if (fields.length === 0) return playerName ?? null;
        return `${playerName} · alterou: ${fields.join(', ')}`;
      }
      return playerName ?? null;
    }

    case 'player_deleted':
      return [d.name as string | undefined, d.position as string | undefined]
        .filter(Boolean)
        .join(' · ');

    case 'week_created':
      return [
        d.date ? formatWeekDate(d.date as string) : null,
        d.teamCount != null ? `${d.teamCount} times` : null,
        d.matchCount != null ? `${d.matchCount} partidas` : null,
      ]
        .filter(Boolean)
        .join(' · ');

    case 'week_updated':
      return [
        d.date ? formatWeekDate(d.date as string) : null,
        d.matchCount != null ? `${d.matchCount} partidas` : null,
      ]
        .filter(Boolean)
        .join(' · ');

    case 'week_deleted':
      return [
        d.deletedWeekDate ? formatWeekDate(d.deletedWeekDate as string) : null,
        d.totalPlayersAffected != null ? `${d.totalPlayersAffected} jogadores` : null,
      ]
        .filter(Boolean)
        .join(' · ');

    case 'goals_registered':
      return d.goalsCount != null ? `${d.goalsCount} gols` : null;

    case 'month_finalized':
      return [
        d.month != null && d.year != null
          ? `${String(d.month).padStart(2, '0')}/${d.year}`
          : null,
        d.mvp ? `MVP: ${d.mvp}` : null,
        d.topScorer ? `Artilheiro: ${d.topScorer}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

    case 'year_finalized':
      return [
        d.year ? String(d.year) : null,
        d.mvp ? `MVP: ${d.mvp}` : null,
        d.topScorer ? `Artilheiro: ${d.topScorer}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

    default:
      return null;
  }
}

export default function LogsPage() {
  return (
    <RoleGate
      allow={['admin', 'user']}
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Acesso restrito.</p>
        </div>
      }>
      <LogsContent />
    </RoleGate>
  );
}

function LogsContent() {
  const { logs, isLoading, error } = useLogs();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered =
    filterType === 'all' ? logs : logs.filter((l) => l.targetType === filterType);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Ações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de todas as alterações feitas no Fut
          </p>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto">
          <option value="all">Todos os tipos</option>
          {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">Carregando histórico...</p>
        </Card>
      )}

      {error && (
        <Card className="p-8 text-center">
          <p className="text-destructive text-sm">Erro ao carregar histórico.</p>
        </Card>
      )}

      {!isLoading && !error && (
        <Card>
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">Nenhuma ação registrada.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((log: AuditLog) => {
                const details = renderDetails(log);
                return (
                  <li key={log.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TARGET_TYPE_COLORS[log.targetType] ?? 'bg-muted text-muted-foreground'}`}>
                        {TARGET_TYPE_LABELS[log.targetType] ?? log.targetType}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      {details && (
                        <p className="text-xs text-foreground/70 mt-0.5">{details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        por <span className="font-medium text-foreground">{log.userName}</span>
                        {' · '}
                        {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
