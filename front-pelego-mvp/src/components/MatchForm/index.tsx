import { CreateMatch } from "@/app/match/page";
import SelectWithSearch from '@/components/SelectWithSearch';
import { PlayerResponse } from "@/types/player";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useEffect, useMemo, useState } from "react";
import { Control, Controller, FieldArrayWithId, UseFieldArrayRemove, useWatch } from "react-hook-form";

interface MatchFormProps {
  index: number;
  control: Control<CreateMatch>;
  teamFields: FieldArrayWithId<CreateMatch, "teams", "id">[];
  players: PlayerResponse[];
  removeMatch: UseFieldArrayRemove;
  disabled?: boolean;
}

export const MatchForm = ({ index, control, teamFields, players, removeMatch, disabled = false }: MatchFormProps) => {
  const homeTeamId = useWatch({ control, name: `matches.${index}.homeTeamId` });
  const awayTeamId = useWatch({ control, name: `matches.${index}.awayTeamId` });
  const homeGoals = useWatch({ control, name: `matches.${index}.homeGoals.goalsCount` });
  const awayGoals = useWatch({ control, name: `matches.${index}.awayGoals.goalsCount` });

  const homePlayersForTeam = useMemo(() => {
    return teamFields[parseInt(homeTeamId)]?.players || [];
  }, [homeTeamId, teamFields]);

  const awayPlayersForTeam = useMemo(() => {
    return teamFields[parseInt(awayTeamId)]?.players || [];
  }, [awayTeamId, teamFields]);

  const teamsOptions = useMemo(() => {
  return teamFields.map((team, idx) => {
    return {
      label: `Time ${idx + 1}`,
      value: idx,
    };
  });
}, [teamFields]);


  const goalsOptions = Array.from({ length: 10 }, (_, i) => ({ label: i.toString(), value: i.toString() }));

  const [homeGoalsInputs, setHomeGoalsInputs] = useState<number[]>([]);
  const [awayGoalsInputs, setAwayGoalsInputs] = useState<number[]>([]);
  const [homeGoalsGC, setHomeGoalsGC] = useState<boolean[]>([]);
  const [awayGoalsGC, setAwayGoalsGC] = useState<boolean[]>([]);

  useEffect(() => {
    setHomeGoalsInputs(Array.from({ length: parseInt(homeGoals) || 0 }, (_, i) => i));
    setHomeGoalsGC(Array.from({ length: parseInt(homeGoals) || 0 }, () => false));
  }, [homeGoals]);

  useEffect(() => {
    setAwayGoalsInputs(Array.from({ length: parseInt(awayGoals) || 0 }, (_, i) => i));
    setAwayGoalsGC(Array.from({ length: parseInt(awayGoals) || 0 }, () => false));
  }, [awayGoals]);

  const playerOptions = (playerIds: string[]) => {
    return [
      { label: "GC", value: "GC" },
      ...players
        .filter(player => playerIds.includes(player.id))
        .map(player => ({ label: player.name, value: player.id }))
    ];
  };

  return (
    <div className="flex flex-col items-start gap-4 min-w-[600px] border-[1px] border-[#4D7133] p-4 rounded-lg">
      <div className="flex flex-row justify-between w-full">
        <h3 className="my-auto text-[#333433]">Jogo {index + 1}</h3>
        <div onClick={() => removeMatch(index)}>
          <DeleteOutlineIcon className="text-red-600" />
        </div>
      </div>
      <div className="flex flex-row items-start gap-4 w-full">
        <div className="flex flex-col items-start gap-2 w-[460px]">
          <div className="flex flex-row items-center gap-2 w-full justify-start">
            <div className="w-44">
              <Controller
                control={control}
                name={`matches.${index}.homeTeamId`}
                render={({ field }) => (
                  <SelectWithSearch
                    options={teamsOptions}
                    value={teamsOptions.find((option) => option.value === parseInt(field.value)) || null}
                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                  />
                )}
              />
            </div>
            <div className="w-20">
              <Controller
                control={control}
                name={`matches.${index}.homeGoals.goalsCount`}
                render={({ field }) => (
                  <SelectWithSearch
                    options={goalsOptions}
                    value={goalsOptions.find((option) => option.value === field.value) || null}
                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                  />
                )}
              />
            </div>
          </div>
          {homeGoalsInputs.map((_, goalIndex) => (
             <div key={`away-goal-${goalIndex}`} className="flex flex-col gap-2">
              <div className="flex flex-row gap-2 items-center">
                <span>Gol</span>
                <div className="w-[150px]">
                  <Controller
                    control={control}
                    name={`matches.${index}.homeGoals.whoScores.${goalIndex}.playerId`}
                    render={({ field }) => (
                      <SelectWithSearch
                        placeholder="Jogador"
                        options={playerOptions(homePlayersForTeam)}
                        value={playerOptions(homePlayersForTeam).find(option => option.value === field.value) || null}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption ? selectedOption.value : null);
                          setHomeGoalsGC(prev => {
                            const newGC = [...prev];
                            newGC[goalIndex] = selectedOption?.value === "GC";
                            return newGC;
                          });
                        }}
                      />
                    )}
                  />
                </div>
                <div className="w-[95px]">
                  <Controller
                    control={control}
                    name={`matches.${index}.homeGoals.whoScores.${goalIndex}.goals`}
                    render={({ field }) => (
                      <SelectWithSearch
                        placeholder="Gols"
                        options={goalsOptions}
                        value={goalsOptions.find((option) => option.value === String(field.value)) || null}
                        onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                      />
                    )}
                  />
                </div>
                
                {homeGoalsGC[goalIndex] && (
                  <div className="w-[150px]">
                    <Controller
                      control={control}
                      name={`matches.${index}.homeGoals.whoScores.${goalIndex}.ownGoalPlayerId`}
                      render={({ field }) => (
                        <SelectWithSearch
                          options={playerOptions(awayPlayersForTeam)}
                          value={playerOptions(awayPlayersForTeam).find(option => option.value === field.value) || null}
                          onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-row gap-2 items-center">
                <span>Assist.</span>
                <Controller
                  control={control}
                  name={`matches.${index}.homeAssists.${goalIndex}.playerId`}
                  render={({ field }) => (
                    <SelectWithSearch
                      placeholder='Assists.'
                      options={playerOptions(homePlayersForTeam)}
                      value={playerOptions(homePlayersForTeam).find(option => option.value === field.value) || null}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption ? selectedOption.value : null);
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`matches.${index}.homeAssists.${goalIndex}.assists`}
                  render={({ field }) => (
                    <SelectWithSearch
                      placeholder='Jogador'
                      options={goalsOptions}
                      value={goalsOptions.find((option) => option.value === String(field.value)) || null}
                      onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                    />
                  )}
                />
               </div>
            </div>
          ))}
        </div>
        <span className="my-auto text-[#333433]">X</span>
        <div className="flex flex-col items-start gap-2 w-[460px]">
          <div className="flex flex-row items-center gap-2 w-full justify-end">
            <div className="w-20">
              <Controller
                control={control}
                name={`matches.${index}.awayGoals.goalsCount`}
                render={({ field }) => (
                  <SelectWithSearch
                    options={goalsOptions}
                    value={goalsOptions.find((option) => option.value === field.value) || null}
                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                  />
                )}
              />
            </div>
            <div className="w-44">
              <Controller
                control={control}
                name={`matches.${index}.awayTeamId`}
                render={({ field }) => (
                  <SelectWithSearch
                    options={teamsOptions}
                    value={teamsOptions.find((option) => option.value === parseInt(field.value)) || null}
                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                  />
                )}
              />
            </div>
          </div>
          {awayGoalsInputs.map((_, goalIndex) => (
            <div key={`away-goal-${goalIndex}`} className="flex flex-col gap-2 items-end w-full">
              <div className="flex flex-row gap-2 items-center">
                <span>Gol</span>
                <div className="w-[95px]">
                  <Controller
                    control={control}
                    name={`matches.${index}.awayGoals.whoScores.${goalIndex}.goals`}
                    render={({ field }) => (
                      <SelectWithSearch
                        placeholder="Gols"
                        options={goalsOptions}
                        value={goalsOptions.find((option) => option.value === String(field.value)) || null}
                        onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                      />
                    )}
                  />
                </div>
                <div className="w-[150px]">
                  <Controller
                    control={control}
                    name={`matches.${index}.awayGoals.whoScores.${goalIndex}.playerId`}
                    render={({ field }) => (
                      <SelectWithSearch
                        placeholder="Jogador"
                        options={playerOptions(awayPlayersForTeam)}
                        value={playerOptions(awayPlayersForTeam).find(option => option.value === field.value) || null}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption ? selectedOption.value : null);
                          setAwayGoalsGC(prev => {
                            const newGC = [...prev];
                            newGC[goalIndex] = selectedOption?.value === "GC";
                            return newGC;
                          });
                        }}
                      />
                    )}
                  />
                </div>
                {awayGoalsGC[goalIndex] && (
                  <div className="w-[150px]">
                    <Controller
                      control={control}
                      name={`matches.${index}.awayGoals.whoScores.${goalIndex}.ownGoalPlayerId`}
                      render={({ field }) => (
                        <SelectWithSearch
                          options={playerOptions(homePlayersForTeam)}
                          value={playerOptions(homePlayersForTeam).find(option => option.value === field.value) || null}
                          onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
               <div className="flex flex-row gap-2 items-center">
                <span>Assist.</span>
                <Controller
                  control={control}
                  name={`matches.${index}.awayAssists.${goalIndex}.assists`}
                  render={({ field }) => (
                    <SelectWithSearch
                      placeholder='Assists.'
                      options={goalsOptions}
                      value={goalsOptions.find((option) => option.value === String(field.value)) || null}
                      onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`matches.${index}.awayAssists.${goalIndex}.playerId`}
                  render={({ field }) => (
                    <SelectWithSearch
                      placeholder='Jogador'
                      options={playerOptions(awayPlayersForTeam)}
                      value={playerOptions(awayPlayersForTeam).find(option => option.value === field.value) || null}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption ? selectedOption.value : null);
                      }}
                    />
                  )}
                />
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



export default MatchForm;
