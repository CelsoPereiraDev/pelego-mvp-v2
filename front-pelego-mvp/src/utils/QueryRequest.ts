import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334/api';

function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const user = await waitForAuth();
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

const SAFE_ERROR_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para esta ação',
  404: 'Recurso não encontrado',
  409: 'Conflito — o recurso já existe ou foi modificado',
  429: 'Muitas requisições. Aguarde um momento.',
};

async function handleResponseError(response: Response, fallbackMessage: string): Promise<never> {
  let userMessage = SAFE_ERROR_MESSAGES[response.status];

  if (!userMessage) {
    try {
      const body = await response.json();
      userMessage = body.message || body.error || fallbackMessage;
    } catch {
      userMessage = fallbackMessage;
    }
  }

  throw new Error(userMessage || `${fallbackMessage} (${response.status})`);
}

export class QueryRequest<ResponseType, PayloadType = undefined> {
  private baseUrl: string;

  constructor(
    baseUrl: string = API_BASE_URL,
  ) {
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
      await handleResponseError(response, 'Erro ao buscar dados');
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
      await handleResponseError(response, 'Erro ao enviar dados');
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
      await handleResponseError(response, 'Erro ao atualizar dados');
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
      await handleResponseError(response, 'Erro ao atualizar dados');
    }

    return response.json();
  }

  async getById(id: string, endpoint: string): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}/${id}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Erro ao buscar dados');
    }

    return response.json();
  }

  async delete(endpoint: string): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Erro ao deletar dados');
    }

    return response.json();
  }
}

export { getAuthHeaders, API_BASE_URL };
