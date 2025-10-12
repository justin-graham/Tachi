import { verifyMessage } from 'viem'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase'

// Types
export interface User {
  id: string
  address: string | null
  userType: 'publisher' | 'crawler'
  createdAt: Date
  lastActiveAt: Date
  onboardingCompleted: boolean
  emailVerified: boolean
  profile?: {
    name?: string
    email?: string
    website?: string
  }
}

export interface AuthSession {
  userId: string
  address: string
  userType: 'publisher' | 'crawler'
  sessionId: string
  expiresAt: Date
}

export interface ApiKey {
  id: string
  userId: string
  name: string
  keyHash: string
  createdAt: Date
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '7d'
const NONCE_EXPIRY = 10 * 60 * 1000 // 10 minutes

// Validate JWT_SECRET is set in production
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production. ' +
      'Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    )
  }
  // Use a default only in development for convenience, but warn
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using insecure default for development only!')
}

const effectiveJWTSecret = JWT_SECRET || 'insecure-development-secret-change-immediately'

type SupabaseAdminClient = NonNullable<typeof supabaseAdmin>

const missingServiceRoleMessage =
  'Supabase service role key not configured. Set SUPABASE_SERVICE_ROLE_KEY and run Supabase migrations.'

function requireSupabaseAdmin(): SupabaseAdminClient {
  if (!supabaseAdmin) {
    throw new Error(missingServiceRoleMessage)
  }
  return supabaseAdmin
}

// Nonce management
export function generateNonce(): string {
  return randomBytes(32).toString('hex')
}

export async function storeNonce(address: string, nonce: string): Promise<void> {
  const expiresAt = new Date(Date.now() + NONCE_EXPIRY)
  const admin = requireSupabaseAdmin()
  
  await admin
    .from('auth_nonces')
    .insert({
      address: address.toLowerCase(),
      nonce,
      expires_at: expiresAt.toISOString()
    })
}

export async function validateAndConsumeNonce(address: string, nonce: string): Promise<boolean> {
  const admin = requireSupabaseAdmin()
  const { data: stored, error } = await admin
    .from('auth_nonces')
    .select('*')
    .eq('address', address.toLowerCase())
    .eq('nonce', nonce)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !stored) {
    return false
  }
  
  // Consume the nonce by deleting it
  await admin
    .from('auth_nonces')
    .delete()
    .eq('id', stored.id)
  
  return true
}

// Signature verification
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
    return isValid
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

