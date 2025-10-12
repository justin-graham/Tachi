import { ApiClient } from '@/hooks/useAuth'

export interface PublisherApiKey {
  id: string
  name: string
  createdAt?: string
}

interface ApiKeysListResponse {
  apiKeys: PublisherApiKey[]
}

export interface CreateApiKeyResponse {
  apiKey: PublisherApiKey
  plainKey?: string
}

export class PublisherApiKeysService {
  constructor(private readonly client: ApiClient) {}

  async list(): Promise<PublisherApiKey[]> {
    const response = (await this.client.get('/api/api-keys')) as ApiKeysListResponse | null
    if (!response || !Array.isArray(response.apiKeys)) {
      return []
    }
    return response.apiKeys
  }

  async create(name: string): Promise<CreateApiKeyResponse> {
    return this.client.post('/api/api-keys', { name }) as Promise<CreateApiKeyResponse>
  }

  async revoke(keyId: string): Promise<void> {
    await this.client.delete(`/api/api-keys/${keyId}`)
  }
}
