'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerMultiSelect } from '@/components/PlayerMultiSelect';
import { TeamBuilderProps } from './TeamBuilder.types';
import { SelectOption } from '@/types/components';
import { Users, Award } from 'lucide-react';

export const TeamBuilder: React.FC<TeamBuilderProps> = ({
  teamIndex,
  selectedPlayerIds,
  availablePlayers,
  onPlayersChange,
  error,
  label,
}) => {
  // Convert available players to SelectOption format
  const playerOptions = useMemo<SelectOption[]>(() => {
    return availablePlayers.map((player) => ({
      label: player.name,
      value: player.id,
      meta: {
        overall: player.overall,
        position: player.position,
        country: player.country,
      },
    }));
  }, [availablePlayers]);

  // Get currently selected options
  const selectedOptions = useMemo<SelectOption[]>(() => {
    return selectedPlayerIds
      .map((id) => playerOptions.find((opt) => opt.value === id))
      .filter((opt): opt is SelectOption => opt !== undefined);
  }, [selectedPlayerIds, playerOptions]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    const players = availablePlayers.filter((p) => selectedPlayerIds.includes(p.id));

    if (players.length === 0) {
      return { count: 0, avgOverall: 0 };
    }

    const totalOverall = players.reduce((sum, player) => {
      const overall =
        typeof player.overall === 'string'
          ? JSON.parse(player.overall).overall
          : player.overall.overall;
      return sum + (overall || 0);
    }, 0);

    return {
      count: players.length,
      avgOverall: Math.round(totalOverall / players.length),
    };
  }, [availablePlayers, selectedPlayerIds]);

  const handleChange = (selected: SelectOption[]) => {
    onPlayersChange(selected.map((opt) => opt.value));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {label || `Time ${teamIndex + 1}`}
          </span>
          {teamStats.count > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {teamStats.count} jogadores
              </Badge>
              <Badge variant="default" className="gap-1">
                <Award className="w-3 h-3" />
                Overall {teamStats.avgOverall}
              </Badge>
            </div>
          )}
        </CardTitle>
        <CardDescription>Selecione os jogadores que farão parte deste time</CardDescription>
      </CardHeader>
      <CardContent>
        <PlayerMultiSelect
          options={playerOptions}
          value={selectedOptions}
          onChange={handleChange}
          placeholder="Buscar e selecionar jogadores..."
          error={error}
          isSearchable
          isClearable
        />
      </CardContent>
    </Card>
  );
};
