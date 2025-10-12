import { NextApiRequest, NextApiResponse } from 'next'
import { verifyJWT, getUserById, validateApiKey, extractTokenFromHeader, extractApiKeyFromHeader, updateUserLastActive } from './auth'

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string
    address: string
    userType: 'publisher' | 'crawler'
    createdAt: Date
    lastActiveAt: Date
    profile?: Record<string, unknown>
  }
  apiKey?: {
    id: string
    userId: string
    name: string
  }
  authMethod?: 'jwt' | 'apikey'
}

export type AuthOptions = {
  required?: boolean
  allowApiKey?: boolean
  allowUserTypes?: ('publisher' | 'crawler')[]
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: AuthOptions = {}
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const {
      required = true,
      allowApiKey = true,
      allowUserTypes = ['publisher', 'crawler']
    } = options

    try {
      let user: Awaited<ReturnType<typeof getUserById>> | null = null
      let apiKey: Awaited<ReturnType<typeof validateApiKey>> | null = null
      let authMethod: 'jwt' | 'apikey' | null = null

      // Try JWT token first
      const authHeader = req.headers.authorization
      const token = extractTokenFromHeader(authHeader)
      
      if (token) {
        const payload = verifyJWT(token)
        if (payload && payload.userId) {
          user = await getUserById(payload.userId)
          if (user) {
            await updateUserLastActive(user.id)
            authMethod = 'jwt'
          }
        }
      }

      // Try API key if allowed and other methods failed
      if (!user && allowApiKey) {
        const apiKeyString = extractApiKeyFromHeader(authHeader)
        if (apiKeyString) {
          apiKey = await validateApiKey(apiKeyString)
          if (apiKey) {
            user = await getUserById(apiKey.userId)
            if (user) {
              await updateUserLastActive(user.id)
              authMethod = 'apikey'
            }
          }
        }
      }

      // Check if authentication is required
      if (required && !user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          hint: 'Use Authorization header with Bearer token or ApiKey'
        })
      }

      // Check user type restrictions
      if (user && allowUserTypes.length > 0 && !allowUserTypes.includes(user.userType)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          hint: `Requires one of: ${allowUserTypes.join(', ')}`
        })
      }

      // Attach user and auth info to request
      req.user = user
      req.apiKey = apiKey
      req.authMethod = authMethod

      // Call the actual handler
      return await handler(req, res)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Convenience middleware functions
export const requireAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) =>
  withAuth(handler, { required: true })

export const requirePublisher = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) =>
  withAuth(handler, { required: true, allowUserTypes: ['publisher'] })

export const requireCrawler = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) =>
  withAuth(handler, { required: true, allowUserTypes: ['crawler'] })

export const requireApiKey = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) =>
  withAuth(handler, { required: true, allowApiKey: true })

export const optionalAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) =>
  withAuth(handler, { required: false })

// Helper function to check permissions in handlers
export function isResourceOwner(req: AuthenticatedRequest, resourceUserId: string): boolean {
  return req.user?.id === resourceUserId
}
