# Match Flow - Advanced Validations & UX Improvements

**Complemento ao documento:** MATCH_FLOW_IMPROVEMENT_PROPOSAL.md
**Data:** December 22, 2024
**Foco:** Validações inteligentes e melhorias adicionais no fluxo de partidas

---

## 1. Validações Inteligentes para Gols

### 1.1 Limitação Dinâmica de Gols por Jogador

**Problema Atual:**
- Usuário pode selecionar que um jogador fez 5 gols quando o time só marcou 3 gols total
- Sem validação da soma de gols individuais vs placar total

**Solução Proposta:**

```typescript
// GoalEntry Component Logic
const GoalEntry = ({ matchIndex, side, goalIndex, control, teamScore }) => {
  const currentGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`
  });

  // Calculate remaining goals available for distribution
  const goalsAllocated = currentGoalScorers?.reduce((sum, scorer, idx) => {
    if (idx !== goalIndex) { // Don't count current field
      return sum + (scorer?.goals || 0);
    }
    return sum;
  }, 0) || 0;

  const remainingGoals = parseInt(teamScore || '0') - goalsAllocated;

  // Dynamic options: only show valid numbers
  const goalOptions = Array.from(
    { length: Math.min(remainingGoals + 1, 10) },
    (_, i) => ({ label: i.toString(), value: i })
  );

  return (
    <Controller
      control={control}
      name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.goals`}
      render={({ field }) => (
        <Select
          options={goalOptions}
          value={goalOptions.find(opt => opt.value === field.value)}
          onChange={(opt) => field.onChange(opt?.value)}
          placeholder="Qtd gols"
        />
      )}
    />
  );
};
```

**Visual Feedback:**
```tsx
// Show remaining goals indicator
<div className="text-xs text-muted-foreground">
  Disponível: {remainingGoals} gol{remainingGoals !== 1 ? 's' : ''}
</div>

// If all goals allocated
{remainingGoals === 0 && (
  <Badge variant="success" className="gap-1">
    <CheckCircle2 className="w-3 h-3" />
    Todos os gols distribuídos
  </Badge>
)}

// If over-allocated (error state)
{remainingGoals < 0 && (
  <Badge variant="destructive" className="gap-1">
    <AlertCircle className="w-3 h-3" />
    {Math.abs(remainingGoals)} gol{Math.abs(remainingGoals) !== 1 ? 's' : ''} a mais
  </Badge>
)}
```

### 1.2 Validação em Tempo Real com Feedback Visual

**Implementação:**

```typescript
// Hook customizado para validação de gols
const useGoalValidation = (matchIndex: number, side: 'home' | 'away', control: Control) => {
  const teamScore = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.goalsCount`
  });

  const goalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`
  });

  const totalAllocated = useMemo(() => {
    return goalScorers?.reduce((sum, scorer) => {
      const goals = scorer?.goals || 0;
      // Own goals don't count for this team
      if (scorer?.playerId === 'GC') return sum;
      return sum + goals;
    }, 0) || 0;
  }, [goalScorers]);

  const expectedScore = parseInt(teamScore || '0');

  // Check if opponent own goals add to total
  const opponentSide = side === 'home' ? 'away' : 'home';
  const opponentGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.${opponentSide}Goals.whoScores`
  });

  const ownGoalsForThisTeam = opponentGoalScorers?.reduce((sum, scorer) => {
    if (scorer?.playerId === 'GC' && scorer?.ownGoalPlayerId) {
      return sum + (scorer.goals || 0);
    }
    return sum;
  }, 0) || 0;

  const actualTotal = totalAllocated + ownGoalsForThisTeam;

  return {
    expectedScore,
    totalAllocated,
    ownGoalsForThisTeam,
    actualTotal,
    isValid: actualTotal === expectedScore,
    isOverAllocated: actualTotal > expectedScore,
    isUnderAllocated: actualTotal < expectedScore && expectedScore > 0,
    remaining: expectedScore - actualTotal
  };
};

