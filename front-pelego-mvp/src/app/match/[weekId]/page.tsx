'use client';

import { DatePicker } from '@/components/DatePicker';
import { MatchForm } from '@/components/MatchForm';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { mapFormDataToBackend } from '@/mapper/createMatches';
import { mapWeekToFormValues } from '@/mapper/defaultValueMatches';

import { CreateMatchSchema } from '@/schema/match';
import { useCreateMatches } from '@/services/matchs/useCreateMatch';

import { useCreateWeekWithTeams } from '@/services/matchs/useCreateWeekWithTeams';
import { usePlayers } from '@/services/player/usePlayers';
import { useTeams } from '@/services/teams/useTeams';
import { useWeek } from '@/services/weeks/useWeek';
import { CreateMatchForm } from '@/types/forms';
import { Player } from '@/types/player';
import { zodResolver } from '@hookform/resolvers/zod';

import { useToast } from '@/hooks/use-toast';
import { Save } from '@mui/icons-material';

import { CalendarDays, ClipboardList, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form';
import Select from 'react-select';

const getAvailablePlayers = (allPlayers: Player[], selectedPlayers: string[]) => {
  return allPlayers.filter((player) => !selectedPlayers.includes(player.id));
};

const CreateWeekAndMatchesForm: React.FC = () => {
  const { toast } = useToast();
  const params = useParams();
  const paramWeekId = params.weekId;

  const { week } = useWeek(paramWeekId as string);

  const defaultValues = useMemo(() => {
    return week
      ? mapWeekToFormValues(week, players || [])
      : {
          date: '',
          teams: [{ players: [] }, { players: [] }],
          matches: [],
        };
  }, [week]);

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateMatchForm>({
    resolver: zodResolver(CreateMatchSchema),
    defaultValues,
  });
  useEffect(() => {
    if (week) {
      const mappedValues = mapWeekToFormValues(week, players || []);
      reset(mappedValues);
    }
  }, [week, reset]);

  const [createdTeams, setCreatedTeams] = useState<
    {
      players: string[];
      id: string;
    }[]
  >([]);
  const [weekId, setWeekId] = useState<string | null>(null);

  const selectedPlayers = useWatch({ control, name: 'teams' }).flatMap(
    (team: { players: string[] }) => team.players,
  );
  const { players, isLoading } = usePlayers();
  const {
    fields: teamFields,
    append: appendTeam,
    update: updateTeam,
  } = useFieldArray({
    control,
    name: 'teams',
  });
  const {
    fields: matchFields,
    append: appendMatch,
    remove: removeMatch,
  } = useFieldArray({
    control,
    name: 'matches',
  });

  const { createWeek } = useCreateWeekWithTeams();
  const { createNewMatches } = useCreateMatches();
  const { update } = useTeams();

  const handleCreateTeams: SubmitHandler<CreateMatchForm> = async (data) => {
    try {
      const weekData = {
        date: data.date,
        teams: data.teams.map((team) => team.players),
      };

      const result = await createWeek(weekData);

      if (!result.createdTeams || result.createdTeams.length === 0) {
        throw new Error('No teams were created');
      }

      setCreatedTeams(result.createdTeams);
      setWeekId(result.week.id);

      toast({
        title: 'Times criados com sucesso!',
        description: 'Agora voce pode criar as partidas.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar os times',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    }
  };

  const handleCreateMatches: SubmitHandler<CreateMatchForm> = async (data) => {
    try {
      if (!weekId) {
        throw new Error('Week ID must be set before creating matches.');
      }

      const { matchesData } = mapFormDataToBackend(data, createdTeams, weekId);
      const createdMatchesResponse = await createNewMatches({ matches: matchesData });

      const createdMatches = createdMatchesResponse.createdMatches as {
        homeTeamId: string;
        awayTeamId: string;
        result?: { homeGoals: number; awayGoals: number };
      }[];
      if (!Array.isArray(createdMatches)) {
        throw new Error('Expected createdMatches to be an array');
      }

      const teamPoints: Record<string, number> = {};

      createdMatches.forEach((match) => {
        const { homeTeamId, awayTeamId, result } = match;

        if (!teamPoints[homeTeamId]) {
          teamPoints[homeTeamId] = 0;
        }
        if (!teamPoints[awayTeamId]) {
          teamPoints[awayTeamId] = 0;
        }

        const homeGoals = result?.homeGoals || 0;
        const awayGoals = result?.awayGoals || 0;

        if (homeGoals > awayGoals) {
          teamPoints[homeTeamId] += 3; // Vitória do time da casa
        } else if (homeGoals < awayGoals) {
          teamPoints[awayTeamId] += 3; // Vitória do time visitante
        } else {
          teamPoints[homeTeamId] += 1; // Empate
          teamPoints[awayTeamId] += 1; // Empate
        }
      });

      const pointsArray = Object.values(teamPoints);
      const maxPoints = Math.max(...pointsArray);
      const championTeams = Object.keys(teamPoints).filter(
        (team) => teamPoints[team] === maxPoints,
      );

      const updatedTeams = createdTeams.map((team) => ({
        id: team.id,
        champion: championTeams.length === 1 && team.id === championTeams[0],
        points: teamPoints[team.id] || 0,
        players: team.players.map((playerId) => ({
          id: playerId,
          isChampion: championTeams.length === 1 && team.id === championTeams[0],
        })),
      }));

      await update(updatedTeams as unknown as import('@/types/match').TeamResponse[]);

      toast({ title: 'Partidas criadas!', description: 'Campeoes da semana foram definidos.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar as partidas',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    }
  };

  const handleAddTeam = () => {
    appendTeam({ players: [] });
  };

  const handleAddMatch = () => {
    appendMatch({
      homeTeamId: '',
      homeGoals: { goalsCount: '', whoScores: [] },
      homeAssists: [],
      awayGoals: { goalsCount: '', whoScores: [] },
      awayAssists: [],
      awayTeamId: '',
    });
  };

  const availablePlayers = useMemo(() => {
    return players ? getAvailablePlayers(players, selectedPlayers) : [];
  }, [players, selectedPlayers]);

  if (isLoading) return <div>Loading players...</div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center p-8 gap-8">
      <div className="max-w-[1440px] p-6 bg-[hsl(var(--card))] rounded-lg w-full text-[hsl(var(--foreground))] flex flex-col gap-6">
        <form onSubmit={handleSubmit(handleCreateTeams)}>
          <div className="flex flex-col gap-4">
            <Label className="text-[hsl(var(--foreground))]">Data</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => {
                const dateValue = field.value ? new Date(field.value) : undefined;

                return (
                  <DatePicker
                    date={dateValue}
                    onDateChange={(date) => field.onChange(date ? date.toISOString() : '')}
                  />
                );
              }}
            />
            {errors.date && (
              <span className="text-[hsl(var(--destructive))]">Este campo é obrigatório</span>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <Label className="text-[hsl(var(--foreground))]">Times</Label>
            <div className="flex flex-wrap gap-4 mt-4">
              {teamFields.map((team, index) => (
                <div key={team.id} className="flex flex-col gap-2">
                  <h3>Time {index + 1}</h3>
                  <Controller
                    control={control}
                    name={`teams.${index}.players`}
                    render={({ field }) => (
                      <Select
                        isMulti
                        options={availablePlayers.map((player) => ({
                          label: player.name,
                          value: player.id,
                        }))}
                        value={field.value
                          .map((playerId) => players?.find((player) => player.id === playerId))
                          .filter(Boolean)
                          .map((player) => ({ label: player?.name, value: player?.id }))}
                        onChange={(selectedOptions) => {
                          const selectedPlayerIds = selectedOptions
                            .map((option) => option.value)
                            .filter(Boolean) as string[];
                          field.onChange(selectedPlayerIds);
                          updateTeam(index, { players: selectedPlayerIds });
                        }}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Button size="lg" onClick={handleAddTeam} className="flex gap-2 items-center">
              <Users className="w-4 h-4" /> Adicionar Time
            </Button>
            <Button variant="outline" size="lg" type="submit" className="flex gap-2 items-center">
              <ClipboardList className="w-4 h-4" /> Cadastrar Times
            </Button>
          </div>
        </form>

        <form onSubmit={handleSubmit(handleCreateMatches)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 mt-8">
            {matchFields.map((match, index) => (
              <MatchForm
                key={match.id}
                index={index}
                control={control}
                teamFields={teamFields}
                players={players}
                removeMatch={removeMatch}
              />
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <Button
              variant="default"
              size="lg"
              onClick={handleAddMatch}
              className="flex gap-2 items-center">
              <CalendarDays className="w-4 h-4" /> Adicionar Partida
            </Button>
            <Button variant="outline" size="lg" type="submit" className="flex gap-2 items-center">
              <Save className="w-4 h-4" /> Cadastrar Partidas
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWeekAndMatchesForm;
