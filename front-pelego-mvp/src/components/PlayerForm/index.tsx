'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { formToPlayerMapper } from '@/mapper/formToPlayerMapper';
import { playerGetOverallSchema } from '@/schema/player';
import { Player, PlayerGetOverallFormData } from '@/types/player';
import { calculateOverall } from '@/utils/calculateOverall';
import countryOptions from '@/utils/countryOptions';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Controller, useForm } from 'react-hook-form';
import { SingleValue } from 'react-select';

import CountrySelect, { CountryOption } from '@/components/CountrySelect';
import { PlayerCard } from '@/components/PlayerCard';
import SelectWithSearch from '@/components/SelectWithSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PlayerFormProps {
  defaultValues?: Partial<PlayerGetOverallFormData>;
  onSubmit: (data: PlayerGetOverallFormData) => Promise<void>;
  submitLabel?: string;
}

export default function PlayerForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Salvar Jogador',
}: PlayerFormProps) {
  const {
    control,
    watch,
    handleSubmit,
  } = useForm<PlayerGetOverallFormData>({
    resolver: zodResolver(playerGetOverallSchema),
    defaultValues,
  });

  const overallWatcher = watch('overall');
  const positionWatcher = watch('position');
  const playerDataWatcher = watch();
  const [playerData, setPlayerData] = useState<Player | null>(null);

  const positionOptions = [
    { label: 'ATK', value: 'ATK' },
    { label: 'MEI', value: 'MEI' },
    { label: 'DEF', value: 'DEF' },
    { label: 'GOL', value: 'GOL' },
  ];

  const handleCalculateOverall = () => {
    const overallValue = calculateOverall({
      overall: overallWatcher,
      position: positionWatcher,
    });
    const formData = formToPlayerMapper(playerDataWatcher, overallValue);
    setPlayerData(formData);
  };

  return (
    <div className="max-w-[1440px] p-6 bg-[hsl(var(--card))] rounded-lg w-full text-[hsl(var(--foreground))] flex gap-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full max-w-lg">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">*Nome</Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                id="name"
                value={value || ''}
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
                value={positionOptions.find((option) => option.value === field.value) || null}
                onChange={(selectedOption) => {
                  field.onChange(selectedOption?.value || '');
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
                value={countryOptions.find((option) => option.value === field.value) || null}
                onChange={(selectedOption: SingleValue<CountryOption>) => {
                  field.onChange(selectedOption?.value || '');
                }}
              />
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email (opcional)</Label>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <Input
                  id="email"
                  type="email"
                  value={value || ''}
                  onChange={onChange}
                  placeholder="jogador@email.com"
                  className="bg-[hsl(var(--input-background))] text-[hsl(var(--foreground))]"
                />
                {error && <p className="text-sm text-red-500">{error.message}</p>}
              </>
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
                    value={value || ''}
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
                    value={value || ''}
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
                    value={value || ''}
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
                    value={value || ''}
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
                    value={value || ''}
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
                    value={value || ''}
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
          <Button type="button" onClick={handleCalculateOverall} className="flex flex-row gap-3">
            <RemoveRedEyeOutlinedIcon className="mb-[2px]" />
            Ver Overall
          </Button>
          <Button type="submit" className="flex flex-row gap-3">
            <SaveOutlinedIcon className="mb-[2px]" />
            {submitLabel}
          </Button>
        </div>
      </form>
      {playerData && (
        <div className="w-full max-w-sm">
          <PlayerCard playerData={playerData} />
        </div>
      )}
    </div>
  );
}