// Visual Component
const GoalValidationIndicator = ({ validation }) => {
  if (validation.expectedScore === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {validation.isValid && (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Válido ({validation.actualTotal}/{validation.expectedScore})
        </Badge>
      )}

      {validation.isUnderAllocated && (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Faltam {validation.remaining} gol{validation.remaining !== 1 ? 's' : ''}
        </Badge>
      )}

      {validation.isOverAllocated && (
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          {Math.abs(validation.remaining)} gol{Math.abs(validation.remaining) !== 1 ? 's' : ''} a mais
        </Badge>
      )}

      {validation.ownGoalsForThisTeam > 0 && (
        <span className="text-xs text-muted-foreground">
          (incluindo {validation.ownGoalsForThisTeam} GC)
        </span>
      )}
    </div>
  );
};
```

---

## 2. Melhorias no Fluxo de Criação de Partidas

### 2.1 Auto-expansão Inteligente

**Comportamento:**

```typescript
const MatchCard = ({ index, control }) => {
  const homeScore = useWatch({ control, name: `matches.${index}.homeGoals.goalsCount` });
  const awayScore = useWatch({ control, name: `matches.${index}.awayGoals.goalsCount` });

  // Auto-expand quando qualquer placar > 0
  const shouldAutoExpand = useMemo(() => {
    return parseInt(homeScore || '0') > 0 || parseInt(awayScore || '0') > 0;
  }, [homeScore, awayScore]);

  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);

  useEffect(() => {
    if (shouldAutoExpand && !isExpanded) {
      setIsExpanded(true);
      // Toast notification
      toast({
        title: 'Detalhes de gols habilitados',
        description: 'Agora você pode adicionar quem marcou os gols',
        duration: 3000
      });
    }
  }, [shouldAutoExpand]);

  return (
    <Card>
      {/* ... team/score selection ... */}

      {shouldAutoExpand && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2">
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
            Detalhes dos Gols
            {!isExpanded && <Badge variant="secondary">{parseInt(homeScore) + parseInt(awayScore)} gols</Badge>}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <GoalDetailsPanel {...props} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
};
```

### 2.2 Geração Automática de Campos de Gol

**Smart Defaults:**

```typescript
const GoalDetailsPanel = ({ matchIndex, side, goalCount, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`
  });

  // Auto-create fields when goal count changes
  useEffect(() => {
    const expectedGoals = parseInt(goalCount || '0');
    const currentFields = fields.length;

    if (expectedGoals > currentFields) {
      // Add missing fields
      const fieldsToAdd = expectedGoals - currentFields;
      for (let i = 0; i < fieldsToAdd; i++) {
        append({ playerId: '', goals: 1, ownGoalPlayerId: undefined });
      }
    } else if (expectedGoals < currentFields) {
      // Remove excess fields
      const fieldsToRemove = currentFields - expectedGoals;
      for (let i = 0; i < fieldsToRemove; i++) {
        remove(currentFields - i - 1);
      }
    }
  }, [goalCount, fields.length, append, remove]);

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <GoalEntry key={field.id} index={index} {...props} />
      ))}
    </div>
  );
};
```

### 2.3 ~~Distribuição Inteligente de Gols~~ (REMOVIDO)

**Decisão:** Não implementar distribuição automática de gols.

**Motivo:** Mantém controle total nas mãos do usuário, evitando pressuposições incorretas sobre quem marcou os gols.

### 2.3 Validação de Jogadores Únicos

**Evitar que mesmo jogador marque em múltiplas entradas:**

```typescript
const GoalEntry = ({ matchIndex, side, goalIndex, control, teamPlayers }) => {
  const allGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`
  });

  const currentPlayerId = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.playerId`
  });

  // Filter out players already selected (except current)
  const availablePlayers = useMemo(() => {
    const selectedPlayerIds = new Set(
      allGoalScorers
        ?.filter((scorer, idx) => idx !== goalIndex && scorer?.playerId !== 'GC')
        .map(scorer => scorer?.playerId)
        .filter(Boolean)
    );

    return teamPlayers.filter(player => !selectedPlayerIds.has(player.id));
  }, [allGoalScorers, goalIndex, teamPlayers]);

  // Add back current player if already selected
  const playerOptions = useMemo(() => {
    const options = [
      { label: 'GC (Gol Contra)', value: 'GC' },
      ...availablePlayers.map(p => ({ label: p.name, value: p.id }))
    ];

    // If current player not in available, add them
    if (currentPlayerId && currentPlayerId !== 'GC') {
      const currentPlayer = teamPlayers.find(p => p.id === currentPlayerId);
      if (currentPlayer && !availablePlayers.find(p => p.id === currentPlayerId)) {
        options.push({ label: `${currentPlayer.name} ✓`, value: currentPlayer.id });
      }
    }

    return options;
  }, [availablePlayers, currentPlayerId, teamPlayers]);

  return (
    <Controller
      control={control}
      name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.playerId`}
      render={({ field }) => (
        <SelectWithSearch
          options={playerOptions}
          value={playerOptions.find(opt => opt.value === field.value)}
          onChange={(opt) => field.onChange(opt?.value)}
          placeholder="Selecionar jogador"
        />
      )}
    />
  );
};
```

---

## 3. Preview da Semana - Estatísticas em Tempo Real

### 3.1 Visão Geral do Preview

**Posição:** Sidebar fixa ou seção collapsible acima do botão "Salvar"

**Objetivo:** Dar feedback imediato sobre o desempenho geral da semana antes de salvar

**Atualização:** Tempo real conforme usuário preenche os dados

### 3.2 Componente WeekPreview

```typescript
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Target, TrendingUp, AlertTriangle, Award } from 'lucide-react';

interface WeekPreviewProps {
  control: Control<CreateMatchForm>;
  teams: { players: string[] }[];
  players: PlayerResponse[];
}

