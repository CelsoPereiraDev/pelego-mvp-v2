import { CreatePlayerDataRequested, PlayerResponse } from '@/types/player';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getPlayers(futId: string) {
  return new QueryRequest<Array<PlayerResponse>>().get(`futs/${futId}/get_players`);
}

export async function getPlayer(futId: string, playerId: string) {
  return new QueryRequest<PlayerResponse>().get(`futs/${futId}/get_player/${playerId}`);
}

export async function createPlayer(futId: string, playerData: CreatePlayerDataRequested) {
  return new QueryRequest<PlayerResponse, CreatePlayerDataRequested>().post(`futs/${futId}/create_players`, playerData);
}

export async function deletePlayer(futId: string, playerId: string) {
  return new QueryRequest<{ message: string }>().delete(`futs/${futId}/delete_player/${playerId}`);
}

export async function editPlayer(futId: string, playerId: string, playerData: CreatePlayerDataRequested): Promise<PlayerResponse> {
  return new QueryRequest<PlayerResponse, CreatePlayerDataRequested>().patch(`futs/${futId}/players/${playerId}`, playerData);
}
