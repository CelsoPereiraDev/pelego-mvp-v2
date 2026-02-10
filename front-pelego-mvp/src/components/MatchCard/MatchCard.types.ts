import { Control, UseFormSetValue } from 'react-hook-form';
import { PlayerResponse } from '@/types/player';
import { CreateMatchForm } from '@/types/forms';

export interface MatchCardProps {
  matchIndex: number;
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teams: TeamOption[];
  onRemove: () => void;
  canRemove: boolean;
}

export interface TeamOption {
  id: string;
  label: string;
  players: PlayerResponse[];
}
