export class QueryRequest<ResponseType, PayloadType = undefined> {
  private baseUrl: string;
  private clientId: string;
  private projectId?: string;
  private token?: string;

  constructor(baseUrl: string, clientId: string, projectId?: string, token?: string) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.projectId = projectId;
    this.token = token;
  }

  private headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  addDefaultHeaders() {
    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async get(endpoint: string): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados');
    }

    return response.json();
  }

  async post(endpoint: string, payload: PayloadType): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar dados');
    }

    return response.json();
  }

  async patch(endpoint: string, payload: PayloadType): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'PATCH',
      headers: this.headers,
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
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados');
    }

    return response.json();
  }

  async delete(endpoint: string): Promise<ResponseType> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Erro ao deletar dados');
    }

    return response.json();
  }
}


  

