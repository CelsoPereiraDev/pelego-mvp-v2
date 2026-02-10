import { Control, UseFormSetValue } from 'react-hook-form';
import { PlayerResponse } from '@/types/player';
import { CreateMatchForm } from '@/types/forms';

export interface GoalEntryProps {
  matchIndex: number;
  side: 'home' | 'away';
  goalIndex: number;
  teamName: string; // NEW: Team name for labels
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teamPlayers: PlayerResponse[];
  opposingTeamPlayers: PlayerResponse[];
  teamScore: string;
}

export interface AssistEntryProps {
  matchIndex: number;
  side: 'home' | 'away';
  goalIndex: number;
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teamPlayers: PlayerResponse[];
  goalScorerId: string;
}
