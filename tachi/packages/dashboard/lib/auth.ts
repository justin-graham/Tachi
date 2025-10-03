import { verifyMessage } from 'viem'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase'
import type { Database } from './supabase'

// Types
export interface User {
  id: string
  address: string
  userType: 'publisher' | 'crawler'
  createdAt: Date
  lastActiveAt: Date
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
  permissions: string[]
  expiresAt?: Date
  lastUsedAt?: Date
  isActive: boolean
  createdAt: Date
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'
const NONCE_EXPIRY = 10 * 60 * 1000 // 10 minutes

// Database client
if (!supabaseAdmin) {
  throw new Error('Supabase admin client not available - check SUPABASE_SERVICE_ROLE_KEY')
}

// Nonce management
export function generateNonce(): string {
  return randomBytes(32).toString('hex')
}

export async function storeNonce(address: string, nonce: string): Promise<void> {
  const expiresAt = new Date(Date.now() + NONCE_EXPIRY)
  
  await supabaseAdmin
    .from('auth_nonces')
    .insert({
      address: address.toLowerCase(),
      nonce,
      expires_at: expiresAt.toISOString()
    })
}

export async function validateAndConsumeNonce(address: string, nonce: string): Promise<boolean> {
  const { data: stored, error } = await supabaseAdmin
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
  await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      address: address.toLowerCase(),
      user_type: userType
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
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

export async function getUserByAddress(address: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
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
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
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
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

export async function updateUserLastActive(userId: string): Promise<void> {
  await supabaseAdmin
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId)
}

// JWT token management
export function generateJWT(user: User): string {
  const payload = {
    userId: user.id,
    address: user.address,
    userType: user.userType,
    iat: Math.floor(Date.now() / 1000)
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Session management
export async function createSession(user: User): Promise<AuthSession | null> {
  const sessionToken = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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
  await supabaseAdmin
    .from('user_sessions')
    .delete()
    .eq('session_token', sessionId)
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await supabaseAdmin
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

export async function createApiKey(
  userId: string,
  name: string,
  permissions: string[] = ['read'],
  expiresAt?: Date
): Promise<{ apiKey: ApiKey; plainKey: string } | null> {
  const plainKey = generateApiKey()
  const keyHash = hashApiKey(plainKey)
  
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      permissions,
      expires_at: expiresAt?.toISOString()
    })
    .select()
    .single()
  
  if (error || !data) {
    console.error('Failed to create API key:', error)
    return null
  }
  
  const apiKey: ApiKey = {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    keyHash: data.key_hash,
    permissions: data.permissions,
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
    isActive: true,
    createdAt: new Date(data.created_at)
  }
  
  return { apiKey, plainKey }
}

export async function validateApiKey(plainKey: string): Promise<ApiKey | null> {
  const keyHash = hashApiKey(plainKey)
  
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Check if expired
  if (data.expires_at && new Date() > new Date(data.expires_at)) {
    return null
  }
  
  // Update last used timestamp
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
  
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    keyHash: data.key_hash,
    permissions: data.permissions,
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    lastUsedAt: new Date(),
    isActive: true,
    createdAt: new Date(data.created_at)
  }
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
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
    permissions: item.permissions,
    expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
    lastUsedAt: item.last_used_at ? new Date(item.last_used_at) : undefined,
    isActive: !item.expires_at || new Date() <= new Date(item.expires_at),
    createdAt: new Date(item.created_at)
  }))
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId)
  
  return !error
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