export const WeekPreview = ({ control, teams, players }: WeekPreviewProps) => {
  const matches = useWatch({ control, name: 'matches' });

  // Calculate all statistics in real-time
  const statistics = useMemo(() => {
    if (!matches || matches.length === 0) {
      return null;
    }

    // Initialize team points
    const teamPoints: Record<number, number> = {};
    teams.forEach((_, idx) => teamPoints[idx] = 0);

    // Initialize player stats
    const playerGoals: Record<string, number> = {};
    const playerAssists: Record<string, number> = {};
    let totalOwnGoals = 0;

    matches.forEach(match => {
      const homeTeamIdx = parseInt(match.homeTeamId?.toString() || '-1');
      const awayTeamIdx = parseInt(match.awayTeamId?.toString() || '-1');

      if (homeTeamIdx === -1 || awayTeamIdx === -1) return;

      const homeScore = parseInt(match.homeGoals?.goalsCount || '0');
      const awayScore = parseInt(match.awayGoals?.goalsCount || '0');

      // Calculate points (3 win, 1 draw, 0 loss)
      if (homeScore > awayScore) {
        teamPoints[homeTeamIdx] += 3;
      } else if (awayScore > homeScore) {
        teamPoints[awayTeamIdx] += 3;
      } else if (homeScore === awayScore && homeScore > 0) {
        teamPoints[homeTeamIdx] += 1;
        teamPoints[awayTeamIdx] += 1;
      }

      // Count goals per player
      match.homeGoals?.whoScores?.forEach(goal => {
        if (goal.playerId === 'GC') {
          totalOwnGoals += goal.goals || 0;
        } else if (goal.playerId) {
          playerGoals[goal.playerId] = (playerGoals[goal.playerId] || 0) + (goal.goals || 0);
        }
      });

      match.awayGoals?.whoScores?.forEach(goal => {
        if (goal.playerId === 'GC') {
          totalOwnGoals += goal.goals || 0;
        } else if (goal.playerId) {
          playerGoals[goal.playerId] = (playerGoals[goal.playerId] || 0) + (goal.goals || 0);
        }
      });

      // Count assists per player
      match.homeAssists?.forEach(assist => {
        if (assist.playerId && assist.assists) {
          playerAssists[assist.playerId] = (playerAssists[assist.playerId] || 0) + assist.assists;
        }
      });

      match.awayAssists?.forEach(assist => {
        if (assist.playerId && assist.assists) {
          playerAssists[assist.playerId] = (playerAssists[assist.playerId] || 0) + assist.assists;
        }
      });
    });

    // Find top scorer
    let topScorer: { playerId: string; goals: number } | null = null;
    Object.entries(playerGoals).forEach(([playerId, goals]) => {
      if (!topScorer || goals > topScorer.goals) {
        topScorer = { playerId, goals };
      }
    });

    // Find top assister
    let topAssister: { playerId: string; assists: number } | null = null;
    Object.entries(playerAssists).forEach(([playerId, assists]) => {
      if (!topAssister || assists > topAssister.assists) {
        topAssister = { playerId, assists };
      }
    });

    // Find leader(s)
    const maxPoints = Math.max(...Object.values(teamPoints));
    const leaders = Object.entries(teamPoints)
      .filter(([_, points]) => points === maxPoints)
      .map(([teamIdx, points]) => ({ teamIdx: parseInt(teamIdx), points }));

    return {
      teamPoints,
      topScorer,
      topAssister,
      totalOwnGoals,
      leaders,
      totalMatches: matches.length,
      totalGoals: Object.values(playerGoals).reduce((sum, g) => sum + g, 0) + totalOwnGoals
    };
  }, [matches, teams]);

  if (!statistics) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Adicione partidas para ver o preview</p>
        </CardContent>
      </Card>
    );
  }

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Desconhecido';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-primary" />
          Preview da Semana
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Team Standings */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <Award className="w-4 h-4" />
            Classificação
          </h4>

          <div className="space-y-1.5">
            {Object.entries(statistics.teamPoints)
              .sort(([, a], [, b]) => b - a)
              .map(([teamIdx, points], position) => {
                const isLeader = statistics.leaders.some(l => l.teamIdx === parseInt(teamIdx));
                return (
                  <div
                    key={teamIdx}
                    className="flex items-center justify-between p-2 rounded-md bg-card/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">
                        {position + 1}º
                      </span>
                      <Badge variant={isLeader ? 'default' : 'secondary'}>
                        Time {parseInt(teamIdx) + 1}
                      </Badge>
                      {isLeader && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{points}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {statistics.leaders.length > 1 && (
            <p className="text-xs text-muted-foreground italic text-center">
              Empate na liderança ({statistics.leaders.length} times)
            </p>
          )}
        </div>

        <Separator />

        {/* Top Scorer */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <Target className="w-4 h-4" />
            Artilheiro da Semana
          </h4>

          {statistics.topScorer ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {getPlayerName(statistics.topScorer.playerId)}
                  </p>
                  <p className="text-xs text-muted-foreground">Artilheiro</p>
                </div>
              </div>
              <Badge variant="goal" className="gap-1">
                {statistics.topScorer.goals}
                <span className="text-xs">gol{statistics.topScorer.goals !== 1 ? 's' : ''}</span>
              </Badge>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Nenhum gol marcado ainda
            </p>
          )}
        </div>

        <Separator />

        {/* Top Assister */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Maior Assistente
          </h4>

          {statistics.topAssister ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-assist-indicator/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-assist-indicator" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {getPlayerName(statistics.topAssister.playerId)}
                  </p>
                  <p className="text-xs text-muted-foreground">Assistente</p>
                </div>
              </div>
              <Badge variant="assist" className="gap-1">
                {statistics.topAssister.assists}
                <span className="text-xs">assist.</span>
              </Badge>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Nenhuma assistência registrada
            </p>
          )}
        </div>

        {/* Own Goals (only if > 0) */}
        {statistics.totalOwnGoals > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Gols Contra
              </h4>

              <div className="flex items-center justify-between p-3 rounded-md bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Gols Contra</p>
                    <p className="text-xs text-muted-foreground">Total na semana</p>
                  </div>
                </div>
                <Badge variant="ownGoal" className="gap-1">
                  {statistics.totalOwnGoals}
                  <span className="text-xs">GC</span>
                </Badge>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-card/50">
            <p className="text-xl font-bold">{statistics.totalMatches}</p>
            <p className="text-xs text-muted-foreground">Partidas</p>
          </div>
          <div className="p-2 rounded-md bg-card/50">
            <p className="text-xl font-bold">{statistics.totalGoals}</p>
            <p className="text-xs text-muted-foreground">Gols</p>
          </div>
          <div className="p-2 rounded-md bg-card/50">
            <p className="text-xl font-bold">
              {statistics.totalGoals > 0
                ? (statistics.totalGoals / statistics.totalMatches).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-xs text-muted-foreground">Média</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.3 Posicionamento no Layout

**Opção 1: Sidebar Fixa (Desktop)**

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
  {/* Main Form */}
  <div className="space-y-6">
    <WeekDateHeader />
    <TeamsSection />
    <MatchesSection />
    <FormFooter />
  </div>

  {/* Sticky Preview Sidebar */}
  <div className="hidden lg:block">
    <div className="sticky top-6">
      <WeekPreview control={control} teams={teams} players={players} />
    </div>
  </div>
</div>

{/* Mobile: Show preview above footer */}
<div className="lg:hidden mb-6">
  <WeekPreview control={control} teams={teams} players={players} />
</div>
```

**Opção 2: Collapsible acima do botão Salvar**

```tsx
<div className="space-y-6">
  <WeekDateHeader />
  <TeamsSection />
  <MatchesSection />

  {/* Preview collapsible */}
  <Collapsible defaultOpen>
    <CollapsibleTrigger className="flex items-center gap-2 w-full justify-between p-3 bg-muted rounded-lg hover:bg-muted/80">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        <span className="font-semibold">Preview da Semana</span>
      </div>
      <ChevronDown className="w-5 h-5" />
    </CollapsibleTrigger>

    <CollapsibleContent className="mt-3">
      <WeekPreview control={control} teams={teams} players={players} />
    </CollapsibleContent>
  </Collapsible>

  <FormFooter />
</div>
```

### 3.4 Visual do Preview (Wireframe)

```
┌────────────────────────────────────────────┐
│ 🏆 Preview da Semana                      │
├────────────────────────────────────────────┤
│                                            │
│ 🏅 Classificação                          │
│ ┌────────────────────────────────────────┐│
│ │ 1º [Time 1] 🏆             9 pts      ││
│ │ 2º [Time 2]                6 pts      ││
│ │ 3º [Time 3]                3 pts      ││
│ │ 4º [Time 4]                0 pts      ││
│ └────────────────────────────────────────┘│
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ 🎯 Artilheiro da Semana                   │
│ ┌────────────────────────────────────────┐│
│ │ [●] Jogador A              5 gols     ││
│ │     Artilheiro                         ││
│ └────────────────────────────────────────┘│
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ 📈 Maior Assistente                       │
│ ┌────────────────────────────────────────┐│
│ │ [●] Jogador B              3 assist.  ││
│ │     Assistente                         ││
│ └────────────────────────────────────────┘│
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ ⚠️  Gols Contra                           │
│ ┌────────────────────────────────────────┐│
│ │ [!] Gols Contra            2 GC       ││
│ │     Total na semana                    ││
│ └────────────────────────────────────────┘│
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ ┌──────┬──────┬──────┐                    │
│ │  6   │  18  │ 3.0  │                    │
│ │Partidas│Gols│Média │                    │
│ └──────┴──────┴──────┘                    │
└────────────────────────────────────────────┘
```

### 3.5 Funcionalidades do Preview

**Atualização em Tempo Real:**
- ✅ Recalcula a cada mudança nos matches (via `useWatch`)
- ✅ Debounced para performance (300ms delay)
- ✅ Memoizado para evitar cálculos desnecessários

**Tratamento de Empates:**
- Se múltiplos times com mesma pontuação:
  - Mostra troféu para todos os líderes
  - Exibe mensagem "Empate na liderança (X times)"

**Tratamento de Artilheiros Empatados:**
- Se múltiplos jogadores com mesmos gols:
  - Mostra apenas o primeiro encontrado
  - **(Opcional)** Badge "e mais X" se quiser mostrar todos

**Estados Vazios:**
- Sem partidas: "Adicione partidas para ver o preview"
- Sem gols: "Nenhum gol marcado ainda"
- Sem assistências: "Nenhuma assistência registrada"
- Sem GC: Seção não aparece

### 3.6 Performance Optimization

```typescript
// Debounced calculation
const useDebouncedMatches = (matches: any[], delay = 300) => {
  const [debouncedMatches, setDebouncedMatches] = useState(matches);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMatches(matches);
    }, delay);

    return () => clearTimeout(handler);
  }, [matches, delay]);

  return debouncedMatches;
};

// Usage in WeekPreview
const matches = useWatch({ control, name: 'matches' });
const debouncedMatches = useDebouncedMatches(matches);

const statistics = useMemo(() => {
  // ... calculation logic
}, [debouncedMatches, teams]);
```

---

## 4. Validações de Assistências

### 3.1 Limite de Assistências por Gol

**Regra:** Cada gol pode ter no máximo 1 assistência

```typescript
const AssistEntry = ({ matchIndex, side, goalIndex, control }) => {
  const assistCount = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Assists.${goalIndex}.assists`
  });

  // Limit to 1 assist per goal entry
  const assistOptions = [
    { label: '0', value: 0 },
    { label: '1', value: 1 }
  ];

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm">Assistência:</Label>
      <Controller
        control={control}
        name={`matches.${matchIndex}.${side}Assists.${goalIndex}.playerId`}
        render={({ field }) => (
          <SelectWithSearch
            options={teamPlayerOptions}
            value={teamPlayerOptions.find(opt => opt.value === field.value)}
            onChange={(opt) => {
              field.onChange(opt?.value);
              // Auto-set assists to 1 when player selected
              if (opt?.value) {
                setValue(
                  `matches.${matchIndex}.${side}Assists.${goalIndex}.assists`,
                  1
                );
              }
            }}
            placeholder="Quem assistiu?"
            isClearable
          />
        )}
      />

      {assistCount > 0 && (
        <Badge variant="assist" size="sm">
          1 assistência
        </Badge>
      )}
    </div>
  );
};
```

### 3.2 Validação: Assistente ≠ Artilheiro

**Evitar que jogador assista seu próprio gol:**

```typescript
const AssistEntry = ({ matchIndex, side, goalIndex, control, teamPlayers }) => {
  const goalScorer = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.playerId`
  });

  const isOwnGoal = goalScorer === 'GC';

  // Filter out goal scorer from assist options
  const assistOptions = useMemo(() => {
    if (isOwnGoal) {
      // For own goals, no assists
      return [];
    }

    return teamPlayers
      .filter(player => player.id !== goalScorer)
      .map(player => ({ label: player.name, value: player.id }));
  }, [teamPlayers, goalScorer, isOwnGoal]);

  if (isOwnGoal) {
    return (
      <div className="text-xs text-muted-foreground italic">
        Gols contra não têm assistências
      </div>
    );
  }

  return (
    <Controller
      control={control}
      name={`matches.${matchIndex}.${side}Assists.${goalIndex}.playerId`}
      render={({ field }) => (
        <SelectWithSearch
          options={assistOptions}
          value={assistOptions.find(opt => opt.value === field.value)}
          onChange={(opt) => field.onChange(opt?.value)}
          placeholder="Assistência (opcional)"
          isClearable
        />
      )}
    />
  );
};
```

---

## 4. Melhorias de UX Adicionais

### 4.1 Preview do Placar em Tempo Real

```typescript
const MatchScorePreview = ({ matchIndex, control, teams }) => {
  const homeTeamId = useWatch({ control, name: `matches.${matchIndex}.homeTeamId` });
  const awayTeamId = useWatch({ control, name: `matches.${matchIndex}.awayTeamId` });
  const homeScore = useWatch({ control, name: `matches.${matchIndex}.homeGoals.goalsCount` });
  const awayScore = useWatch({ control, name: `matches.${matchIndex}.awayGoals.goalsCount` });

  const homeTeam = teams[parseInt(homeTeamId)];
  const awayTeam = teams[parseInt(awayTeamId)];

  const homeGoals = parseInt(homeScore || '0');
  const awayGoals = parseInt(awayScore || '0');

  const result = homeGoals > awayGoals ? 'home-win' :
                 homeGoals < awayGoals ? 'away-win' :
                 homeGoals === awayGoals && homeGoals > 0 ? 'draw' :
                 'pending';

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Badge variant={result === 'home-win' ? 'success' : 'secondary'}>
          Time {parseInt(homeTeamId) + 1}
        </Badge>
        <span className={cn(
          "text-2xl font-bold",
          result === 'home-win' && "text-success",
          result === 'away-win' && "text-muted-foreground"
        )}>
          {homeGoals}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg text-muted-foreground">×</span>
        {result === 'draw' && <Badge variant="secondary">Empate</Badge>}
      </div>

      <div className="flex items-center gap-3">
        <span className={cn(
          "text-2xl font-bold",
          result === 'away-win' && "text-success",
          result === 'home-win' && "text-muted-foreground"
        )}>
          {awayGoals}
        </span>
        <Badge variant={result === 'away-win' ? 'success' : 'secondary'}>
          Time {parseInt(awayTeamId) + 1}
        </Badge>
      </div>
    </div>
  );
};
```

### 4.2 Resumo da Partida

```typescript
const MatchSummary = ({ matchIndex, control, teams, players }) => {
  const homeGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.homeGoals.whoScores`
  });

  const awayGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.awayGoals.whoScores`
  });

  const homeAssists = useWatch({
    control,
    name: `matches.${matchIndex}.homeAssists`
  });

  const awayAssists = useWatch({
    control,
    name: `matches.${matchIndex}.awayAssists`
  });

  const renderGoalSummary = (scorers, assists, side) => {
    return scorers?.map((scorer, idx) => {
      if (!scorer?.playerId) return null;

      const player = players.find(p => p.id === scorer.playerId);
      const isOwnGoal = scorer.playerId === 'GC';
      const ownGoalPlayer = isOwnGoal
        ? players.find(p => p.id === scorer.ownGoalPlayerId)
        : null;

      const assist = assists?.[idx];
      const assistPlayer = assist?.playerId
        ? players.find(p => p.id === assist.playerId)
        : null;

      return (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <Badge variant={isOwnGoal ? 'ownGoal' : 'goal'}>
            {scorer.goals}×
          </Badge>

          <span className="font-medium">
            {isOwnGoal ? (
              <>GC - {ownGoalPlayer?.name || 'Desconhecido'}</>
            ) : (
              player?.name || 'Não selecionado'
            )}
          </span>

          {!isOwnGoal && assistPlayer && (
            <span className="text-muted-foreground text-xs">
              (ass: {assistPlayer.name})
            </span>
          )}
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <FileText className="w-4 h-4" />
        Ver resumo da partida
        <ChevronDown className="w-4 h-4" />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Time Casa</h4>
            {renderGoalSummary(homeGoalScorers, homeAssists, 'home')}
            {(!homeGoalScorers || homeGoalScorers.length === 0) && (
              <p className="text-xs text-muted-foreground italic">Nenhum gol</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Time Visitante</h4>
            {renderGoalSummary(awayGoalScorers, awayAssists, 'away')}
            {(!awayGoalScorers || awayGoalScorers.length === 0) && (
              <p className="text-xs text-muted-foreground italic">Nenhum gol</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
```

### 4.3 Quick Actions (Ações Rápidas)

```typescript
const MatchQuickActions = ({ matchIndex, control, setValue }) => {
  const [showActions, setShowActions] = useState(false);

  const handleSetDraw = (score: number) => {
    setValue(`matches.${matchIndex}.homeGoals.goalsCount`, score.toString());
    setValue(`matches.${matchIndex}.awayGoals.goalsCount`, score.toString());
    toast({ title: `Empate ${score}×${score} configurado` });
  };

  return (
    <Popover open={showActions} onOpenChange={setShowActions}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Ações Rápidas
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Atalhos</h4>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSetDraw(0)}
            >
              0 × 0
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSetDraw(1)}
            >
              1 × 1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSetDraw(2)}
            >
              2 × 2
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSetDraw(3)}
            >
              3 × 3
            </Button>
          </div>

          <Separator />

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              setValue(`matches.${matchIndex}.homeGoals.goalsCount`, '0');
              setValue(`matches.${matchIndex}.awayGoals.goalsCount`, '0');
              setValue(`matches.${matchIndex}.homeGoals.whoScores`, []);
              setValue(`matches.${matchIndex}.awayGoals.whoScores`, []);
              setValue(`matches.${matchIndex}.homeAssists`, []);
              setValue(`matches.${matchIndex}.awayAssists`, []);
              toast({ title: 'Partida resetada' });
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Partida
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
```

---

## 5. Validações Zod Aprimoradas

### 5.1 Schema Completo com Todas as Validações

```typescript
export const CreateMatchSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  teams: z.array(
    z.object({
      players: z.array(z.string()).min(1, 'Time deve ter pelo menos 1 jogador')
    })
  ).min(2, 'Pelo menos 2 times são necessários'),
  matches: z.array(
    z.object({
      homeTeamId: z.string(),
      awayTeamId: z.string(),
      homeGoals: z.object({
        goalsCount: z.string(),
        whoScores: z.array(
          z.object({
            goals: z.number()
              .int('Gols deve ser número inteiro')
              .min(0, 'Gols não pode ser negativo')
              .max(10, 'Máximo 10 gols por jogador'),
            playerId: z.string().min(1, 'Selecione o jogador'),
            ownGoalPlayerId: z.string().optional()
          })
        ).optional()
      }),
      homeAssists: z.array(
        z.object({
          assists: z.number()
            .int('Assistências deve ser número inteiro')
            .min(0)
            .max(1, 'Máximo 1 assistência por gol'),
          playerId: z.string().min(1, 'Selecione o jogador')
        })
      ).optional(),
      awayGoals: z.object({
        goalsCount: z.string(),
        whoScores: z.array(
          z.object({
            goals: z.number()
              .int()
              .min(0)
              .max(10),
            playerId: z.string().min(1),
            ownGoalPlayerId: z.string().optional()
          })
        ).optional()
      }),
      awayAssists: z.array(
        z.object({
          assists: z.number().int().min(0).max(1),
          playerId: z.string().min(1)
        })
      ).optional()
    })
    .refine(
      (data) => data.homeTeamId !== data.awayTeamId,
      { message: 'Times não podem jogar contra si mesmos', path: ['awayTeamId'] }
    )
    .refine(
      (data) => {
        // Home team goal count validation
        const homeGoalsCount = parseInt(data.homeGoals.goalsCount || '0');
        const homeScored = data.homeGoals.whoScores?.reduce((sum, g) =>
          g.playerId !== 'GC' ? sum + g.goals : sum, 0) || 0;
        const homeOwnGoalsReceived = data.awayGoals.whoScores?.reduce((sum, g) =>
          g.playerId === 'GC' ? sum + g.goals : sum, 0) || 0;

        return homeScored + homeOwnGoalsReceived === homeGoalsCount;
      },
      {
        message: 'Soma dos gols não corresponde ao placar do time da casa',
        path: ['homeGoals', 'whoScores']
      }
    )
    .refine(
      (data) => {
        // Away team goal count validation
        const awayGoalsCount = parseInt(data.awayGoals.goalsCount || '0');
        const awayScored = data.awayGoals.whoScores?.reduce((sum, g) =>
          g.playerId !== 'GC' ? sum + g.goals : sum, 0) || 0;
        const awayOwnGoalsReceived = data.homeGoals.whoScores?.reduce((sum, g) =>
          g.playerId === 'GC' ? sum + g.goals : sum, 0) || 0;

        return awayScored + awayOwnGoalsReceived === awayGoalsCount;
      },
      {
        message: 'Soma dos gols não corresponde ao placar do time visitante',
        path: ['awayGoals', 'whoScores']
      }
    )
    .refine(
      (data) => {
        // Validate assist player ≠ goal scorer
        const homeValid = data.homeGoals.whoScores?.every((goal, idx) => {
          if (goal.playerId === 'GC') return true; // Own goals can't have assists
          const assist = data.homeAssists?.[idx];
          return !assist || assist.playerId !== goal.playerId;
        }) ?? true;

        const awayValid = data.awayGoals.whoScores?.every((goal, idx) => {
          if (goal.playerId === 'GC') return true;
          const assist = data.awayAssists?.[idx];
          return !assist || assist.playerId !== goal.playerId;
        }) ?? true;

        return homeValid && awayValid;
      },
      {
        message: 'Jogador não pode assistir seu próprio gol',
        path: ['homeAssists']
      }
    )
    .refine(
      (data) => {
        // Validate no duplicate goal scorers in same match
        const homePlayerIds = data.homeGoals.whoScores
          ?.filter(g => g.playerId !== 'GC')
          .map(g => g.playerId) || [];

        const homeHasDuplicates = new Set(homePlayerIds).size !== homePlayerIds.length;

        const awayPlayerIds = data.awayGoals.whoScores
          ?.filter(g => g.playerId !== 'GC')
          .map(g => g.playerId) || [];

        const awayHasDuplicates = new Set(awayPlayerIds).size !== awayPlayerIds.length;

        return !homeHasDuplicates && !awayHasDuplicates;
      },
      {
        message: 'Jogador não pode aparecer múltiplas vezes como artilheiro (use o campo "Qtd gols")',
        path: ['homeGoals', 'whoScores']
      }
    )
  ).min(1, 'Pelo menos 1 partida é necessária')
})
.refine(
  (data) => {
    // Global validation: no player in multiple teams
    const allPlayerIds: string[] = [];
    data.teams.forEach(team => {
      allPlayerIds.push(...team.players);
    });

    return new Set(allPlayerIds).size === allPlayerIds.length;
  },
  {
    message: 'Jogadores não podem estar em múltiplos times simultaneamente',
    path: ['teams']
  }
);
```

---

## 6. Indicadores Visuais de Progresso

### 6.1 Progress Bar da Partida

```typescript
const MatchCompletionProgress = ({ matchIndex, control }) => {
  const homeTeamId = useWatch({ control, name: `matches.${matchIndex}.homeTeamId` });
  const awayTeamId = useWatch({ control, name: `matches.${matchIndex}.awayTeamId` });
  const homeScore = useWatch({ control, name: `matches.${matchIndex}.homeGoals.goalsCount` });
  const awayScore = useWatch({ control, name: `matches.${matchIndex}.awayGoals.goalsCount` });
  const homeGoalScorers = useWatch({ control, name: `matches.${matchIndex}.homeGoals.whoScores` });
  const awayGoalScorers = useWatch({ control, name: `matches.${matchIndex}.awayGoals.whoScores` });

  const steps = [
    { label: 'Times', complete: homeTeamId && awayTeamId },
    { label: 'Placar', complete: homeScore !== '' && awayScore !== '' },
    {
      label: 'Gols',
      complete: (
        (parseInt(homeScore || '0') === 0 || homeGoalScorers?.every(g => g?.playerId)) &&
        (parseInt(awayScore || '0') === 0 || awayGoalScorers?.every(g => g?.playerId))
      )
    }
  ];

  const completedSteps = steps.filter(s => s.complete).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Progresso</span>
        <span className="font-medium">{completedSteps}/{steps.length} completo</span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            progress === 100 ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((step, idx) => (
          <Badge
            key={idx}
            variant={step.complete ? 'success' : 'secondary'}
            className="gap-1"
          >
            {step.complete && <CheckCircle2 className="w-3 h-3" />}
            {step.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
```

### 6.2 Contador de Partidas Válidas

```typescript
const WeekValidationSummary = ({ control, teams }) => {
  const matches = useWatch({ control, name: 'matches' });

  const validation = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    let incomplete = 0;

    matches?.forEach(match => {
      const hasTeams = match.homeTeamId && match.awayTeamId;
      const hasScores = match.homeGoals?.goalsCount !== '' && match.awayGoals?.goalsCount !== '';

      const homeGoalsCount = parseInt(match.homeGoals?.goalsCount || '0');
      const awayGoalsCount = parseInt(match.awayGoals?.goalsCount || '0');

      const homeGoalsValid = homeGoalsCount === 0 ||
        match.homeGoals?.whoScores?.every(g => g?.playerId);
      const awayGoalsValid = awayGoalsCount === 0 ||
        match.awayGoals?.whoScores?.every(g => g?.playerId);

      if (!hasTeams || !hasScores) {
        incomplete++;
      } else if (homeGoalsValid && awayGoalsValid) {
        valid++;
      } else {
        invalid++;
      }
    });

    return { valid, invalid, incomplete, total: matches?.length || 0 };
  }, [matches]);

  return (
    <Card className="p-4 bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold">Resumo das Partidas</h3>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Badge variant="success">{validation.valid}</Badge>
              <span className="text-muted-foreground">Válidas</span>
            </div>
            {validation.invalid > 0 && (
              <div className="flex items-center gap-1">
                <Badge variant="destructive">{validation.invalid}</Badge>
                <span className="text-muted-foreground">Inválidas</span>
              </div>
            )}
            {validation.incomplete > 0 && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary">{validation.incomplete}</Badge>
                <span className="text-muted-foreground">Incompletas</span>
              </div>
            )}
          </div>
        </div>

        {validation.valid === validation.total && validation.total > 0 && (
          <Badge variant="success" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Tudo pronto!
          </Badge>
        )}
      </div>
    </Card>
  );
};
```

---

## 7. Implementação: Componente GoalEntry Completo

```typescript
import { useMemo } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import SelectWithSearch from '@/components/SelectWithSearch';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalEntryProps {
  matchIndex: number;
  side: 'home' | 'away';
  goalIndex: number;
  control: Control<CreateMatchForm>;
  teamPlayers: PlayerResponse[];
  opposingTeamPlayers: PlayerResponse[];
  teamScore: string;
}

export const GoalEntry = ({
  matchIndex,
  side,
  goalIndex,
  control,
  teamPlayers,
  opposingTeamPlayers,
  teamScore
}: GoalEntryProps) => {
  // Watch all goal scorers to calculate remaining
  const allGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`
  });

  const currentGoal = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}`
  });

  const isOwnGoal = currentGoal?.playerId === 'GC';

  // Calculate remaining goals
  const { remainingGoals, totalAllocated } = useMemo(() => {
    const expectedScore = parseInt(teamScore || '0');
    const allocated = allGoalScorers?.reduce((sum, scorer, idx) => {
      if (idx !== goalIndex && scorer?.playerId !== 'GC') {
        return sum + (scorer?.goals || 0);
      }
      return sum;
    }, 0) || 0;

    return {
      totalAllocated: allocated,
      remainingGoals: expectedScore - allocated
    };
  }, [allGoalScorers, goalIndex, teamScore]);

  // Dynamic goal count options (max = remaining + current)
  const goalCountOptions = useMemo(() => {
    const currentGoals = currentGoal?.goals || 0;
    const maxAvailable = remainingGoals + currentGoals;

    return Array.from(
      { length: Math.min(maxAvailable + 1, 11) },
      (_, i) => ({ label: i.toString(), value: i })
    );
  }, [remainingGoals, currentGoal]);

  // Available players (excluding already selected)
  const playerOptions = useMemo(() => {
    const selectedIds = new Set(
      allGoalScorers
        ?.filter((s, idx) => idx !== goalIndex && s?.playerId !== 'GC')
        .map(s => s?.playerId)
        .filter(Boolean)
    );

    const available = teamPlayers
      .filter(p => !selectedIds.has(p.id))
      .map(p => ({ label: p.name, value: p.id }));

    return [
      { label: 'GC (Gol Contra)', value: 'GC' },
      ...available
    ];
  }, [allGoalScorers, goalIndex, teamPlayers]);

  // Own goal player options
  const ownGoalPlayerOptions = useMemo(() => {
    return opposingTeamPlayers.map(p => ({ label: p.name, value: p.id }));
  }, [opposingTeamPlayers]);

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Gol {goalIndex + 1}</Label>
        {remainingGoals >= 0 && (
          <Badge variant="secondary" className="text-xs">
            Disponível: {remainingGoals}
          </Badge>
        )}
      </div>

      {/* Player and Goal Count */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`match-${matchIndex}-${side}-goal-${goalIndex}-player`} className="text-xs">
            Jogador
          </Label>
          <Controller
            control={control}
            name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.playerId`}
            render={({ field }) => (
              <SelectWithSearch
                id={`match-${matchIndex}-${side}-goal-${goalIndex}-player`}
                options={playerOptions}
                value={playerOptions.find(opt => opt.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
                placeholder="Selecionar..."
              />
            )}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`match-${matchIndex}-${side}-goal-${goalIndex}-count`} className="text-xs">
            Qtd Gols
          </Label>
          <Controller
            control={control}
            name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.goals`}
            render={({ field }) => (
              <SelectWithSearch
                id={`match-${matchIndex}-${side}-goal-${goalIndex}-count`}
                options={goalCountOptions}
                value={goalCountOptions.find(opt => opt.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
                placeholder="0"
                isDisabled={goalCountOptions.length === 0}
              />
            )}
          />
        </div>
      </div>

      {/* Own Goal Conditional */}
      {isOwnGoal && (
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Badge variant="ownGoal" size="sm">GC</Badge>
            Jogador do time adversário
          </Label>
          <Controller
            control={control}
            name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.ownGoalPlayerId`}
            render={({ field }) => (
              <SelectWithSearch
                options={ownGoalPlayerOptions}
                value={ownGoalPlayerOptions.find(opt => opt.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
                placeholder="Quem fez o gol contra?"
              />
            )}
          />
        </div>
      )}

      {/* Assist (only if not own goal) */}
      {!isOwnGoal && currentGoal?.playerId && (
        <AssistEntry
          matchIndex={matchIndex}
          side={side}
          goalIndex={goalIndex}
          control={control}
          teamPlayers={teamPlayers}
          goalScorerId={currentGoal.playerId}
        />
      )}

      {/* Validation Warnings */}
      {remainingGoals < 0 && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>Gols excedem o placar total</span>
        </div>
      )}
    </div>
  );
};

// Assist sub-component
const AssistEntry = ({ matchIndex, side, goalIndex, control, teamPlayers, goalScorerId }) => {
  const assistOptions = useMemo(() => {
    return teamPlayers
      .filter(p => p.id !== goalScorerId)
      .map(p => ({ label: p.name, value: p.id }));
  }, [teamPlayers, goalScorerId]);

  return (
    <div className="space-y-1 pt-2 border-t border-border">
      <Label className="text-xs text-muted-foreground">Assistência (opcional)</Label>
      <Controller
        control={control}
        name={`matches.${matchIndex}.${side}Assists.${goalIndex}.playerId`}
        render={({ field }) => (
          <SelectWithSearch
            options={assistOptions}
            value={assistOptions.find(opt => opt.value === field.value)}
            onChange={(opt) => {
              field.onChange(opt?.value);
              // Auto-set assists count to 1
              if (opt?.value) {
                setValue(
                  `matches.${matchIndex}.${side}Assists.${goalIndex}.assists`,
                  1
                );
              } else {
                setValue(
                  `matches.${matchIndex}.${side}Assists.${goalIndex}.assists`,
                  0
                );
              }
            }}
            placeholder="Quem assistiu?"
            isClearable
          />
        )}
      />
    </div>
  );
};
```

---

## Resumo das Melhorias

### ✅ Validações Adicionadas

1. **Limitação dinâmica de gols** - Opções de gols ajustadas conforme gols já distribuídos
2. **Validação em tempo real** - Feedback visual imediato (badges, cores)
3. **Jogadores únicos** - Mesmo jogador não aparece em múltiplas entradas
4. **Assistente ≠ Artilheiro** - Validação que impede auto-assistência
5. **Soma de gols = Placar** - Validação Zod garantindo consistência
6. **Sem gols contra assistidos** - GC não tem campo de assistência

### 🚀 Melhorias de UX

1. **Auto-expansão** - Detalhes de gols aparecem quando placar > 0
2. **Geração automática de campos** - Cria/remove campos baseado no placar
3. **Distribuição inteligente** - Botão para distribuir gols automaticamente
4. **Preview do placar** - Visualização em tempo real do resultado
5. **Resumo da partida** - Lista de artilheiros e assistentes
6. **Quick actions** - Atalhos para empates comuns (0×0, 1×1, etc.)
7. **Progress bar** - Indicador visual de completude da partida
8. **Contador de partidas** - Resumo de partidas válidas/inválidas

### 📊 Indicadores Visuais

- Badge "Disponível: X gols"
- Badge "Todos os gols distribuídos" (verde)
- Badge "X gols a mais" (vermelho, pulsando)
- Progress bar de completude
- Placar com destaque para vencedor
- Badges coloridos (gol, assistência, gol contra)

Essas melhorias tornam o fluxo muito mais intuitivo e à prova de erros!
