import { PlayerResponse } from '@/types/player';
import { SelectOption } from '@/types/components';

export interface TeamBuilderProps {
  teamIndex: number;
  selectedPlayerIds: string[];
  availablePlayers: PlayerResponse[];
  onPlayersChange: (playerIds: string[]) => void;
  error?: string;
  label?: string;
}
