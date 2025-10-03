import { NextApiRequest, NextApiResponse } from 'next'
import { verifyJWT, getSession, getUserById, createApiKey, getUserApiKeys, extractTokenFromHeader } from '@/lib/auth'
import { z } from 'zod'

const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  permissions: z.array(z.string()).default(['read']),
  expiresAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined)
})

async function authenticateRequest(req: NextApiRequest): Promise<any> {
  // Try JWT token first
  const authHeader = req.headers.authorization
  const token = extractTokenFromHeader(authHeader)
  
  if (token) {
    const payload = verifyJWT(token)
    if (payload && payload.userId) {
      const user = await getUserById(payload.userId)
      if (user) return { user, userId: user.id }
    }
  }
  
  // Try session cookie
  if (req.cookies['tachi-session']) {
    const session = await getSession(req.cookies['tachi-session'])
    if (session) {
      const user = await getUserById(session.userId)
      if (user) return { user, userId: user.id }
    }
  }
  
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      // Get user's API keys
      const apiKeys = await getUserApiKeys(auth.userId)
      
      // Don't expose the actual key hash
      const safeKeys = apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        permissions: key.permissions,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
        createdAt: key.createdAt
      }))
      
      return res.status(200).json({ apiKeys: safeKeys })
    }
    
    if (req.method === 'POST') {
      // Create new API key
      const { name, permissions, expiresAt } = CreateApiKeySchema.parse(req.body)
      
      const result = await createApiKey(auth.userId, name, permissions, expiresAt)
      
      if (!result) {
        return res.status(500).json({ error: 'Failed to create API key' })
      }
      
      const { apiKey, plainKey } = result
      
      return res.status(201).json({
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt
        },
        plainKey // Only shown once
      })
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      })
    }
    
    console.error('API keys error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}