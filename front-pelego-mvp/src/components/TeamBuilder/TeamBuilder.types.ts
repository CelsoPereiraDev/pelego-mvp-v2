import { PlayerResponse } from '@/types/player';

export interface TeamBuilderProps {
  teamIndex: number;
  selectedPlayerIds: string[];
  availablePlayers: PlayerResponse[];
  onPlayersChange: (playerIds: string[]) => void;
  error?: string;
  label?: string;
}
