import { NextApiRequest, NextApiResponse } from 'next'
import { verifyJWT, getSession, getUserById, validateApiKey, extractTokenFromHeader, extractApiKeyFromHeader, updateUserLastActive } from './auth'

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string
    address: string
    userType: 'publisher' | 'crawler'
    createdAt: Date
    lastActiveAt: Date
    profile?: any
  }
  apiKey?: {
    id: string
    userId: string
    name: string
    permissions: string[]
    lastUsedAt?: Date
  }
  authMethod?: 'jwt' | 'session' | 'apikey'
}

export type AuthOptions = {
  required?: boolean
  allowApiKey?: boolean
  requirePermissions?: string[]
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
      requirePermissions = [],
      allowUserTypes = ['publisher', 'crawler']
    } = options

    try {
      let user = null
      let apiKey = null
      let authMethod = null

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

      // Try session cookie if JWT failed
      if (!user && req.cookies['tachi-session']) {
        const session = await getSession(req.cookies['tachi-session'])
        if (session) {
          user = await getUserById(session.userId)
          if (user) {
            await updateUserLastActive(user.id)
            authMethod = 'session'
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

      // Check API key permissions
      if (apiKey && requirePermissions.length > 0) {
        const hasAllPermissions = requirePermissions.every(
          permission => apiKey.permissions.includes(permission) || apiKey.permissions.includes('admin')
        )
        
        if (!hasAllPermissions) {
          return res.status(403).json({ 
            error: 'Insufficient API key permissions',
            required: requirePermissions,
            granted: apiKey.permissions
          })
        }
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

export const requireApiKey = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>, permissions: string[] = []) =>
  withAuth(handler, { required: true, allowApiKey: true, requirePermissions: permissions })

export const optionalAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) =>
  withAuth(handler, { required: false })

// Helper function to check permissions in handlers
export function hasPermission(req: AuthenticatedRequest, permission: string): boolean {
  if (req.apiKey) {
    return req.apiKey.permissions.includes(permission) || req.apiKey.permissions.includes('admin')
  }
  return true // JWT/session auth has full permissions by default
}

// Helper function to check if user owns resource
export function isResourceOwner(req: AuthenticatedRequest, resourceUserId: string): boolean {
  return req.user?.id === resourceUserId
}