import { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile, mapRow } from '@/lib/server/publisher-profile'

const UpdateWebhookSchema = z.object({
  webhookUrl: z
    .string()
    .url('Webhook URL must be a valid URL')
    .max(1_000, 'Webhook URL too long')
    .optional()
    .or(z.literal('').transform(() => null))
    .or(z.null()),
  secret: z
    .string()
    .min(8, 'Secret must be at least 8 characters')
    .max(256, 'Secret too long')
    .optional()
    .or(z.literal('').transform(() => null))
    .or(z.null()),
  rotateSecret: z.boolean().optional(),
})

function createSecretPreview(secret: string) {
  const suffix = secret.slice(-6)
  return `••••${suffix}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = await authenticatePublisher(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await ensurePublisherProfile(auth.userId)

    if (req.method === 'GET') {
      return handleGet(auth.userId, res)
    }
    if (req.method === 'PUT') {
      return handlePut(auth.userId, req, res)
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Publisher webhook handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGet(userId: string, res: NextApiResponse) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('publisher_profiles')
    .select('webhook_url, webhook_secret, webhook_secret_preview, webhook_rotated_at')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Failed to fetch webhook config:', error)
    return res.status(500).json({ error: 'Failed to load webhook configuration' })
  }

  return res.status(200).json({
    webhookUrl: data?.webhook_url ?? null,
    hasSecret: Boolean(data?.webhook_secret),
    secretPreview: data?.webhook_secret_preview ?? null,
    lastRotatedAt: data?.webhook_rotated_at ?? null,
  })
}

async function handlePut(userId: string, req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const parsed = UpdateWebhookSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() })
  }

  const { webhookUrl, secret, rotateSecret } = parsed.data

  let generatedSecret: string | undefined
  let secretToStore: string | null | undefined
  let secretPreview: string | null | undefined

  if (rotateSecret) {
    generatedSecret = randomBytes(32).toString('hex')
    secretToStore = createHash('sha256').update(generatedSecret).digest('hex')
    secretPreview = createSecretPreview(generatedSecret)
  } else if (secret !== undefined) {
    if (secret === null) {
      secretToStore = null
      secretPreview = null
    } else {
      secretToStore = createHash('sha256').update(secret).digest('hex')
      secretPreview = createSecretPreview(secret)
    }
  }

  const updatePayload: Record<string, any> = {}

  if (webhookUrl !== undefined) {
    updatePayload.webhook_url = webhookUrl
  }

  if (secretToStore !== undefined) {
    updatePayload.webhook_secret = secretToStore
    updatePayload.webhook_secret_preview = secretPreview
    updatePayload.webhook_rotated_at = secretToStore ? new Date().toISOString() : null
  }

  if (Object.keys(updatePayload).length === 0) {
    return res.status(400).json({ error: 'No changes provided' })
  }

  const { data, error } = await supabaseAdmin
    .from('publisher_profiles')
    .update(updatePayload)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !data) {
    console.error('Failed to update webhook config:', error)
    return res.status(500).json({ error: 'Failed to update webhook configuration' })
  }

  const profile = mapRow(data)

  return res.status(200).json({
    webhookUrl: profile.webhookUrl,
    secretPreview: profile.webhookSecretPreview,
    lastRotatedAt: profile.webhookRotatedAt,
    rotatedSecret: rotateSecret ? generatedSecret : undefined,
  })
}
