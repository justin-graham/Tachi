import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

type Provider = 'google' | 'github'
type InteractionType = 'login' | 'signup'

const providerSchema = z.enum(['google', 'github'])
const interactionTypeSchema = z.enum(['login', 'signup']).default('login')

const oauthConfig: Record<Provider, { authorizeUrl?: string; stubMessage: string }> = {
  google: {
    authorizeUrl: process.env.GOOGLE_OAUTH_AUTHORIZE_URL,
    stubMessage: 'Google OAuth is not yet configured in this environment. Please use another sign-in method.',
  },
  github: {
    authorizeUrl: process.env.GITHUB_OAUTH_AUTHORIZE_URL,
    stubMessage: 'GitHub OAuth is not yet configured in this environment. Please use another sign-in method.',
  },
}

function buildAuthorizeUrl(rawUrl: string | undefined, provider: Provider, interactionType: InteractionType) {
  if (!rawUrl) {
    return null
  }

  const clientId = provider === 'google'
    ? process.env.GOOGLE_OAUTH_CLIENT_ID
    : process.env.GITHUB_OAUTH_CLIENT_ID

  if (!clientId) {
    console.error(`Missing OAuth client ID for ${provider}`)
    return null
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/${provider}`

  try {
    const url = new URL(rawUrl)

    // Required OAuth parameters
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', `${provider}:${interactionType}`)

    // Provider-specific parameters
    if (provider === 'google') {
      url.searchParams.set('scope', 'openid email profile')
      url.searchParams.set('access_type', 'online')
      if (!url.searchParams.has('prompt')) {
        url.searchParams.set('prompt', 'select_account')
      }
    } else if (provider === 'github') {
      url.searchParams.set('scope', 'user:email read:user')
      if (!url.searchParams.has('allow_signup')) {
        url.searchParams.set('allow_signup', 'true')
      }
    }

    return url.toString()
  } catch (error) {
    console.error(`Invalid OAuth authorize URL for ${provider}:`, error)
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const providerResult = providerSchema.safeParse(req.query.provider)

  if (!providerResult.success) {
    return res.status(400).json({ error: 'Unsupported OAuth provider requested' })
  }

  const provider = providerResult.data

  const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type
  const interactionType = interactionTypeSchema.parse(rawType ?? 'login')

  const redirectUrl = buildAuthorizeUrl(oauthConfig[provider].authorizeUrl, provider, interactionType)

  if (!redirectUrl) {
    return res.status(501).json({
      success: false,
      provider,
      type: interactionType,
      code: 'OAUTH_NOT_CONFIGURED',
      message: oauthConfig[provider].stubMessage,
    })
  }

  return res.status(200).json({
    success: true,
    provider,
    type: interactionType,
    redirectUrl,
  })
}
