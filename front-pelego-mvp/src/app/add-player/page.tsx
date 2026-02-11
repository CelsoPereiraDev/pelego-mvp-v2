"use client";

import CountrySelect, { CountryOption } from "@/components/CountrySelect";
import PlayerCard from "@/components/PlayerCard";
import SelectWithSearch from "@/components/SelectWithSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPlayerMapper } from "@/mapper/addPlayerMapper";
import { formToPlayerMapper } from "@/mapper/formToPlayerMapper";
import RoleGate from "@/components/RoleGate";
import { playerGetOverallSchema } from "@/schema/player";
import { useFut } from "@/contexts/FutContext";
import { createPlayer } from "@/services/player/resources";
import { Player, PlayerGetOverallFormData } from "@/types/player";
import { calculateOverall } from "@/utils/calculateOverall";
import countryOptions from "@/utils/countryOptions";
import { zodResolver } from "@hookform/resolvers/zod";
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SingleValue } from "react-select";


export default function AddPlayersPage() {
  const { futId } = useFut();
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<PlayerGetOverallFormData>({
    resolver: zodResolver(playerGetOverallSchema),
  });

  const overallWatcher = watch("overall");
  const positionWatcher = watch("position");
  const playerDataWatcher = watch();
  const [playerData, setPlayerData] = useState<Player | null>(null);

  const positionOptions = [
    { label: "ATK", value: "ATK" },
    { label: "MEI", value: "MEI" },
    { label: "DEF", value: "DEF" },
    { label: "GOL", value: "GOL" },
  ];

  const handleCalculateOverall = () => {
    const overallValue = calculateOverall({
      overall: overallWatcher,
      position: positionWatcher,
    });
    const formData = formToPlayerMapper(playerDataWatcher, overallValue);
    setPlayerData(formData);
  };

  const onSubmit = async (formData: PlayerGetOverallFormData) => {
    if (!futId) return;
    const playerData = addPlayerMapper(formData);

    try {
      const createdPlayer = await createPlayer(futId, playerData);
      console.log("Jogador criado com sucesso:", createdPlayer);
    } catch (error) {
      console.error("Erro ao criar jogador:", error);
    }
  };

  return (
    <RoleGate allow={['admin']} fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <p className="text-lg">Apenas administradores podem adicionar jogadores.</p>
      </div>
    }>
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center p-8 gap-8">
      <h1 className="text-3xl font-semibold text-[hsl(var(--foreground))] mb-8">
        Adicionar Jogador
      </h1>
      <div className="max-w-[1440px] p-6 bg-[hsl(var(--card))] rounded-lg w-full text-[hsl(var(--foreground))] flex gap-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 w-full max-w-lg"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">*Nome</Label>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  id="name"
                  value={value || ""}
                  onChange={onChange}
                  placeholder="Nome"
                  className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>*Posição</Label>
            <Controller
              control={control}
              name="position"
              render={({ field }) => (
                <SelectWithSearch
                  options={positionOptions}
                  value={
                    positionOptions.find(
                      (option) => option.value === field.value
                    ) || null
                  }
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || "");
                  }}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>País</Label>
            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <CountrySelect
                  value={
                    countryOptions.find(
                      (option) => option.value === field.value
                    ) || null
                  }
                  onChange={(selectedOption: SingleValue<CountryOption>) => {
                    field.onChange(selectedOption?.value || "");
                  }}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>*Velocidade</Label>
                <Controller
                  control={control}
                  name="overall.pace"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChange={onChange}
                      placeholder="50"
                      className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>*Chute</Label>
                <Controller
                  control={control}
                  name="overall.shooting"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChange={onChange}
                      placeholder="50"
                      className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>*Passe</Label>
                <Controller
                  control={control}
                  name="overall.passing"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChange={onChange}
                      placeholder="50"
                      className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>*Drible</Label>
                <Controller
                  control={control}
                  name="overall.dribble"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChange={onChange}
                      placeholder="50"
                      className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>*Defesa</Label>
                <Controller
                  control={control}
                  name="overall.defense"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChange={onChange}
                      placeholder="50"
                      className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>*Físico</Label>
                <Controller
                  control={control}
                  name="overall.physics"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChange={onChange}
                      placeholder="50"
                      className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button onClick={handleCalculateOverall} className="flex flex-row gap-3"><RemoveRedEyeOutlinedIcon className="mb-[2px]"/>Ver Overall</Button>
            <Button type="submit" className="flex flex-row gap-3"><SaveOutlinedIcon className="mb-[2px]"/>Salvar Jogador</Button>
          </div>
        </form>
        {playerData && (
          <div className="w-full max-w-sm">
            <PlayerCard playerData={playerData} />
          </div>
        )}
      </div>
    </div>
    </RoleGate>
  );
}
