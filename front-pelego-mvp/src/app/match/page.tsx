'use client';

import MatchForm from '@/components/MatchForm';
import { useToast } from '@/hooks/use-toast';
import { useCreateWeekAndMatches } from '@/services/matchs/useCreateWeekAndMatches';
import { usePlayers } from '@/services/player/usePlayers';
import { Player } from '@/types/player';
import { Save } from '@mui/icons-material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import React, { useCallback, useMemo, useState } from 'react';
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form';
import Select from 'react-select';

export type CreateMatchForm = {
  date: string;
  teams: {
    players: string[];
  }[];
  matches: {
    homeTeamId: string;
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
    awayTeamId: string;
  }[];
};

const getAvailablePlayers = (allPlayers: Player[], selectedPlayers: string[]) => {
  return allPlayers.filter(player => !selectedPlayers.includes(player.id));
};

const CreateWeekAndMatchesForm: React.FC = () => {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<CreateMatchForm>({
    defaultValues: {
      teams: [{ players: [] }, { players: [] }],
      matches: []
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedPlayers = useWatch({ control, name: 'teams' }).flatMap((team: { players: string[] }) => team.players);
  const { players, isLoading } = usePlayers();
  const { toast } = useToast();
  const { createWeekWithMatches } = useCreateWeekAndMatches();

  const { fields: teamFields, append: appendTeam, update: updateTeam } = useFieldArray({
    control,
    name: 'teams'
  });

  const { fields: matchFields, append: appendMatch, remove: removeMatch } = useFieldArray({
    control,
    name: 'matches'
  });

  const handleAddTeam = useCallback(() => {
    appendTeam({ players: [] });
  }, [appendTeam]);

  const handleAddMatch = useCallback(() => {
    appendMatch({
      homeTeamId: '',
      homeGoals: { goalsCount: '', whoScores: [] },
      homeAssists: [],
      awayGoals: { goalsCount: '', whoScores: [] },
      awayAssists: [],
      awayTeamId: ''
    });
  }, [appendMatch]);

  const handleCreateWeekAndMatches: SubmitHandler<CreateMatchForm> = async (data) => {
    setIsSubmitting(true);

    try {
      // Validação inicial
      if (data.teams.length < 2) {
        toast({
          variant: 'destructive',
          title: 'Erro de validação',
          description: 'É necessário ter pelo menos 2 times',
        });
        return;
      }

      if (data.matches.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Erro de validação',
          description: 'É necessário ter pelo menos 1 partida',
        });
        return;
      }

      // Mapear dados do formulário para o formato da API
      const requestData = {
        date: data.date,
        teams: data.teams.map(team => team.players),
        matches: data.matches.map(match => {
          const homeTeamIndex = parseInt(match.homeTeamId, 10);
          const awayTeamIndex = parseInt(match.awayTeamId, 10);

          // Mapear gols
          const mapGoals = (goals: { goals: number; playerId: string; ownGoalPlayerId?: string }[]) => {
            return goals
              .filter(goal => goal.goals !== undefined && goal.goals !== null && goal.goals !== 0)
              .map(goal => {
                if (goal.playerId === 'GC') {
                  return {
                    ownGoalPlayerId: goal.ownGoalPlayerId,
                    goals: typeof goal.goals === 'string' ? parseInt(goal.goals, 10) : goal.goals
                  };
                } else {
                  return {
                    playerId: goal.playerId,
                    goals: typeof goal.goals === 'string' ? parseInt(goal.goals, 10) : goal.goals
                  };
                }
              });
          };

          // Mapear assistências
          const mapAssists = (assists: { assists: number; playerId: string }[]) => {
            return assists
              .filter(assist => assist.assists !== undefined && assist.assists !== null && assist.assists !== 0 && assist.playerId !== undefined)
              .map(assist => ({
                playerId: assist.playerId,
                assists: typeof assist.assists === 'string' ? parseInt(assist.assists, 10) : assist.assists
              }));
          };

          return {
            homeTeamIndex,
            awayTeamIndex,
            homeGoals: mapGoals(match.homeGoals.whoScores || []),
            awayGoals: mapGoals(match.awayGoals.whoScores || []),
            homeAssists: mapAssists(match.homeAssists || []),
            awayAssists: mapAssists(match.awayAssists || [])
          };
        })
      };

      const result = await createWeekWithMatches(requestData);

      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: result.championTeamId
          ? 'Semana e partidas criadas com sucesso! Campeão da semana definido.'
          : 'Semana e partidas criadas com sucesso! Não houve campeão nesta semana (empate).',
      });

      // Resetar formulário
      reset({
        date: '',
        teams: [{ players: [] }, { players: [] }],
        matches: []
      });

    } catch (error) {
      console.error('Erro ao criar semana e partidas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar semana',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao criar a semana e partidas. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availablePlayers = useMemo(() => {
    return players ? getAvailablePlayers(players, selectedPlayers) : [];
  }, [players, selectedPlayers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#333333] w-screen flex justify-center items-center">
        <div className="text-white text-xl">Carregando jogadores...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#333333] w-screen flex justify-start flex-col p-12 items-center gap-7">
      <div className="max-w-[1440px] p-6 bg-white min-h-full rounded-lg overflow-auto text-black">
        <h1 className="text-2xl font-bold mb-6">Criar Semana e Partidas</h1>

        <form onSubmit={handleSubmit(handleCreateWeekAndMatches)}>
          {/* Data da Semana */}
          <div className="mb-6">
            <label className="mr-4 font-semibold">Data da Semana</label>
            <input
              type="datetime-local"
              {...register('date', { required: true })}
              className="border border-gray-300 rounded px-3 py-2"
              disabled={isSubmitting}
            />
            {errors.date && <span className="text-red-500 ml-2">Campo obrigatório</span>}
          </div>

          {/* Times */}
          <div className="mb-6">
            <label className="font-semibold text-lg mb-4 block">Times</label>
            <div className="flex flex-row gap-4 items-center mt-4 flex-wrap">
              {teamFields.map((team, index) => (
                <div key={team.id} className="flex flex-row gap-4 items-center border border-gray-200 p-4 rounded">
                  <h3 className="font-medium">Time {index + 1}</h3>
                  <Controller
                    control={control}
                    name={`teams.${index}.players`}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        isMulti
                        isDisabled={isSubmitting}
                        options={availablePlayers.map(player => ({ label: player.name, value: player.id }))}
                        value={field.value.map(playerId => players?.find(player => player.id === playerId)).filter(Boolean).map(player => ({ label: player?.name, value: player?.id }))}
                        onChange={(selectedOptions) => {
                          const selectedPlayerIds = selectedOptions.map(option => option.value).filter(Boolean) as string[];
                          field.onChange(selectedPlayerIds);
                          updateTeam(index, { players: selectedPlayerIds });
                        }}
                        placeholder="Selecione os jogadores..."
                        className="min-w-[300px]"
                      />
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-row gap-4 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-[#4D7133] text-white rounded flex flex-row gap-2 items-center justify-center w-56 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddTeam}
                disabled={isSubmitting}
              >
                <GroupAddIcon />Adicionar Time
              </button>
            </div>
          </div>

          {/* Partidas */}
          <div className="mb-6">
            <label className="font-semibold text-lg mb-4 block">Partidas</label>
            <div className="flex flex-col gap-4">
              {matchFields.map((match, index) => (
                <MatchForm
                  key={match.id}
                  index={index}
                  control={control}
                  teamFields={teamFields}
                  players={players || []}
                  removeMatch={removeMatch}
                />
              ))}
            </div>

            <div className="flex flex-row gap-4 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-[#4D7133] text-white rounded flex flex-row gap-2 items-center justify-center w-56 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddMatch}
                disabled={isSubmitting}
              >
                <ScoreboardIcon />Adicionar Partida
              </button>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="px-6 py-3 bg-[#4D7133] text-white rounded flex flex-row gap-2 items-center justify-center min-w-[200px] text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save />Salvar Tudo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWeekAndMatchesForm;
