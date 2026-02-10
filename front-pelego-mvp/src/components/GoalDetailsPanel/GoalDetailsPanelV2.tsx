'use client';

import { useEffect, useMemo } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { GoalEntryV2 } from '@/components/GoalEntry/GoalEntryV2';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoalDetailsPanelProps } from './GoalDetailsPanel.types';

export const GoalDetailsPanelV2: React.FC<GoalDetailsPanelProps> = ({
  matchIndex,
  side,
  teamName,
  control,
  setValue,
  teamPlayers,
  opposingTeamPlayers,
  isOpen = false,
  onOpenChange,
}) => {
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

  // Calculate validation state (simpler - each field = 1 goal)
  const validationState = useMemo(() => {
    const expectedScore = parseInt(teamScore || '0');

    if (expectedScore === 0) {
      return { status: 'empty', message: 'Sem gols' };
    }

    if (!allGoalScorers || allGoalScorers.length === 0) {
      return { status: 'incomplete', message: 'Adicione os goleadores' };
    }

    // Check if all entries have player selected
    const completedCount = allGoalScorers.filter((scorer) => scorer?.playerId).length;

    if (completedCount < expectedScore) {
      return {
        status: 'incomplete',
        message: `${completedCount} de ${expectedScore} gols preenchidos`,
      };
    }

    return { status: 'valid', message: 'Completo' };
  }, [allGoalScorers, teamScore]);

  // Auto-create/remove fields based on score changes
  useEffect(() => {
    const expectedScore = parseInt(teamScore || '0');
    const currentFieldsCount = fields.length;

    if (expectedScore > currentFieldsCount) {
      // Add missing fields
      const toAdd = expectedScore - currentFieldsCount;
      for (let i = 0; i < toAdd; i++) {
        append({ goals: 1, playerId: '', ownGoalPlayerId: '' }); // Start with 1 goal, not 0
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
          {/* Updated header with team name */}
          <span className="text-sm font-medium">Detalhes dos Gols do {teamName}</span>
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
          <GoalEntryV2
            key={field.id}
            matchIndex={matchIndex}
            side={side}
            goalIndex={index}
            teamName={teamName}
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
              validationState.status === 'incomplete' && 'bg-muted text-muted-foreground'
            )}
          >
            {validationState.status === 'valid' && <CheckCircle2 className="w-4 h-4" />}
            {validationState.status === 'incomplete' && <AlertTriangle className="w-4 h-4" />}
            <span>{validationState.message}</span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
