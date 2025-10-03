import { NextApiRequest, NextApiResponse } from 'next'
import { verifyJWT, getSession, getUserById, updateUserLastActive, extractTokenFromHeader } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Try JWT token first
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)
    
    let user = null
    
    if (token) {
      const payload = verifyJWT(token)
      if (payload && payload.userId) {
        user = await getUserById(payload.userId)
        if (user) {
          await updateUserLastActive(user.id)
        }
      }
    }
    
    // Try session cookie if JWT failed
    if (!user && req.cookies['tachi-session']) {
      const session = await getSession(req.cookies['tachi-session'])
      if (session) {
        user = await getUserById(session.userId)
        if (user) {
          await updateUserLastActive(user.id)
        }
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        address: user.address,
        userType: user.userType,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        profile: user.profile
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}