import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { createSession, generateJWT, updateUserLastActive } from '@/lib/auth'

type Provider = 'google' | 'github'

const providerSchema = z.enum(['google', 'github'])

interface OAuthUserInfo {
  email: string
  name?: string
  picture?: string
  sub: string
}

async function exchangeCodeForToken(provider: Provider, code: string): Promise<string | null> {
  const clientId = provider === 'google'
    ? process.env.GOOGLE_OAUTH_CLIENT_ID
    : process.env.GITHUB_OAUTH_CLIENT_ID
  const clientSecret = provider === 'google'
    ? process.env.GOOGLE_OAUTH_CLIENT_SECRET
    : process.env.GITHUB_OAUTH_CLIENT_SECRET
  const tokenUrl = provider === 'google'
    ? 'https://oauth2.googleapis.com/token'
    : 'https://github.com/login/oauth/access_token'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/${provider}`

  if (!clientId || !clientSecret) {
    console.error(`${provider} OAuth credentials not configured`)
    return null
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      console.error(`Token exchange failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('Token exchange error:', error)
    return null
  }
}

async function getUserInfo(provider: Provider, accessToken: string): Promise<OAuthUserInfo | null> {
  const userInfoUrl = provider === 'google'
    ? 'https://www.googleapis.com/oauth2/v2/userinfo'
    : 'https://api.github.com/user'

  try {
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`User info fetch failed: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (provider === 'google') {
      return {
        email: data.email,
        name: data.name,
        picture: data.picture,
        sub: data.id,
      }
    } else {
      // GitHub
      // Get email separately if needed
      let email = data.email
      if (!email) {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        })
        if (emailResponse.ok) {
          const emails = await emailResponse.json()
          const primaryEmail = emails.find((e: any) => e.primary)
          email = primaryEmail?.email || emails[0]?.email
        }
      }

      return {
        email,
        name: data.name || data.login,
        picture: data.avatar_url,
        sub: data.id.toString(),
      }
    }
  } catch (error) {
    console.error('User info fetch error:', error)
    return null
  }
}

// Helper to get or create user from email
async function getUserByEmail(email: string) {
  // This function needs to be implemented in lib/auth.ts
  // For now, we'll use a workaround
  const { supabaseAdmin } = require('@/lib/supabase')
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
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
    profile: {
      name: data.name || undefined,
      email: data.email || undefined,
      website: data.website || undefined
    }
  }
}

async function createOAuthUser(email: string, name: string | undefined, userType: 'publisher' | 'crawler') {
  const { supabaseAdmin } = require('@/lib/supabase')
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      name: name || email.split('@')[0],
      user_type: userType,
      // No address for OAuth users initially
      address: null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to create OAuth user:', error)
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const providerResult = providerSchema.safeParse(req.query.provider)

  if (!providerResult.success) {
    return res.status(400).json({ error: 'Unsupported OAuth provider' })
  }

  const provider = providerResult.data
  const { code, state, error: oauthError } = req.query

  // Handle OAuth errors
  if (oauthError) {
    console.error(`OAuth error from ${provider}:`, oauthError)
    return res.redirect(`/auth/login?error=oauth_failed&provider=${provider}`)
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' })
  }

  // Parse state to determine if this is login or signup and user type
  let interactionType: 'login' | 'signup' = 'login'
  let userType: 'publisher' | 'crawler' = 'publisher'

  if (state && typeof state === 'string') {
    const [_, type, subtype] = state.split(':')
    if (type === 'login' || type === 'signup') {
      interactionType = type
    }
    if (subtype === 'publisher' || subtype === 'crawler') {
      userType = subtype
    }
  }

  try {
    // Step 1: Exchange code for access token
    const accessToken = await exchangeCodeForToken(provider, code)
    if (!accessToken) {
      return res.redirect(`/auth/login?error=token_exchange_failed&provider=${provider}`)
    }

    // Step 2: Get user info from provider
    const userInfo = await getUserInfo(provider, accessToken)
    if (!userInfo || !userInfo.email) {
      return res.redirect(`/auth/login?error=no_email&provider=${provider}`)
    }

    // Step 3: Get or create user
    let user = await getUserByEmail(userInfo.email)

    if (!user && interactionType === 'signup') {
      // Create new user
      user = await createOAuthUser(userInfo.email, userInfo.name, userType)
      if (!user) {
        return res.redirect(`/auth/signup?error=user_creation_failed`)
      }
    } else if (!user && interactionType === 'login') {
      // User doesn't exist, redirect to signup
      return res.redirect(`/auth/signup?error=user_not_found&email=${encodeURIComponent(userInfo.email)}`)
    } else if (user) {
      // Update last active
      await updateUserLastActive(user.id)
    }

    if (!user) {
      return res.redirect(`/auth/login?error=authentication_failed`)
    }

    // Step 4: Create session and JWT
    const token = generateJWT(user)
    const session = await createSession(user)

    if (!session) {
      return res.redirect(`/auth/login?error=session_creation_failed`)
    }

    // Set HTTP-only cookie for session
    const forwardedProto = (req.headers['x-forwarded-proto'] || '').toString()
    const isSecureRequest = req.socket.encrypted || forwardedProto.includes('https')
    const sameSite = isSecureRequest ? 'None' : 'Lax'
    // Browsers demand Secure when SameSite=None; in plain HTTP dev we fall back to Lax without Secure so the cookie sticks.
    const secureFlag = isSecureRequest ? ['Secure'] : []
    const cookieOptions = [
      `tachi-session=${session.sessionId}`,
      'HttpOnly',
      ...secureFlag,
      `SameSite=${sameSite}`,
      `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
      'Path=/'
    ].join('; ')

    res.setHeader('Set-Cookie', cookieOptions)

    // Redirect to appropriate page
    // If new user (signup), go to onboarding
    // If existing user (login), go to dashboard
    const redirectUrl = interactionType === 'signup'
      ? '/onboarding'
      : '/dashboard'

    return res.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return res.redirect(`/auth/login?error=unexpected_error&provider=${provider}`)
  }
}
