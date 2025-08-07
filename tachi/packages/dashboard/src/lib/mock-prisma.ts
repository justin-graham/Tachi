// Mock Prisma client for development
// This should be replaced with actual Prisma setup

interface MockUser {
  id: string
  email: string
  name?: string
  walletAddress?: string
  apiKeys: MockApiKey[]
}

interface MockApiKey {
  id: string
  name: string
  keyHash: string
  keyPrefix: string
  totalRequests: number
  monthlyRequests: number
  lastUsedAt?: Date
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
  userId: string
}

// In-memory storage for development
let mockUsers: MockUser[] = [
  {
    id: 'dev-user-1',
    email: 'developer@example.com',
    name: 'Development User',
    walletAddress: '0x1234567890123456789012345678901234567890',
    apiKeys: []
  }
]

let mockApiKeys: MockApiKey[] = []

export class MockPrismaClient {
  user = {
    findUnique: async ({ where, include }: any) => {
      const user = mockUsers.find(u => u.email === where.email || u.id === where.id)
      if (!user) return null
      
      if (include?.apiKeys) {
        const userKeys = mockApiKeys.filter(key => 
          key.userId === user.id && 
          (!include.apiKeys.where?.isActive || key.isActive)
        )
        return { ...user, apiKeys: userKeys }
      }
      
      return user
    },
    
    create: async ({ data }: any) => {
      const newUser: MockUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        walletAddress: data.walletAddress,
        apiKeys: []
      }
      mockUsers.push(newUser)
      return newUser
    }
  }

  apiKey = {
    create: async ({ data }: any) => {
      const newKey: MockApiKey = {
        id: `key-${Date.now()}`,
        name: data.name,
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        totalRequests: 0,
        monthlyRequests: 0,
        createdAt: new Date(),
        isActive: true,
        userId: data.userId
      }
      mockApiKeys.push(newKey)
      return newKey
    },

    findFirst: async ({ where }: any) => {
      return mockApiKeys.find(key => 
        key.id === where.id && 
        key.userId === where.userId && 
        (!where.isActive || key.isActive)
      ) || null
    },

    update: async ({ where, data }: any) => {
      const keyIndex = mockApiKeys.findIndex(key => key.id === where.id)
      if (keyIndex !== -1) {
        mockApiKeys[keyIndex] = { ...mockApiKeys[keyIndex], ...data }
        return mockApiKeys[keyIndex]
      }
      return null
    }
  }

  $disconnect = async () => {
    // Mock disconnect
  }
}

// Export singleton instance
export const prisma = new MockPrismaClient()
