import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export class QueryRequest<ResponseType, PayloadType = undefined> {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL, _clientId?: string, _projectId?: string, _token?: string) {
    this.baseUrl = baseUrl;
  }

  addDefaultHeaders() {
    // Kept for backwards compatibility — headers are now built per-request
  }

  async get(endpoint: string): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados');
    }

    return response.json();
  }

  async post(endpoint: string, payload: PayloadType): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar dados');
    }

    return response.json();
  }

  async put(endpoint: string, payload: PayloadType): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar dados');
    }

    return response.json();
  }

  async patch(endpoint: string, payload: PayloadType): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar dados');
    }

    return response.json();
  }

  async getById(id: string, endpoint: string): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}/${id}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados');
    }

    return response.json();
  }

  async delete(endpoint: string): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao deletar dados');
    }

    return response.json();
  }
}

export { getAuthHeaders, API_BASE_URL };