// User management
export async function createUser(address: string, userType: 'publisher' | 'crawler'): Promise<User | null> {
  const admin = requireSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .insert({
      address: address.toLowerCase(),
      user_type: userType,
      onboarding_completed: false,
      email_verified: false
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to create user:', error)
    return null
  }

  return {
    id: data.id,
    address: data.address,
    userType: data.user_type as 'publisher' | 'crawler',
    createdAt: new Date(data.created_at),
    lastActiveAt: new Date(data.last_active_at),
    onboardingCompleted: data.onboarding_completed ?? false,
    emailVerified: data.email_verified ?? false,
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

export async function getUserByAddress(address: string): Promise<User | null> {
  const admin = requireSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('address', address.toLowerCase())
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    address: data.address,
    userType: data.user_type as 'publisher' | 'crawler',
    createdAt: new Date(data.created_at),
    lastActiveAt: new Date(data.last_active_at),
    onboardingCompleted: data.onboarding_completed ?? false,
    emailVerified: data.email_verified ?? false,
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const admin = requireSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    address: data.address,
    userType: data.user_type as 'publisher' | 'crawler',
    createdAt: new Date(data.created_at),
    lastActiveAt: new Date(data.last_active_at),
    onboardingCompleted: data.onboarding_completed ?? false,
    emailVerified: data.email_verified ?? false,
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const admin = requireSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    address: data.address,
    userType: data.user_type as 'publisher' | 'crawler',
    createdAt: new Date(data.created_at),
    lastActiveAt: new Date(data.last_active_at),
    onboardingCompleted: data.onboarding_completed ?? false,
    emailVerified: data.email_verified ?? false,
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

export async function updateUserLastActive(userId: string): Promise<void> {
  const admin = requireSupabaseAdmin()
  await admin
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId)
}

export async function markOnboardingComplete(userId: string): Promise<boolean> {
  const admin = requireSupabaseAdmin()
  const { error } = await admin
    .from('users')
    .update({ onboarding_completed: true })
    .eq('id', userId)

  return !error
}

// JWT token management
export function generateJWT(user: User): string {
  const payload = {
    userId: user.id,
    address: user.address,
    userType: user.userType,
    iat: Math.floor(Date.now() / 1000)
  }

  return jwt.sign(payload, effectiveJWTSecret, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, effectiveJWTSecret)
  } catch (error) {
    return null
  }
}

export function refreshJWT(oldToken: string): string | null {
  try {
    const payload = jwt.verify(oldToken, effectiveJWTSecret, { ignoreExpiration: true }) as any

    // Check if token is expired by more than 24 hours (grace period)
    const gracePeriod = 24 * 60 * 60 // 24 hours in seconds
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && now - payload.exp > gracePeriod) {
      // Token expired beyond grace period
      return null
    }

    // Generate new token with same userId, address, and userType
    const newPayload = {
      userId: payload.userId,
      address: payload.address,
      userType: payload.userType,
      iat: now
    }

    return jwt.sign(newPayload, effectiveJWTSecret, { expiresIn: JWT_EXPIRES_IN })
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

// Session management
export async function createSession(user: User): Promise<AuthSession | null> {
  const sessionToken = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const admin = requireSupabaseAdmin()
  
  const { data, error } = await admin
    .from('user_sessions')
    .insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()
  
  if (error || !data) {
    console.error('Failed to create session:', error)
    return null
  }
  
  return {
    userId: user.id,
    address: user.address,
    userType: user.userType,
    sessionId: sessionToken,
    expiresAt
  }
}

export async function getSession(sessionId: string): Promise<AuthSession | null> {
  const admin = requireSupabaseAdmin()
  const { data, error } = await admin
    .from('user_sessions')
    .select(`
      *,
      users!inner(*)
    `)
    .eq('session_token', sessionId)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data || !data.users) {
    return null
  }
  
  const user = data.users as any
  
  return {
    userId: data.user_id,
    address: user.address,
    userType: user.user_type as 'publisher' | 'crawler',
    sessionId: data.session_token,
    expiresAt: new Date(data.expires_at)
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  const admin = requireSupabaseAdmin()
  await admin
    .from('user_sessions')
    .delete()
    .eq('session_token', sessionId)
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const admin = requireSupabaseAdmin()
  await admin
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
}

// API Key management
export function generateApiKey(): string {
  const prefix = 'tachi_'
  const key = randomBytes(32).toString('hex')
  return `${prefix}${key}`
}

export function hashApiKey(apiKey: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

export async function createApiKey(userId: string, name: string): Promise<{ apiKey: ApiKey; plainKey: string } | null> {
  const plainKey = generateApiKey()
  const keyHash = hashApiKey(plainKey)
  const admin = requireSupabaseAdmin()

  const { data, error } = await admin
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      permissions: ['read']
    })
    .select('id, user_id, name, key_hash, created_at')
    .single()

  if (error || !data) {
    console.error('Failed to create API key:', error)
    return null
  }

  return {
    apiKey: {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      keyHash: data.key_hash,
      createdAt: new Date(data.created_at)
    },
    plainKey
  }
}

export async function validateApiKey(plainKey: string): Promise<ApiKey | null> {
  const keyHash = hashApiKey(plainKey)
  const admin = requireSupabaseAdmin()

  const { data, error } = await admin
    .from('api_keys')
    .select('id, user_id, name, key_hash, created_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    keyHash: data.key_hash,
    createdAt: new Date(data.created_at)
  }
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const admin = requireSupabaseAdmin()
  const { data, error } = await admin
    .from('api_keys')
    .select('id, user_id, name, key_hash, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    name: item.name,
    keyHash: item.key_hash,
    createdAt: new Date(item.created_at)
  }))
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const admin = requireSupabaseAdmin()
  const { error } = await admin
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to revoke API key:', error)
    return false
  }

  return true
}

// Authentication flow helpers
export function createAuthMessage(address: string, nonce: string): string {
  return `Welcome to Tachi Protocol!

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 24 hours.

Wallet address:
${address}

Nonce:
${nonce}`
}

export async function authenticateUser(
  address: string,
  signature: string,
  nonce: string,
  userType: 'publisher' | 'crawler'
): Promise<{ success: boolean; user?: User; token?: string; session?: AuthSession; error?: string }> {
  try {
    // Validate nonce
    const isValidNonce = await validateAndConsumeNonce(address, nonce)
    if (!isValidNonce) {
      return { success: false, error: 'Invalid or expired nonce' }
    }
    
    // Verify signature
    const message = createAuthMessage(address, nonce)
    const isValidSignature = await verifyWalletSignature(address, message, signature)
    
    if (!isValidSignature) {
      return { success: false, error: 'Invalid signature' }
    }
    
    // Get or create user
    let user = await getUserByAddress(address)
    if (!user) {
      user = await createUser(address, userType)
      if (!user) {
        return { success: false, error: 'Failed to create user' }
      }
    } else {
      await updateUserLastActive(user.id)
    }
    
    // Generate JWT and session
    const token = generateJWT(user)
    const session = await createSession(user)
    
    if (!session) {
      return { success: false, error: 'Failed to create session' }
    }
    
    return {
      success: true,
      user,
      token,
      session
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

// Middleware helpers
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('ApiKey ')) {
    return null
  }
  return authHeader.substring(7)
}
