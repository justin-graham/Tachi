import { NextApiRequest } from 'next'
import {
  extractTokenFromHeader,
  getSession,
  getUserById,
  verifyJWT,
  type User,
} from '@/lib/auth'

export interface AuthenticatedPublisher {
  user: User
  userId: string
  sessionId?: string
}

/**
 * Resolves the authenticated publisher from an API request.
 * Supports both bearer JWTs and cookie-based sessions.
 */
export async function authenticatePublisher(req: NextApiRequest): Promise<AuthenticatedPublisher | null> {
  // Prefer Authorization header so API clients can use bearer tokens.
  const token = extractTokenFromHeader(req.headers.authorization)
  if (token) {
    try {
      const payload = verifyJWT(token)
      if (payload?.userId) {
        const user = await getUserById(payload.userId)
        if (user && user.userType === 'publisher') {
          return { user, userId: user.id }
        }
      }
    } catch (error) {
      console.warn('Bearer authentication failed:', error)
      // Fall back to session cookie flow.
    }
  }

  // Fallback to session cookie
  const sessionToken = req.cookies['tachi-session']
  if (!sessionToken) {
    return null
  }

  const session = await getSession(sessionToken)
  if (!session) {
    return null
  }

  const user = await getUserById(session.userId)
  if (!user || user.userType !== 'publisher') {
    return null
  }

  return { user, userId: user.id, sessionId: session.sessionId }
}
