import { CreatePlayerDataRequested, PlayerGetOverallFormData, PlayerPosition } from '@/types/player';
import { calculateOverall } from '@/utils/calculateOverall';

export const addPlayerMapper = (formData: PlayerGetOverallFormData): CreatePlayerDataRequested => {
  const { name, overall, position, country } = formData;

  const player: CreatePlayerDataRequested = {
    name,
    overall: {
      pace: Number(overall.pace),
      shooting: Number(overall.shooting),
      passing: Number(overall.passing),
      dribble: Number(overall.dribble),
      defense: Number(overall.defense),
      physics: Number(overall.physics),
      overall: calculateOverall({ position: formData.position, overall: formData.overall }),
    },
    position: position as PlayerPosition,
    country,
    isChampion: false,
  };

  return player;
};
