'use client';

import { useMemo } from 'react';
import { Control, Controller, useWatch, UseFormSetValue } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import SelectWithSearch from '@/components/SelectWithSearch';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { PlayerResponse } from '@/types/player';

interface CreateMatchForm {
  date: string;
  teams: {
    players: string[];
  }[];
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: {
      goalsCount: string;
      whoScores?: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    homeAssists?: {
      assists: number;
      playerId: string;
    }[];
    awayGoals: {
      goalsCount: string;
      whoScores?: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    awayAssists?: {
      assists: number;
      playerId: string;
    }[];
  }[];
}

interface GoalEntryProps {
  matchIndex: number;
  side: 'home' | 'away';
  goalIndex: number;
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teamPlayers: PlayerResponse[];
  opposingTeamPlayers: PlayerResponse[];
  teamScore: string;
}

export const GoalEntry = ({
  matchIndex,
  side,
  goalIndex,
  control,
  setValue,
  teamPlayers,
  opposingTeamPlayers,
  teamScore,
}: GoalEntryProps) => {
  // Watch all goal scorers to calculate remaining
  const allGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`,
  });

  const currentGoal = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}`,
  });

  const isOwnGoal = currentGoal?.playerId === 'GC';

  // Calculate remaining goals available for distribution
  const { remainingGoals, totalAllocated, isOverAllocated } = useMemo(() => {
    const expectedScore = parseInt(teamScore || '0');
    const allocated =
      allGoalScorers?.reduce((sum, scorer, idx) => {
        if (idx !== goalIndex && scorer?.playerId !== 'GC') {
          return sum + (scorer?.goals || 0);
        }
        return sum;
      }, 0) || 0;

    const remaining = expectedScore - allocated;

    return {
      totalAllocated: allocated,
      remainingGoals: remaining,
      isOverAllocated: remaining < 0,
    };
  }, [allGoalScorers, goalIndex, teamScore]);

  // Dynamic goal count options (max = remaining + current goal value)
  const goalCountOptions = useMemo(() => {
    const currentGoals = currentGoal?.goals || 0;
    const maxAvailable = remainingGoals + currentGoals;

    if (maxAvailable <= 0) {
      return [{ label: '0', value: 0 }];
    }

    return Array.from({ length: Math.min(maxAvailable + 1, 11) }, (_, i) => ({
      label: i.toString(),
      value: i,
    }));
  }, [remainingGoals, currentGoal]);

  // Available players (excluding already selected in other entries)
  const playerOptions = useMemo(() => {
    const selectedIds = new Set(
      allGoalScorers
        ?.filter((s, idx) => idx !== goalIndex && s?.playerId !== 'GC')
        .map((s) => s?.playerId)
        .filter(Boolean)
    );

    const available = teamPlayers
      .filter((p) => !selectedIds.has(p.id))
      .map((p) => ({ label: p.name, value: p.id }));

    return [{ label: 'GC (Gol Contra)', value: 'GC' }, ...available];
  }, [allGoalScorers, goalIndex, teamPlayers]);

  // Own goal player options (from opposing team)
  const ownGoalPlayerOptions = useMemo(() => {
    return opposingTeamPlayers.map((p) => ({ label: p.name, value: p.id }));
  }, [opposingTeamPlayers]);

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Gol {goalIndex + 1}</Label>
        <div className="flex items-center gap-2">
          {remainingGoals > 0 && (
            <Badge variant="secondary" className="text-xs">
              Disponível: {remainingGoals}
            </Badge>
          )}
          {remainingGoals === 0 && totalAllocated > 0 && (
            <Badge variant="goal" className="text-xs gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completo
            </Badge>
          )}
          {isOverAllocated && (
            <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              Excedido
            </Badge>
          )}
        </div>
      </div>

      {/* Player Selection and Goal Count */}
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
                value={playerOptions.find((opt) => opt.value === field.value) || null}
                onChange={(opt: { value: string } | null) => field.onChange(opt?.value || '')}
                placeholder="Selecionar..."
              />
            )}
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`match-${matchIndex}-${side}-goal-${goalIndex}-count`}
            className="text-xs"
          >
            Qtd Gols
          </Label>
          <Controller
            control={control}
            name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.goals`}
            render={({ field }) => (
              <SelectWithSearch
                id={`match-${matchIndex}-${side}-goal-${goalIndex}-count`}
                options={goalCountOptions}
                value={goalCountOptions.find((opt) => opt.value === field.value) || null}
                onChange={(opt: { value: number } | null) => field.onChange(opt?.value ?? 0)}
                placeholder="0"
                isDisabled={goalCountOptions.length === 1}
              />
            )}
          />
        </div>
      </div>

      {/* Own Goal Conditional Field */}
      {isOwnGoal && (
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Badge variant="ownGoal" size="sm">
              GC
            </Badge>
            Jogador do time adversário
          </Label>
          <Controller
            control={control}
            name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.ownGoalPlayerId`}
            render={({ field }) => (
              <SelectWithSearch
                options={ownGoalPlayerOptions}
                value={ownGoalPlayerOptions.find((opt) => opt.value === field.value) || null}
                onChange={(opt: { value: string } | null) => field.onChange(opt?.value || '')}
                placeholder="Quem fez o gol contra?"
              />
            )}
          />
        </div>
      )}

      {/* Assist Entry (only if not own goal and player selected) */}
      {!isOwnGoal && currentGoal?.playerId && (
        <AssistEntry
          matchIndex={matchIndex}
          side={side}
          goalIndex={goalIndex}
          control={control}
          setValue={setValue}
          teamPlayers={teamPlayers}
          goalScorerId={currentGoal.playerId}
        />
      )}

      {/* Validation Warnings */}
      {isOverAllocated && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>Gols excedem o placar total</span>
        </div>
      )}
    </div>
  );
};

// Assist sub-component
interface AssistEntryProps {
  matchIndex: number;
  side: 'home' | 'away';
  goalIndex: number;
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teamPlayers: PlayerResponse[];
  goalScorerId: string;
}

const AssistEntry = ({
  matchIndex,
  side,
  goalIndex,
  control,
  setValue,
  teamPlayers,
  goalScorerId,
}: AssistEntryProps) => {
  // Filter out the goal scorer from assist options
  const assistOptions = useMemo(() => {
    return teamPlayers
      .filter((p) => p.id !== goalScorerId)
      .map((p) => ({ label: p.name, value: p.id }));
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
            value={assistOptions.find((opt) => opt.value === field.value) || null}
            onChange={(opt: { value: string } | null) => {
              field.onChange(opt?.value || '');
              setValue(
                `matches.${matchIndex}.${side}Assists.${goalIndex}.assists`,
                opt?.value ? 1 : 0
              );
            }}
            placeholder="Quem assistiu?"
            isClearable
          />
        )}
      />
    </div>
  );
};
