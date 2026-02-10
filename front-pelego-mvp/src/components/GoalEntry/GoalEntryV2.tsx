'use client';

import { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PlayerSelect } from '@/components/PlayerSelect';
import { CheckCircle2 } from 'lucide-react';
import { GoalEntryProps, AssistEntryProps } from './GoalEntry.types';
import { SelectOption } from '@/types/components';
import { getOrdinalGoalLabel } from '@/utils/ordinalNumbers';

export const GoalEntryV2: React.FC<GoalEntryProps> = ({
  matchIndex,
  side,
  goalIndex,
  teamName,
  control,
  setValue,
  teamPlayers,
  opposingTeamPlayers,
  teamScore,
}) => {
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

  // Available players (can repeat - same player can score multiple goals)
  const playerOptions = useMemo<SelectOption[]>(() => {
    const available = teamPlayers.map((p) => ({ label: p.name, value: p.id }));
    return [{ label: 'GC (Gol Contra)', value: 'GC' }, ...available];
  }, [teamPlayers]);

  // Own goal player options (from opposing team)
  const ownGoalPlayerOptions = useMemo<SelectOption[]>(() => {
    return opposingTeamPlayers.map((p) => ({ label: p.name, value: p.id }));
  }, [opposingTeamPlayers]);

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        {/* Updated label with ordinal and team name */}
        <Label className="text-sm font-medium">
          {getOrdinalGoalLabel(goalIndex, teamName)}
        </Label>
        {currentGoal?.playerId && (
          <Badge variant="goal" className="text-xs gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completo
          </Badge>
        )}
      </div>

      {/* Player Selection */}
      <div className="space-y-1">
        <Label htmlFor={`match-${matchIndex}-${side}-goal-${goalIndex}-player`} className="text-xs">
          Jogador
        </Label>
        <Controller
          control={control}
          name={`matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.playerId`}
          render={({ field }) => (
            <PlayerSelect
              options={playerOptions}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                // Always set goals to 1 (each entry = 1 goal)
                setValue(
                  `matches.${matchIndex}.${side}Goals.whoScores.${goalIndex}.goals`,
                  1
                );
              }}
              placeholder="Selecionar..."
            />
          )}
        />
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
              <PlayerSelect
                options={ownGoalPlayerOptions}
                value={field.value}
                onChange={field.onChange}
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
    </div>
  );
};

// Assist sub-component
const AssistEntry: React.FC<AssistEntryProps> = ({
  matchIndex,
  side,
  goalIndex,
  control,
  setValue,
  teamPlayers,
  goalScorerId,
}) => {
  // Filter out the goal scorer from assist options
  const assistOptions = useMemo<SelectOption[]>(() => {
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
          <PlayerSelect
            options={assistOptions}
            value={field.value}
            onChange={(newValue) => {
              field.onChange(newValue);
              // Auto-set assists count to 1 when player selected, 0 when cleared
              setValue(
                `matches.${matchIndex}.${side}Assists.${goalIndex}.assists`,
                newValue ? 1 : 0
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
