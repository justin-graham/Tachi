import { NextApiRequest, NextApiResponse } from 'next'
import { verifyJWT, getSession, getUserById, revokeApiKey, extractTokenFromHeader } from '@/lib/auth'

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

    const { keyId } = req.query
    
    if (!keyId || typeof keyId !== 'string') {
      return res.status(400).json({ error: 'Invalid key ID' })
    }

    if (req.method === 'DELETE') {
      // Revoke API key
      const success = await revokeApiKey(keyId, auth.userId)
      
      if (!success) {
        return res.status(404).json({ error: 'API key not found' })
      }
      
      return res.status(200).json({ success: true })
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API key management error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}