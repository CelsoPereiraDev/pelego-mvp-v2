import { CreatePlayerDataRequested, PlayerResponse } from '@/types/player';
import { QueryRequest } from '@/utils/QueryRequest';


const BASE_URL = 'http://localhost:3334/api';
const CLIENT_ID = 'client-id';

export async function getPlayers() {
  const queryRequest = new QueryRequest<Array<PlayerResponse>>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.get('get_players');
}

export async function getPlayer(playerId: string) {
  const queryRequest = new QueryRequest<PlayerResponse>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.getById(playerId, 'get_player');
}

export async function createPlayer(playerData: CreatePlayerDataRequested) {
  const queryRequest = new QueryRequest<PlayerResponse, CreatePlayerDataRequested>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.post('create_players', playerData);
}

export async function deletePlayer(playerId: string) {
  const queryRequest = new QueryRequest<{ message: string }>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.delete(`delete_player/${playerId}`);
}

export async function editPlayer(playerId: string, playerData: CreatePlayerDataRequested): Promise<PlayerResponse> {
  const queryRequest = new QueryRequest<PlayerResponse, CreatePlayerDataRequested>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.patch(`players/${playerId}`, playerData);
}
