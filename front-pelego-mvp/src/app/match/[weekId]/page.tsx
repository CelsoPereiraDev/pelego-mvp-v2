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
import { Player } from '@/types/player';
import { zodResolver } from '@hookform/resolvers/zod';

import { Save } from '@mui/icons-material';

import { CalendarDays, ClipboardList, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form';
import Select from 'react-select';

export type CreateMatch = {
  date: string;
  teams: {
    players: string[];
  }[];
  matches: {
    homeTeamId: number;
    homeGoals: {
      goalsCount: string;
      whoScores: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    homeAssists: {
      assists: number;
      playerId: string;
    }[];
    awayTeamId: number;
    awayGoals: {
      goalsCount: string;
      whoScores: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    awayAssists: {
      assists: number;
      playerId: string;
    }[];
  }[];
};

const getAvailablePlayers = (allPlayers: Player[], selectedPlayers: string[]) => {
  return allPlayers.filter(player => !selectedPlayers.includes(player.id));
};

const CreateWeekAndMatchesForm: React.FC = () => {
  const params = useParams();
  const paramWeekId = params.weekId;

  const { week } = useWeek(paramWeekId as string);
  

  const defaultValues = useMemo(() => {
    
    return week ? mapWeekToFormValues(week) : {
      date: '', 
      teams: [{ players: [] }, { players: [] }],
      matches: [],
    };
  }, [week]);
  
  const { handleSubmit, control, formState: { errors }, reset, getValues } = useForm<CreateMatch>({
    resolver: zodResolver(CreateMatchSchema),
    defaultValues,
  });
  console.log("🆑 ~ CreateWeekAndMatchesForm ~ errors:", errors)
  console.log("🔴 ~ Form values on render:", JSON.stringify(getValues(), null, 2))

  console.log("🆑 ~ CreateWeekAndMatchesForm ~ defaultValues:", defaultValues)

  useEffect(() => {
  if (week) {
    const mappedValues = mapWeekToFormValues(week);
    reset(mappedValues);
  }
}, [week, reset]);

    

  const [createdTeams, setCreatedTeams] = useState<{
    players: any; id: string 
  }[]>([]);
  const [weekId, setWeekId] = useState<string | null>(null);

  const selectedPlayers = useWatch({ control, name: 'teams' }).flatMap((team: { players: string[] }) => team.players);
  const { players, isLoading } = usePlayers();
  const { fields: teamFields, append: appendTeam, update: updateTeam } = useFieldArray({
    control,
    name: 'teams'
  });
  console.log("🆑 ~ CreateWeekAndMatchesForm ~ teamFields:", teamFields)
  const { fields: matchFields, append: appendMatch, remove: removeMatch } = useFieldArray({
    control,
    name: 'matches'
  });

  const { createWeek } = useCreateWeekWithTeams();
  const { createNewMatches } = useCreateMatches();
  const { update } = useTeams();

  const handleCreateTeams: SubmitHandler<CreateMatch> = async data => {
    try {
      const weekData = {
        date: data.date,
        teams: data.teams.map(team => team.players)
      };

      const result = await createWeek(weekData);

      if (!result.createdTeams || result.createdTeams.length === 0) {
        throw new Error("No teams were created");
      }

      setCreatedTeams(result.createdTeams);
      setWeekId(result.week.id);

      alert('Times criados com sucesso! Agora você pode criar as partidas.');
    } catch (error) {
      console.error('Erro ao criar os times:', error);
      alert('Falha ao criar os times');
    }
  };

  const handleCreateMatches: SubmitHandler<CreateMatch> = async data => {
    console.log("🚀 Submit data:", JSON.stringify(data, null, 2));
    try {
      if (!weekId) {
        throw new Error("Week ID must be set before creating matches.");
      }

      const { matchesData } = mapFormDataToBackend(data, createdTeams, weekId);
      const createdMatchesResponse = await createNewMatches({ matches: matchesData });

      const createdMatches = createdMatchesResponse.createdMatches;
      if (!Array.isArray(createdMatches)) {
        throw new Error("Expected createdMatches to be an array, but got:", createdMatches);
      }

      const teamPoints: Record<string, number> = {};

      createdMatches.forEach(match => {
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
        (team) => teamPoints[team] === maxPoints
      );

      const updatedTeams = createdTeams.map((team) => ({
        id: team.id,
        champion: championTeams.length === 1 && team.id === championTeams[0],
        points: teamPoints[team.id] || 0,
        players: team.players.map((player) => ({
          id: player.id,
          isChampion: championTeams.length === 1 && team.id === championTeams[0],
        })),
      }));

      await update(updatedTeams);

      alert('Partidas criadas com sucesso! Campeões da semana foram definidos.');
    } catch (error) {
      console.error('Erro ao criar as partidas:', error);
      alert('Falha ao criar as partidas');
    }
  };

  const handleAddTeam = () => {
    appendTeam({ players: [] });
  };

  const handleAddMatch = () => {
    appendMatch({
      homeTeamId: -1, // Default to no team selected
      homeGoals: { goalsCount: '', whoScores: [] },
      awayGoals: { goalsCount: '', whoScores: [] },
      awayTeamId: -1 // Default to no team selected
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
            {errors.date && <span className="text-[hsl(var(--destructive))]">Este campo é obrigatório</span>}
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
                        options={availablePlayers.map(player => ({ label: player.name, value: player.id }))}
                        value={field.value.map(playerId => players?.find(player => player.id === playerId)).filter(Boolean).map(player => ({ label: player?.name, value: player?.id }))}
                        onChange={(selectedOptions) => {
                          const selectedPlayerIds = selectedOptions.map(option => option.value).filter(Boolean) as string[];
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

        <form onSubmit={(e) => {
          console.log("🔴 FORM VALUES BEFORE SUBMIT:", JSON.stringify(getValues(), null, 2));
          console.log("🔴 Match 7 specifically:", getValues().matches?.[7]);
          handleSubmit(handleCreateMatches)(e);
        }} className="flex flex-col gap-4">
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
            <Button variant="primary" size="lg" onClick={handleAddMatch} className="flex gap-2 items-center">
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
