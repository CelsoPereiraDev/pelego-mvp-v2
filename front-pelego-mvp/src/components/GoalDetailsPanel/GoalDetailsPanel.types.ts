import { Control, UseFormSetValue } from 'react-hook-form';
import { PlayerResponse } from '@/types/player';
import { CreateMatchForm } from '@/types/forms';

export interface GoalDetailsPanelProps {
  matchIndex: number;
  side: 'home' | 'away';
  teamName: string; // NEW: Team name for header
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teamPlayers: PlayerResponse[];
  opposingTeamPlayers: PlayerResponse[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
