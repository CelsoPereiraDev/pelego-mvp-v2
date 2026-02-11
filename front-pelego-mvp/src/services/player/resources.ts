import { CreatePlayerDataRequested, PlayerResponse } from '@/types/player';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getPlayers() {
  return new QueryRequest<Array<PlayerResponse>>().get('get_players');
}

export async function getPlayer(playerId: string) {
  return new QueryRequest<PlayerResponse>().getById(playerId, 'get_player');
}

export async function createPlayer(playerData: CreatePlayerDataRequested) {
  return new QueryRequest<PlayerResponse, CreatePlayerDataRequested>().post('create_players', playerData);
}

export async function deletePlayer(playerId: string) {
  return new QueryRequest<{ message: string }>().delete(`delete_player/${playerId}`);
}

export async function editPlayer(playerId: string, playerData: CreatePlayerDataRequested): Promise<PlayerResponse> {
  return new QueryRequest<PlayerResponse, CreatePlayerDataRequested>().patch(`players/${playerId}`, playerData);
}
