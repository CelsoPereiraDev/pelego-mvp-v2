'use client';

import { useEffect, useMemo } from 'react';
import { Control, UseFormSetValue, useFieldArray, useWatch } from 'react-hook-form';
import { GoalEntry } from '@/components/GoalEntry';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface GoalDetailsPanelProps {
  matchIndex: number;
  side: 'home' | 'away';
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teamPlayers: PlayerResponse[];
  opposingTeamPlayers: PlayerResponse[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GoalDetailsPanel = ({
  matchIndex,
  side,
  control,
  setValue,
  teamPlayers,
  opposingTeamPlayers,
  isOpen = false,
  onOpenChange,
}: GoalDetailsPanelProps) => {
  // Get the score for this side
  const teamScore = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.goalsCount`,
  });

  // Field array for goal scorers
  const { fields, append, remove } = useFieldArray({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`,
  });

  // Field array for assists
  const { fields: assistFields, append: appendAssist, remove: removeAssist } = useFieldArray({
    control,
    name: `matches.${matchIndex}.${side}Assists`,
  });

  // Watch all goal scorers to calculate validation status
  const allGoalScorers = useWatch({
    control,
    name: `matches.${matchIndex}.${side}Goals.whoScores`,
  });

  // Calculate validation state
  const validationState = useMemo(() => {
    const expectedScore = parseInt(teamScore || '0');

    if (expectedScore === 0) {
      return { status: 'empty', message: 'Sem gols', allocated: 0 };
    }

    if (!allGoalScorers || allGoalScorers.length === 0) {
      return { status: 'incomplete', message: 'Adicione os goleadores', allocated: 0 };
    }

    // Calculate total allocated (excluding own goals, they count for opponent)
    const allocated = allGoalScorers.reduce((sum, scorer) => {
      if (scorer?.playerId && scorer.playerId !== 'GC') {
        return sum + (scorer.goals || 0);
      }
      return sum;
    }, 0);

    // Calculate own goals from opposing side (these count for this team)
    const ownGoalsReceived = allGoalScorers.reduce((sum, scorer) => {
      if (scorer?.playerId === 'GC' && scorer.ownGoalPlayerId) {
        return sum + (scorer.goals || 0);
      }
      return sum;
    }, 0);

    const total = allocated + ownGoalsReceived;

    if (total < expectedScore) {
      return {
        status: 'incomplete',
        message: `Faltam ${expectedScore - total} gols`,
        allocated: total,
      };
    }

    if (total > expectedScore) {
      return {
        status: 'invalid',
        message: `Excesso de ${total - expectedScore} gols`,
        allocated: total,
      };
    }

    // Check if all entries have player selected
    const hasEmptyEntries = allGoalScorers.some((scorer) => !scorer?.playerId);
    if (hasEmptyEntries) {
      return {
        status: 'incomplete',
        message: 'Selecione todos os jogadores',
        allocated: total,
      };
    }

    return { status: 'valid', message: 'Completo', allocated: total };
  }, [allGoalScorers, teamScore]);

  // Auto-create/remove fields based on score changes
  useEffect(() => {
    const expectedScore = parseInt(teamScore || '0');
    const currentFieldsCount = fields.length;

    if (expectedScore > currentFieldsCount) {
      // Add missing fields
      const toAdd = expectedScore - currentFieldsCount;
      for (let i = 0; i < toAdd; i++) {
        append({ goals: 0, playerId: '', ownGoalPlayerId: '' });
        appendAssist({ assists: 0, playerId: '' });
      }
    } else if (expectedScore < currentFieldsCount && expectedScore >= 0) {
      // Remove excess fields
      const toRemove = currentFieldsCount - expectedScore;
      for (let i = 0; i < toRemove; i++) {
        remove(currentFieldsCount - 1 - i);
        removeAssist(currentFieldsCount - 1 - i);
      }
    }
  }, [teamScore, fields.length, append, remove, appendAssist, removeAssist]);

  const scoreNum = parseInt(teamScore || '0');

  if (scoreNum === 0) {
    return null;
  }

  const StatusBadge = () => {
    switch (validationState.status) {
      case 'valid':
        return (
          <Badge variant="goal" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {validationState.message}
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="destructive" className="gap-1 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            {validationState.message}
          </Badge>
        );
      case 'incomplete':
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {validationState.message}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-accent transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Detalhes dos Gols</span>
          <StatusBadge />
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3 space-y-3">
        <Separator />

        {fields.map((field, index) => (
          <GoalEntry
            key={field.id}
            matchIndex={matchIndex}
            side={side}
            goalIndex={index}
            control={control}
            setValue={setValue}
            teamPlayers={teamPlayers}
            opposingTeamPlayers={opposingTeamPlayers}
            teamScore={teamScore}
          />
        ))}

        {/* Summary validation message */}
        {validationState.status !== 'empty' && (
          <div
            className={cn(
              'flex items-center gap-2 p-2 rounded-md text-xs',
              validationState.status === 'valid' && 'bg-goal-indicator/10 text-goal-indicator',
              validationState.status === 'invalid' && 'bg-destructive/10 text-destructive',
              validationState.status === 'incomplete' && 'bg-muted text-muted-foreground'
            )}
          >
            {validationState.status === 'valid' && <CheckCircle2 className="w-4 h-4" />}
            {validationState.status === 'invalid' && <AlertCircle className="w-4 h-4" />}
            {validationState.status === 'incomplete' && <AlertTriangle className="w-4 h-4" />}
            <span>
              {validationState.allocated} de {teamScore} gols distribuídos •{' '}
              {validationState.message}
            </span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
